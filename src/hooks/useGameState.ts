// ──────────────────────────────────────────────
// NINE — Game State Hook (single source of truth)
// ──────────────────────────────────────────────

import { useCallback, useReducer } from 'react';
import type {
  Cell,
  CharacterTheme,
  Difficulty,
  Grid,
  GridRow,
} from '../types/game';
import { generatePuzzle, getPeers } from '../lib/sudoku';
import { getThemeById } from '../lib/themes';

// ─── Constants ───────────────────────────────

const SIZE = 9;

// ─── State ───────────────────────────────────

interface GameState {
  currentGrid: Grid | null;
  initialGrid: Grid | null;
  solutionGrid: Grid | null;
  selectedCell: { row: number; col: number } | null;
  isPencilMode: boolean;
  errors: Set<string>;
  isComplete: boolean;
  activeTheme: CharacterTheme | null;
}

const INITIAL_STATE: GameState = {
  currentGrid: null,
  initialGrid: null,
  solutionGrid: null,
  selectedCell: null,
  isPencilMode: false,
  errors: new Set<string>(),
  isComplete: false,
  activeTheme: null,
};

// ─── Actions ─────────────────────────────────

type GameAction =
  | { type: 'INIT_GAME'; difficulty: Difficulty; characterId: string }
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'FILL_CELL'; value: number }
  | { type: 'TOGGLE_PENCIL' }
  | { type: 'RESET_GAME' };

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

function checkComplete(grid: Grid, errors: Set<string>): boolean {
  if (errors.size > 0) return false;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c].value === null) return false;
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
      const theme = getThemeById(action.characterId) ?? null;

      return {
        currentGrid,
        initialGrid: puzzle.initial,
        solutionGrid: puzzle.solved,
        selectedCell: null,
        isPencilMode: false,
        errors: new Set<string>(),
        isComplete: false,
        activeTheme: theme,
      };
    }

    case 'SELECT_CELL': {
      return {
        ...state,
        selectedCell: { row: action.row, col: action.col },
      };
    }

    case 'FILL_CELL': {
      const { currentGrid, solutionGrid, selectedCell, isPencilMode } = state;
      if (!currentGrid || !solutionGrid || !selectedCell) return state;

      const { row, col } = selectedCell;
      const cell = currentGrid[row][col];

      // Given cells are immutable
      if (cell.isGiven) return state;

      const nextGrid = cloneGrid(currentGrid);
      const nextErrors = new Set(state.errors);
      const key = cellKey(row, col);

      if (isPencilMode) {
        // Toggle pencil mark — only allowed when cell has no value
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

      // If same value already placed, clear it
      if (targetCell.value === action.value) {
        targetCell.value = null;
        targetCell.isValid = true;
        nextErrors.delete(key);

        return {
          ...state,
          currentGrid: nextGrid,
          errors: nextErrors,
          isComplete: false,
        };
      }

      // Set the value and clear pencil marks on this cell
      targetCell.value = action.value;
      targetCell.pencilMarks.clear();

      // Check against solution
      const correct = solutionGrid[row][col].value === action.value;
      targetCell.isValid = correct;

      if (correct) {
        nextErrors.delete(key);
      } else {
        nextErrors.add(key);
      }

      // Remove this value from pencil marks of all peers
      const peers = getPeers(row, col);
      for (const [pr, pc] of peers) {
        nextGrid[pr][pc].pencilMarks.delete(action.value);
      }

      const isComplete = checkComplete(nextGrid, nextErrors);

      return {
        ...state,
        currentGrid: nextGrid,
        errors: nextErrors,
        isComplete,
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
        isComplete: false,
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
    (difficulty: Difficulty, characterId: string) => {
      dispatch({ type: 'INIT_GAME', difficulty, characterId });
    },
    [],
  );

  const selectCell = useCallback((row: number, col: number) => {
    dispatch({ type: 'SELECT_CELL', row, col });
  }, []);

  const fillCell = useCallback((value: number) => {
    dispatch({ type: 'FILL_CELL', value });
  }, []);

  const togglePencil = useCallback(() => {
    dispatch({ type: 'TOGGLE_PENCIL' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return {
    // State
    currentGrid: state.currentGrid,
    initialGrid: state.initialGrid,
    solutionGrid: state.solutionGrid,
    selectedCell: state.selectedCell,
    isPencilMode: state.isPencilMode,
    errors: state.errors,
    isComplete: state.isComplete,
    activeTheme: state.activeTheme,

    // Actions
    initGame,
    selectCell,
    fillCell,
    togglePencil,
    resetGame,
  } as const;
}
