// ──────────────────────────────────────────────
// NINE — Lexicon Weave (Crossword) State Hook
// ──────────────────────────────────────────────

import { useCallback, useReducer } from 'react';
import type {
  ClueDirection,
  CrosswordClue,
  CrosswordPuzzle,
  CrosswordState,
} from '../types/trivia_games';
import {
  buildCrosswordPuzzle,
  placeLetter,
  revealErrors,
  getActiveWord,
  createCrosswordState,
} from '../lib/games/lexiconWeave';

// ─── Puzzle Data ────────────────────────────

const DEFAULT_PUZZLE_DATA = {
  width: 11,
  height: 11,
  title: 'Lexicon Weave',
  clues: [
    { number: 1, direction: 'across' as const, text: 'The study of stars', startRow: 0, startCol: 0, answer: 'ASTRONOMY' },
    { number: 2, direction: 'across' as const, text: 'Element #79', startRow: 2, startCol: 1, answer: 'GOLD' },
    { number: 3, direction: 'across' as const, text: 'Binary digit', startRow: 4, startCol: 0, answer: 'BIT' },
    { number: 4, direction: 'across' as const, text: 'Deep learning framework', startRow: 4, startCol: 5, answer: 'TORCH' },
    { number: 5, direction: 'across' as const, text: 'Opposite of input', startRow: 6, startCol: 2, answer: 'OUTPUT' },
    { number: 6, direction: 'across' as const, text: 'Encryption standard', startRow: 8, startCol: 0, answer: 'AES' },
    { number: 7, direction: 'across' as const, text: 'Random access memory', startRow: 8, startCol: 5, answer: 'RAM' },
    { number: 8, direction: 'across' as const, text: 'Version control system', startRow: 10, startCol: 1, answer: 'GIT' },
    { number: 9, direction: 'down' as const, text: 'Machine code target', startRow: 0, startCol: 0, answer: 'ABSTRACT' },
    { number: 10, direction: 'down' as const, text: 'Network protocol', startRow: 0, startCol: 4, answer: 'TCP' },
    { number: 11, direction: 'down' as const, text: 'Data structure (FIFO)', startRow: 0, startCol: 8, answer: 'QUEUE' },
    { number: 12, direction: 'down' as const, text: 'Loop construct', startRow: 2, startCol: 2, answer: 'LOOP' },
    { number: 13, direction: 'down' as const, text: 'Sorting algorithm', startRow: 4, startCol: 6, answer: 'MERGE' },
  ],
};

// ─── Types ──────────────────────────────────

interface HookState {
  crosswordState: CrosswordState;
  /** Whether we just revealed errors. */
  showingErrors: boolean;
}

type HookAction =
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'TYPE_LETTER'; char: string }
  | { type: 'DELETE_LETTER' }
  | { type: 'TOGGLE_DIRECTION' }
  | { type: 'CHECK_ERRORS' }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET' };

// ─── Helpers ────────────────────────────────

function findFirstInputCell(puzzle: CrosswordPuzzle): { row: number; col: number } {
  for (let r = 0; r < puzzle.height; r++) {
    for (let c = 0; c < puzzle.width; c++) {
      if (puzzle.grid[r][c].type === 'input') {
        return { row: r, col: c };
      }
    }
  }
  return { row: 0, col: 0 };
}

function advanceCursor(
  puzzle: CrosswordPuzzle,
  row: number,
  col: number,
  direction: ClueDirection,
): { row: number; col: number } {
  const dr = direction === 'down' ? 1 : 0;
  const dc = direction === 'across' ? 1 : 0;
  const nr = row + dr;
  const nc = col + dc;

  if (
    nr >= 0 && nr < puzzle.height &&
    nc >= 0 && nc < puzzle.width &&
    puzzle.grid[nr][nc].type === 'input'
  ) {
    return { row: nr, col: nc };
  }

  return { row, col };
}

function retreatCursor(
  puzzle: CrosswordPuzzle,
  row: number,
  col: number,
  direction: ClueDirection,
): { row: number; col: number } {
  const dr = direction === 'down' ? -1 : 0;
  const dc = direction === 'across' ? -1 : 0;
  const nr = row + dr;
  const nc = col + dc;

  if (
    nr >= 0 && nr < puzzle.height &&
    nc >= 0 && nc < puzzle.width &&
    puzzle.grid[nr][nc].type === 'input'
  ) {
    return { row: nr, col: nc };
  }

  return { row, col };
}

// ─── Reducer ────────────────────────────────

function createInitialState(): HookState {
  const puzzle = buildCrosswordPuzzle(
    DEFAULT_PUZZLE_DATA.width,
    DEFAULT_PUZZLE_DATA.height,
    DEFAULT_PUZZLE_DATA.clues,
    DEFAULT_PUZZLE_DATA.title,
  );

  const cs = createCrosswordState(puzzle);
  const first = findFirstInputCell(puzzle);

  return {
    crosswordState: { ...cs, focusRow: first.row, focusCol: first.col },
    showingErrors: false,
  };
}

function reducer(state: HookState, action: HookAction): HookState {
  const cs = state.crosswordState;

  switch (action.type) {
    case 'SELECT_CELL': {
      const cell = cs.puzzle.grid[action.row]?.[action.col];
      if (!cell || cell.type !== 'input') return state;

      // If clicking the same cell, toggle direction
      const sameCell = cs.focusRow === action.row && cs.focusCol === action.col;
      const nextDirection: ClueDirection = sameCell
        ? (cs.focusDirection === 'across' ? 'down' : 'across')
        : cs.focusDirection;

      return {
        ...state,
        crosswordState: {
          ...cs,
          focusRow: action.row,
          focusCol: action.col,
          focusDirection: nextDirection,
        },
      };
    }

    case 'TYPE_LETTER': {
      if (cs.isComplete) return state;

      const nextCs = placeLetter(cs, cs.focusRow, cs.focusCol, action.char);
      const { row: nr, col: nc } = advanceCursor(
        nextCs.puzzle,
        cs.focusRow,
        cs.focusCol,
        cs.focusDirection,
      );

      return {
        ...state,
        crosswordState: { ...nextCs, focusRow: nr, focusCol: nc },
        showingErrors: false,
      };
    }

    case 'DELETE_LETTER': {
      if (cs.isComplete) return state;

      // Clear current cell if it has a value, otherwise retreat and clear
      const currentCell = cs.puzzle.grid[cs.focusRow][cs.focusCol];
      if (currentCell.playerValue) {
        const nextCs = placeLetter(cs, cs.focusRow, cs.focusCol, '');
        // Actually we need to clear — set playerValue to null
        const nextGrid = nextCs.puzzle.grid.map((r) => r.map((c) => ({ ...c })));
        nextGrid[cs.focusRow][cs.focusCol].playerValue = null;

        const nextCorrect = new Set(nextCs.correctCells);
        nextCorrect.delete(`${cs.focusRow},${cs.focusCol}`);

        return {
          ...state,
          crosswordState: {
            ...nextCs,
            puzzle: { ...nextCs.puzzle, grid: nextGrid },
            correctCells: nextCorrect,
            isComplete: false,
          },
        };
      }

      // Retreat cursor
      const { row: pr, col: pc } = retreatCursor(
        cs.puzzle,
        cs.focusRow,
        cs.focusCol,
        cs.focusDirection,
      );

      if (pr !== cs.focusRow || pc !== cs.focusCol) {
        const nextGrid = cs.puzzle.grid.map((r) => r.map((c) => ({ ...c })));
        nextGrid[pr][pc].playerValue = null;

        const nextCorrect = new Set(cs.correctCells);
        nextCorrect.delete(`${pr},${pc}`);

        return {
          ...state,
          crosswordState: {
            ...cs,
            puzzle: { ...cs.puzzle, grid: nextGrid },
            focusRow: pr,
            focusCol: pc,
            correctCells: nextCorrect,
            isComplete: false,
          },
        };
      }

      return state;
    }

    case 'TOGGLE_DIRECTION': {
      return {
        ...state,
        crosswordState: {
          ...cs,
          focusDirection: cs.focusDirection === 'across' ? 'down' : 'across',
        },
      };
    }

    case 'CHECK_ERRORS': {
      const nextCs = revealErrors(cs);
      return { ...state, crosswordState: nextCs, showingErrors: true };
    }

    case 'CLEAR_ERRORS': {
      return {
        ...state,
        crosswordState: { ...cs, errorCells: new Set<string>() },
        showingErrors: false,
      };
    }

    case 'RESET': {
      return createInitialState();
    }

    default:
      return state;
  }
}

// ─── Hook ───────────────────────────────────

export function useLexiconWeave() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

  const cs = state.crosswordState;

  const selectCell = useCallback((row: number, col: number) => {
    dispatch({ type: 'SELECT_CELL', row, col });
  }, []);

  const typeLetter = useCallback((char: string) => {
    dispatch({ type: 'TYPE_LETTER', char: char.toUpperCase() });
  }, []);

  const deleteLetter = useCallback(() => {
    dispatch({ type: 'DELETE_LETTER' });
  }, []);

  const toggleDirection = useCallback(() => {
    dispatch({ type: 'TOGGLE_DIRECTION' });
  }, []);

  const checkErrors = useCallback(() => {
    dispatch({ type: 'CHECK_ERRORS' });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Derived: active word/clue
  const activeClue = getActiveWord(cs);

  // Get cells belonging to active word for highlighting
  const activeWordCells = new Set<string>();
  if (activeClue) {
    const dr = activeClue.direction === 'down' ? 1 : 0;
    const dc = activeClue.direction === 'across' ? 1 : 0;
    for (let i = 0; i < activeClue.length; i++) {
      const r = activeClue.startRow + dr * i;
      const c = activeClue.startCol + dc * i;
      activeWordCells.add(`${r},${c}`);
    }
  }

  // Separate clues
  const acrossClues = cs.puzzle.clues.filter((c) => c.direction === 'across');
  const downClues = cs.puzzle.clues.filter((c) => c.direction === 'down');

  return {
    // State
    grid: cs.puzzle.grid,
    width: cs.puzzle.width,
    height: cs.puzzle.height,
    focusRow: cs.focusRow,
    focusCol: cs.focusCol,
    focusDirection: cs.focusDirection,
    correctCells: cs.correctCells,
    errorCells: cs.errorCells,
    isComplete: cs.isComplete,
    score: cs.score,
    showingErrors: state.showingErrors,

    // Derived
    activeClue,
    activeWordCells,
    acrossClues,
    downClues,

    // Actions
    selectCell,
    typeLetter,
    deleteLetter,
    toggleDirection,
    checkErrors,
    clearErrors,
    resetGame,
  };
}
