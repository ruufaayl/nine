// ──────────────────────────────────────────────
// NINE — Game State Hook (single source of truth)
// ──────────────────────────────────────────────

import { useCallback, useReducer } from 'react';
import type {
  Cell,
  CharacterTheme,
  Difficulty,
  GameMode,
  Grid,
  GridRow,
} from '../types/game';
import { generatePuzzle, getPeers } from '../lib/sudoku';
import { getThemeById } from '../lib/themes';

// ─── Constants ───────────────────────────────

const SIZE = 9;
const SPRINT_DURATION = 180; // 3 minutes
const FOG_RIPPLE_RADIUS = 1; // reveal cells within Manhattan distance 1

/** XP awarded per correct fill in Sprint mode. */
const SPRINT_XP_PER_FILL = 10;

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
  // Mode
  mode: GameMode;
  // Sprint
  sprintTimeRemaining: number;
  xp: number;
  // Fog of War
  foggedCells: Set<string>;
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
  mode: 'classic',
  sprintTimeRemaining: SPRINT_DURATION,
  xp: 0,
  foggedCells: new Set<string>(),
};

// ─── Actions ─────────────────────────────────

type GameAction =
  | { type: 'INIT_GAME'; difficulty: Difficulty; characterId: string; mode: GameMode }
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'FILL_CELL'; value: number }
  | { type: 'TOGGLE_PENCIL' }
  | { type: 'RESET_GAME' }
  | { type: 'SPRINT_TICK' };

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

/** Build the initial fog set: all non-given cells are fogged. */
function buildInitialFog(grid: Grid): Set<string> {
  const fogged = new Set<string>();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c].isGiven) {
        fogged.add(cellKey(r, c));
      }
    }
  }
  return fogged;
}

/** Lift fog within Manhattan distance `radius` of (row, col). */
function liftFog(
  fogged: Set<string>,
  row: number,
  col: number,
  radius: number,
): Set<string> {
  const next = new Set(fogged);
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      if (Math.abs(dr) + Math.abs(dc) > radius) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
        next.delete(cellKey(nr, nc));
      }
    }
  }
  return next;
}

/** Re-fog cells within Manhattan distance `radius` of (row, col), except given cells. */
function reFog(
  fogged: Set<string>,
  grid: Grid,
  row: number,
  col: number,
  radius: number,
): Set<string> {
  const next = new Set(fogged);
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      if (Math.abs(dr) + Math.abs(dc) > radius) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
        if (!grid[nr][nc].isGiven) {
          next.add(cellKey(nr, nc));
        }
      }
    }
  }
  return next;
}

// ─── Reducer ─────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME': {
      const puzzle = generatePuzzle(action.difficulty);
      const currentGrid = cloneGrid(puzzle.initial);
      const theme = getThemeById(action.characterId) ?? null;

      const foggedCells =
        action.mode === 'fogOfWar'
          ? buildInitialFog(currentGrid)
          : new Set<string>();

      return {
        currentGrid,
        initialGrid: puzzle.initial,
        solutionGrid: puzzle.solved,
        selectedCell: null,
        isPencilMode: false,
        errors: new Set<string>(),
        isComplete: false,
        activeTheme: theme,
        mode: action.mode,
        sprintTimeRemaining: action.mode === 'sprint' ? SPRINT_DURATION : 0,
        xp: 0,
        foggedCells,
      };
    }

    case 'SELECT_CELL': {
      return {
        ...state,
        selectedCell: { row: action.row, col: action.col },
      };
    }

    case 'FILL_CELL': {
      const { currentGrid, solutionGrid, selectedCell, isPencilMode, mode } = state;
      if (!currentGrid || !solutionGrid || !selectedCell) return state;

      const { row, col } = selectedCell;
      const cell = currentGrid[row][col];

      // Given cells are immutable
      if (cell.isGiven) return state;

      const nextGrid = cloneGrid(currentGrid);
      const nextErrors = new Set(state.errors);
      const key = cellKey(row, col);
      let nextXp = state.xp;
      let nextFog = state.foggedCells;

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

        // Sprint XP
        if (mode === 'sprint') {
          nextXp += SPRINT_XP_PER_FILL;
        }

        // Fog of War: lift fog around correct fill
        if (mode === 'fogOfWar') {
          nextFog = liftFog(nextFog, row, col, FOG_RIPPLE_RADIUS);
        }
      } else {
        nextErrors.add(key);

        // Fog of War: re-fog around wrong fill
        if (mode === 'fogOfWar') {
          nextFog = reFog(nextFog, nextGrid, row, col, FOG_RIPPLE_RADIUS);
        }
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
        xp: nextXp,
        foggedCells: nextFog,
      };
    }

    case 'TOGGLE_PENCIL': {
      return { ...state, isPencilMode: !state.isPencilMode };
    }

    case 'RESET_GAME': {
      if (!state.initialGrid) return state;

      const currentGrid = cloneGrid(state.initialGrid);
      const foggedCells =
        state.mode === 'fogOfWar'
          ? buildInitialFog(currentGrid)
          : new Set<string>();

      return {
        ...state,
        currentGrid,
        selectedCell: null,
        isPencilMode: false,
        errors: new Set<string>(),
        isComplete: false,
        xp: 0,
        sprintTimeRemaining:
          state.mode === 'sprint' ? SPRINT_DURATION : state.sprintTimeRemaining,
        foggedCells,
      };
    }

    case 'SPRINT_TICK': {
      if (state.mode !== 'sprint') return state;
      const next = state.sprintTimeRemaining - 1;
      return { ...state, sprintTimeRemaining: Math.max(0, next) };
    }

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  const initGame = useCallback(
    (difficulty: Difficulty, characterId: string, mode: GameMode = 'classic') => {
      dispatch({ type: 'INIT_GAME', difficulty, characterId, mode });
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

  const sprintTick = useCallback(() => {
    dispatch({ type: 'SPRINT_TICK' });
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
    mode: state.mode,
    sprintTimeRemaining: state.sprintTimeRemaining,
    xp: state.xp,
    foggedCells: state.foggedCells,

    // Actions
    initGame,
    selectCell,
    fillCell,
    togglePencil,
    resetGame,
    sprintTick,
  } as const;
}
