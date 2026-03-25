// ──────────────────────────────────────────────
// NINE — Glyph Grid (Wordoku) State Hook
// ──────────────────────────────────────────────

import { useCallback, useReducer } from 'react';
import type {
  GlyphCell,
  GlyphGrid,
  GlyphGridPuzzle,
  GlyphRow,
} from '../types/expanded_games';
import { generateGlyphGrid, validateGlyphMove } from '../lib/games/glyphGrid';

// ─── Constants ──────────────────────────────

const SIZE = 9;

// ─── Types ──────────────────────────────────

interface HookState {
  puzzle: GlyphGridPuzzle;
  currentGrid: GlyphGrid;
  selectedCell: { row: number; col: number } | null;
  isPencilMode: boolean;
  errors: Set<string>;
  isComplete: boolean;
}

type HookAction =
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'FILL_CELL'; char: string }
  | { type: 'CLEAR_CELL' }
  | { type: 'TOGGLE_PENCIL' }
  | { type: 'RESET' };

// ─── Helpers ────────────────────────────────

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function cloneGrid(grid: GlyphGrid): GlyphGrid {
  const rows: GlyphRow[] = [];
  for (let r = 0; r < SIZE; r++) {
    const row: GlyphCell[] = [];
    for (let c = 0; c < SIZE; c++) {
      row.push({
        ...grid[r][c],
        pencilMarks: new Set(grid[r][c].pencilMarks),
      });
    }
    rows.push(row as GlyphRow);
  }
  return rows as unknown as GlyphGrid;
}

function checkComplete(grid: GlyphGrid, errors: Set<string>): boolean {
  if (errors.size > 0) return false;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c].value === null) return false;
    }
  }
  return true;
}

// ─── Reducer ────────────────────────────────

function createInitialState(): HookState {
  const puzzle = generateGlyphGrid(45);
  const currentGrid = cloneGrid(puzzle.initial);

  return {
    puzzle,
    currentGrid,
    selectedCell: null,
    isPencilMode: false,
    errors: new Set<string>(),
    isComplete: false,
  };
}

function reducer(state: HookState, action: HookAction): HookState {
  switch (action.type) {
    case 'SELECT_CELL': {
      return { ...state, selectedCell: { row: action.row, col: action.col } };
    }

    case 'FILL_CELL': {
      const { currentGrid, puzzle, selectedCell, isPencilMode } = state;
      if (!selectedCell) return state;

      const { row, col } = selectedCell;
      const cell = currentGrid[row][col];
      if (cell.isGiven) return state;

      const nextGrid = cloneGrid(currentGrid);
      const nextErrors = new Set(state.errors);
      const key = cellKey(row, col);

      if (isPencilMode) {
        if (nextGrid[row][col].value !== null) return state;
        const marks = nextGrid[row][col].pencilMarks;
        if (marks.has(action.char)) {
          marks.delete(action.char);
        } else {
          marks.add(action.char);
        }
        return { ...state, currentGrid: nextGrid };
      }

      // If same value, clear it
      if (nextGrid[row][col].value === action.char) {
        nextGrid[row][col].value = null;
        nextGrid[row][col].isValid = true;
        nextErrors.delete(key);
        return { ...state, currentGrid: nextGrid, errors: nextErrors, isComplete: false };
      }

      nextGrid[row][col].value = action.char;
      nextGrid[row][col].pencilMarks.clear();

      // Validate
      const correct = puzzle.solved[row][col].value === action.char;
      nextGrid[row][col].isValid = correct;

      if (correct) {
        nextErrors.delete(key);
      } else {
        nextErrors.add(key);
      }

      const isComplete = checkComplete(nextGrid, nextErrors);

      return { ...state, currentGrid: nextGrid, errors: nextErrors, isComplete };
    }

    case 'CLEAR_CELL': {
      const { currentGrid, selectedCell } = state;
      if (!selectedCell) return state;

      const { row, col } = selectedCell;
      if (currentGrid[row][col].isGiven) return state;

      const nextGrid = cloneGrid(currentGrid);
      nextGrid[row][col].value = null;
      nextGrid[row][col].isValid = true;
      nextGrid[row][col].pencilMarks.clear();

      const nextErrors = new Set(state.errors);
      nextErrors.delete(cellKey(row, col));

      return { ...state, currentGrid: nextGrid, errors: nextErrors, isComplete: false };
    }

    case 'TOGGLE_PENCIL': {
      return { ...state, isPencilMode: !state.isPencilMode };
    }

    case 'RESET': {
      const currentGrid = cloneGrid(state.puzzle.initial);
      return {
        ...state,
        currentGrid,
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

// ─── Hook ───────────────────────────────────

export function useGlyphGrid() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

  const selectCell = useCallback((row: number, col: number) => {
    dispatch({ type: 'SELECT_CELL', row, col });
  }, []);

  const fillCell = useCallback((char: string) => {
    dispatch({ type: 'FILL_CELL', char });
  }, []);

  const clearCell = useCallback(() => {
    dispatch({ type: 'CLEAR_CELL' });
  }, []);

  const togglePencil = useCallback(() => {
    dispatch({ type: 'TOGGLE_PENCIL' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    // State
    currentGrid: state.currentGrid,
    selectedCell: state.selectedCell,
    isPencilMode: state.isPencilMode,
    errors: state.errors,
    isComplete: state.isComplete,
    charMap: state.puzzle.charMap,
    heterogram: state.puzzle.heterogram,
    diagonalWord: state.puzzle.diagonalWord,

    // Actions
    selectCell,
    fillCell,
    clearCell,
    togglePencil,
    resetGame,
  };
}
