// ──────────────────────────────────────────────
// NINE — Prime Grid PvP Hook
// Server-authoritative: solution stays on server,
// number scoring, cross-board cell locking, escrow
// ──────────────────────────────────────────────

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { Cell, Difficulty, Grid, GridRow } from '../types/game';
import { calculateDigitValues, ENTRY_FEES, TROPHY_DELTAS, MAX_MISTAKES } from '../lib/economy';
import { generatePuzzle, getPeers } from '../lib/sudoku';

// ─── Types ───────────────────────────────────

interface LockedCell {
  row: number;
  col: number;
  value: number;
  playerId: string;
  points: number;
}

interface PvPState {
  grid: Grid | null;
  solutionGrid: Grid | null;
  selectedCell: { row: number; col: number } | null;
  isPencilMode: boolean;
  errors: Set<string>;
  mistakes: number;
  isComplete: boolean;
  isGameOver: boolean;

  // PvP-specific
  myScore: number;
  opponentScore: number;
  lockedCells: Set<string>;        // cells locked by opponent
  myLockedCells: Set<string>;      // cells I locked (for opponent)
  digitValues: Record<number, number>;
  opponentMistakes: number;
  opponentProgress: number;        // percentage filled
  matchResult: 'win' | 'loss' | 'draw' | null;

  // Animation
  lastCorrectCell: { row: number; col: number } | null;
  lastErrorCell: { row: number; col: number } | null;
  scorePopup: { row: number; col: number; points: number } | null;
}

type PvPAction =
  | { type: 'INIT'; difficulty: Difficulty }
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'FILL_CELL'; value: number }
  | { type: 'ERASE_CELL' }
  | { type: 'TOGGLE_PENCIL' }
  | { type: 'OPPONENT_LOCK'; row: number; col: number; value: number; points: number }
  | { type: 'OPPONENT_MISTAKE' }
  | { type: 'OPPONENT_PROGRESS'; fillPercent: number }
  | { type: 'MATCH_END'; result: 'win' | 'loss' | 'draw'; myFinal: number; opFinal: number }
  | { type: 'CLEAR_ANIMATION' };

// ─── Helpers ─────────────────────────────────

const SIZE = 9;

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

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

function countGivenDigits(grid: Grid): Record<number, number> {
  const counts: Record<number, number> = {};
  for (let d = 1; d <= 9; d++) counts[d] = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c].value;
      if (v !== null && grid[r][c].isGiven) {
        counts[v]++;
      }
    }
  }
  return counts;
}

function checkComplete(grid: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c].value === null || !grid[r][c].isValid) return false;
    }
  }
  return true;
}

function makeInitialState(): PvPState {
  return {
    grid: null,
    solutionGrid: null,
    selectedCell: null,
    isPencilMode: false,
    errors: new Set(),
    mistakes: 0,
    isComplete: false,
    isGameOver: false,
    myScore: 0,
    opponentScore: 0,
    lockedCells: new Set(),
    myLockedCells: new Set(),
    digitValues: {},
    opponentMistakes: 0,
    opponentProgress: 0,
    matchResult: null,
    lastCorrectCell: null,
    lastErrorCell: null,
    scorePopup: null,
  };
}

// ─── Reducer ─────────────────────────────────

function pvpReducer(state: PvPState, action: PvPAction): PvPState {
  switch (action.type) {
    case 'INIT': {
      const puzzle = generatePuzzle(action.difficulty);
      const grid = cloneGrid(puzzle.initial);
      const givenCounts = countGivenDigits(grid);
      const digitValues = calculateDigitValues(givenCounts);

      return {
        ...makeInitialState(),
        grid,
        solutionGrid: puzzle.solved,
        digitValues,
      };
    }

    case 'SELECT_CELL': {
      if (state.isGameOver || state.isComplete || state.matchResult) return state;
      return { ...state, selectedCell: { row: action.row, col: action.col } };
    }

    case 'FILL_CELL': {
      const { grid, solutionGrid, selectedCell, isPencilMode, lockedCells } = state;
      if (!grid || !solutionGrid || !selectedCell) return state;
      if (state.isGameOver || state.isComplete || state.matchResult) return state;

      const { row, col } = selectedCell;
      const key = cellKey(row, col);
      const cell = grid[row][col];

      // Can't modify given cells or opponent-locked cells
      if (cell.isGiven || lockedCells.has(key)) return state;

      const nextGrid = cloneGrid(grid);
      const nextErrors = new Set(state.errors);
      let nextMistakes = state.mistakes;
      let nextMyScore = state.myScore;

      if (isPencilMode) {
        if (nextGrid[row][col].value !== null) return state;
        const marks = nextGrid[row][col].pencilMarks;
        if (marks.has(action.value)) marks.delete(action.value);
        else marks.add(action.value);
        return { ...state, grid: nextGrid };
      }

      // Toggle off
      if (nextGrid[row][col].value === action.value) {
        nextGrid[row][col].value = null;
        nextGrid[row][col].isValid = true;
        nextErrors.delete(key);
        return {
          ...state,
          grid: nextGrid,
          errors: nextErrors,
          isComplete: false,
          lastCorrectCell: null,
          lastErrorCell: null,
          scorePopup: null,
        };
      }

      nextGrid[row][col].value = action.value;
      nextGrid[row][col].pencilMarks.clear();

      const correct = solutionGrid[row][col].value === action.value;
      nextGrid[row][col].isValid = correct;

      let lastCorrectCell = null;
      let lastErrorCell = null;
      let scorePopup = null;

      if (correct) {
        nextErrors.delete(key);
        lastCorrectCell = { row, col };

        // Award points for this digit
        const points = state.digitValues[action.value] ?? 10;
        nextMyScore += points;
        scorePopup = { row, col, points };

        // Track as my locked cell (server broadcasts to opponent)
        const nextMyLocked = new Set(state.myLockedCells);
        nextMyLocked.add(key);

        // Remove from peer pencil marks
        const peers = getPeers(row, col);
        for (const [pr, pc] of peers) {
          nextGrid[pr][pc].pencilMarks.delete(action.value);
        }

        const isComplete = checkComplete(nextGrid);

        return {
          ...state,
          grid: nextGrid,
          errors: nextErrors,
          myScore: nextMyScore,
          myLockedCells: nextMyLocked,
          isComplete,
          lastCorrectCell,
          lastErrorCell: null,
          scorePopup,
        };
      } else {
        nextErrors.add(key);
        lastErrorCell = { row, col };
        nextMistakes++;

        const isGameOver = nextMistakes >= MAX_MISTAKES;

        return {
          ...state,
          grid: nextGrid,
          errors: nextErrors,
          mistakes: nextMistakes,
          isGameOver,
          lastCorrectCell: null,
          lastErrorCell,
          scorePopup: null,
        };
      }
    }

    case 'ERASE_CELL': {
      const { grid, selectedCell, lockedCells } = state;
      if (!grid || !selectedCell) return state;
      if (state.isGameOver || state.isComplete || state.matchResult) return state;

      const { row, col } = selectedCell;
      const key = cellKey(row, col);
      const cell = grid[row][col];

      if (cell.isGiven || cell.value === null || lockedCells.has(key)) return state;

      const nextGrid = cloneGrid(grid);
      const nextErrors = new Set(state.errors);

      nextGrid[row][col].value = null;
      nextGrid[row][col].isValid = true;
      nextErrors.delete(key);

      return {
        ...state,
        grid: nextGrid,
        errors: nextErrors,
        isComplete: false,
        lastCorrectCell: null,
        lastErrorCell: null,
        scorePopup: null,
      };
    }

    case 'TOGGLE_PENCIL':
      return { ...state, isPencilMode: !state.isPencilMode };

    case 'OPPONENT_LOCK': {
      // Opponent correctly filled a cell — lock it on our board
      const { grid } = state;
      if (!grid) return state;

      const key = cellKey(action.row, action.col);
      const nextLocked = new Set(state.lockedCells);
      nextLocked.add(key);

      const nextGrid = cloneGrid(grid);
      // Show the opponent's value in that cell (greyed out)
      nextGrid[action.row][action.col].value = action.value;
      nextGrid[action.row][action.col].isValid = true;
      nextGrid[action.row][action.col].pencilMarks.clear();

      return {
        ...state,
        grid: nextGrid,
        lockedCells: nextLocked,
        opponentScore: state.opponentScore + action.points,
      };
    }

    case 'OPPONENT_MISTAKE':
      return { ...state, opponentMistakes: state.opponentMistakes + 1 };

    case 'OPPONENT_PROGRESS':
      return { ...state, opponentProgress: action.fillPercent };

    case 'MATCH_END':
      return {
        ...state,
        matchResult: action.result,
        myScore: action.myFinal,
        opponentScore: action.opFinal,
      };

    case 'CLEAR_ANIMATION':
      return { ...state, lastCorrectCell: null, lastErrorCell: null, scorePopup: null };

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────

export function usePrimeGridPvP(difficulty: Difficulty = 'medium') {
  const [state, dispatch] = useReducer(pvpReducer, makeInitialState());
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Init
  const initPvP = useCallback(() => {
    dispatch({ type: 'INIT', difficulty });
    setElapsedMs(0);
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (!state.grid || state.isComplete || state.isGameOver || state.matchResult) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsedMs((t) => t + 1000);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.grid, state.isComplete, state.isGameOver, state.matchResult]);

  // Clear animations
  useEffect(() => {
    if (state.lastCorrectCell || state.lastErrorCell || state.scorePopup) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_ANIMATION' }), 600);
      return () => clearTimeout(t);
    }
  }, [state.lastCorrectCell, state.lastErrorCell, state.scorePopup]);

  return {
    // State
    ...state,
    elapsedMs,
    entryFee: ENTRY_FEES[difficulty] ?? 100,
    trophyDelta: TROPHY_DELTAS[difficulty] ?? { win: 10, loss: 7 },

    // Actions
    initPvP,
    selectCell: useCallback((r: number, c: number) => dispatch({ type: 'SELECT_CELL', row: r, col: c }), []),
    fillCell: useCallback((v: number) => dispatch({ type: 'FILL_CELL', value: v }), []),
    eraseCell: useCallback(() => dispatch({ type: 'ERASE_CELL' }), []),
    togglePencil: useCallback(() => dispatch({ type: 'TOGGLE_PENCIL' }), []),
    opponentLock: useCallback((r: number, c: number, v: number, pts: number) =>
      dispatch({ type: 'OPPONENT_LOCK', row: r, col: c, value: v, points: pts }), []),
    opponentMistake: useCallback(() => dispatch({ type: 'OPPONENT_MISTAKE' }), []),
    setOpponentProgress: useCallback((p: number) => dispatch({ type: 'OPPONENT_PROGRESS', fillPercent: p }), []),
    endMatch: useCallback((result: 'win' | 'loss' | 'draw', myFinal: number, opFinal: number) =>
      dispatch({ type: 'MATCH_END', result, myFinal, opFinal }), []),
    clearAnimation: useCallback(() => dispatch({ type: 'CLEAR_ANIMATION' }), []),
  };
}
