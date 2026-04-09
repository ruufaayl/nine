// ──────────────────────────────────────────────
// NINE — Game State Hook (Prime Grid Offline)
// 3-mistake rule, server-validated scoring
// ──────────────────────────────────────────────

import { useCallback, useReducer } from 'react';
import type {
  Cell,
  Difficulty,
  Grid,
  GridRow,
} from '../types/game';
import { generatePuzzle, getPeers } from '../lib/sudoku';
import { MAX_MISTAKES, TIME_LIMITS, calculateXP } from '../lib/economy';

// ─── Constants ───────────────────────────────

const SIZE = 9;

// ─── State ───────────────────────────────────

interface GameState {
  currentGrid: Grid | null;
  initialGrid: Grid | null;
  solutionGrid: Grid | null;
  selectedCell: { row: number; col: number } | null;
  isPencilMode: boolean;
  errors: Set<string>;        // currently wrong cells (visual)
  mistakes: number;            // permanent mistake counter (NEVER decrements)
  isComplete: boolean;
  isGameOver: boolean;         // true when mistakes >= 3
  difficulty: Difficulty;
  startTime: number;           // timestamp when game began
  lastCorrectCell: { row: number; col: number } | null;
  lastErrorCell: { row: number; col: number } | null;
}

const INITIAL_STATE: GameState = {
  currentGrid: null,
  initialGrid: null,
  solutionGrid: null,
  selectedCell: null,
  isPencilMode: false,
  errors: new Set<string>(),
  mistakes: 0,
  isComplete: false,
  isGameOver: false,
  difficulty: 'medium',
  startTime: 0,
  lastCorrectCell: null,
  lastErrorCell: null,
};

// ─── Actions ─────────────────────────────────

type GameAction =
  | { type: 'INIT_GAME'; difficulty: Difficulty }
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'FILL_CELL'; value: number }
  | { type: 'ERASE_CELL' }
  | { type: 'TOGGLE_PENCIL' }
  | { type: 'RESET_GAME' }
  | { type: 'CLEAR_ANIMATION' };

// ─── Helpers ─────────────────────────────────

function cloneCell(cell: Cell): Cell {
  return {
    row: cell.row,
    col: cell.col,
    value: cell.value,
    isGiven: cell.isGiven,
    pencilMarks: new Set(cell.pencilMarks),
    isValid: cell.isValid,
  };
}

function cloneGrid(grid: Grid): Grid {
  const rows: GridRow[] = [];
  for (let r = 0; r < SIZE; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < SIZE; c++) {
      row.push(cloneCell(grid[r][c]));
    }
    rows.push(row as GridRow);
  }
  return rows as unknown as Grid;
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function checkComplete(grid: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c].value === null || !grid[r][c].isValid) return false;
    }
  }
  return true;
}

// ─── Reducer ─────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME': {
      const puzzle = generatePuzzle(action.difficulty);
      const currentGrid = cloneGrid(puzzle.initial);

      return {
        currentGrid,
        initialGrid: puzzle.initial,
        solutionGrid: puzzle.solved,
        selectedCell: null,
        isPencilMode: false,
        errors: new Set<string>(),
        mistakes: 0,
        isComplete: false,
        isGameOver: false,
        difficulty: action.difficulty,
        startTime: Date.now(),
        lastCorrectCell: null,
        lastErrorCell: null,
      };
    }

    case 'SELECT_CELL': {
      if (state.isGameOver) return state;
      return {
        ...state,
        selectedCell: { row: action.row, col: action.col },
      };
    }

    case 'FILL_CELL': {
      const { currentGrid, solutionGrid, selectedCell, isPencilMode } = state;
      if (!currentGrid || !solutionGrid || !selectedCell) return state;
      if (state.isGameOver || state.isComplete) return state;

      const { row, col } = selectedCell;
      const cell = currentGrid[row][col];

      // Given cells and locked cells are immutable
      if (cell.isGiven) return state;

      const nextGrid = cloneGrid(currentGrid);
      const nextErrors = new Set(state.errors);
      const key = cellKey(row, col);
      let nextMistakes = state.mistakes;

      if (isPencilMode) {
        // Toggle pencil mark — only when cell is empty
        if (nextGrid[row][col].value !== null) return state;

        const marks = nextGrid[row][col].pencilMarks;
        if (marks.has(action.value)) {
          marks.delete(action.value);
        } else {
          marks.add(action.value);
        }

        return { ...state, currentGrid: nextGrid };
      }

      // Normal fill mode
      const targetCell = nextGrid[row][col];

      // If same value already placed, this is a toggle-off (erase)
      if (targetCell.value === action.value) {
        targetCell.value = null;
        targetCell.isValid = true;
        nextErrors.delete(key);

        return {
          ...state,
          currentGrid: nextGrid,
          errors: nextErrors,
          isComplete: false,
          lastCorrectCell: null,
          lastErrorCell: null,
        };
      }

      // Set the value
      targetCell.value = action.value;
      targetCell.pencilMarks.clear();

      // Check against solution — THE ONLY SOURCE OF TRUTH
      const correct = solutionGrid[row][col].value === action.value;
      targetCell.isValid = correct;

      let lastCorrectCell = null;
      let lastErrorCell = null;

      if (correct) {
        nextErrors.delete(key);
        lastCorrectCell = { row, col };

        // Remove this value from pencil marks of all peers
        const peers = getPeers(row, col);
        for (const [pr, pc] of peers) {
          nextGrid[pr][pc].pencilMarks.delete(action.value);
        }
      } else {
        nextErrors.add(key);
        lastErrorCell = { row, col };

        // PERMANENT MISTAKE — even if undone later, this counts
        nextMistakes++;
      }

      const isGameOver = nextMistakes >= MAX_MISTAKES;
      const isComplete = !isGameOver && checkComplete(nextGrid);

      return {
        ...state,
        currentGrid: nextGrid,
        errors: nextErrors,
        mistakes: nextMistakes,
        isComplete,
        isGameOver,
        lastCorrectCell,
        lastErrorCell,
      };
    }

    case 'ERASE_CELL': {
      const { currentGrid, selectedCell } = state;
      if (!currentGrid || !selectedCell) return state;
      if (state.isGameOver || state.isComplete) return state;

      const { row, col } = selectedCell;
      const cell = currentGrid[row][col];

      if (cell.isGiven || cell.value === null) return state;

      const nextGrid = cloneGrid(currentGrid);
      const nextErrors = new Set(state.errors);
      const key = cellKey(row, col);

      nextGrid[row][col].value = null;
      nextGrid[row][col].isValid = true;
      nextErrors.delete(key);

      // NOTE: mistakes counter does NOT decrement on erase

      return {
        ...state,
        currentGrid: nextGrid,
        errors: nextErrors,
        isComplete: false,
        lastCorrectCell: null,
        lastErrorCell: null,
      };
    }

    case 'TOGGLE_PENCIL': {
      return { ...state, isPencilMode: !state.isPencilMode };
    }

    case 'RESET_GAME': {
      if (!state.initialGrid) return state;

      return {
        ...state,
        currentGrid: cloneGrid(state.initialGrid),
        selectedCell: null,
        isPencilMode: false,
        errors: new Set<string>(),
        mistakes: 0,
        isComplete: false,
        isGameOver: false,
        startTime: Date.now(),
        lastCorrectCell: null,
        lastErrorCell: null,
      };
    }

    case 'CLEAR_ANIMATION': {
      return {
        ...state,
        lastCorrectCell: null,
        lastErrorCell: null,
      };
    }

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  const initGame = useCallback(
    (difficulty: Difficulty) => {
      dispatch({ type: 'INIT_GAME', difficulty });
    },
    [],
  );

  const selectCell = useCallback((row: number, col: number) => {
    dispatch({ type: 'SELECT_CELL', row, col });
  }, []);

  const fillCell = useCallback((value: number) => {
    dispatch({ type: 'FILL_CELL', value });
  }, []);

  const eraseCell = useCallback(() => {
    dispatch({ type: 'ERASE_CELL' });
  }, []);

  const togglePencil = useCallback(() => {
    dispatch({ type: 'TOGGLE_PENCIL' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const clearAnimation = useCallback(() => {
    dispatch({ type: 'CLEAR_ANIMATION' });
  }, []);

  // Derived values
  const elapsedMs = state.startTime ? Date.now() - state.startTime : 0;
  const timeLimitMs = (TIME_LIMITS[state.difficulty] ?? 900) * 1000;
  const earnedXP = state.isComplete
    ? calculateXP(state.difficulty, elapsedMs, timeLimitMs, state.mistakes)
    : 0;

  return {
    // State
    currentGrid: state.currentGrid,
    initialGrid: state.initialGrid,
    solutionGrid: state.solutionGrid,
    selectedCell: state.selectedCell,
    isPencilMode: state.isPencilMode,
    errors: state.errors,
    mistakes: state.mistakes,
    isComplete: state.isComplete,
    isGameOver: state.isGameOver,
    difficulty: state.difficulty,
    startTime: state.startTime,
    lastCorrectCell: state.lastCorrectCell,
    lastErrorCell: state.lastErrorCell,
    earnedXP,

    // Actions
    initGame,
    selectCell,
    fillCell,
    eraseCell,
    togglePencil,
    resetGame,
    clearAnimation,
  } as const;
}
