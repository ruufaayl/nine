// ──────────────────────────────────────────────
// NINE — Canvas Fracture (Sliding Puzzle) Hook
// ──────────────────────────────────────────────

import { useCallback, useReducer } from 'react';
import type { CanvasFractureState, FracturedTile } from '../types/visual_games';
import {
  generateCanvasFracture,
  createCanvasFractureState,
  moveTile,
  getMovableTiles,
} from '../lib/games/spatial_engine';

// ─── Types ──────────────────────────────────

interface HookState {
  engine: CanvasFractureState;
  /** Flash pulse for completion animation. */
  completionPulse: boolean;
}

type HookAction =
  | { type: 'SLIDE_TILE'; index: number }
  | { type: 'CLEAR_PULSE' }
  | { type: 'RESET'; size?: number };

// ─── Reducer ────────────────────────────────

function createInitialState(size: number = 4): HookState {
  const puzzle = generateCanvasFracture(size);
  const engine = createCanvasFractureState(puzzle);

  return {
    engine,
    completionPulse: false,
  };
}

function reducer(state: HookState, action: HookAction): HookState {
  switch (action.type) {
    case 'SLIDE_TILE': {
      if (state.engine.isComplete) return state;

      const nextEngine = moveTile(state.engine, action.index);
      if (nextEngine === state.engine) return state; // invalid move

      return {
        ...state,
        engine: nextEngine,
        completionPulse: nextEngine.isComplete,
      };
    }

    case 'CLEAR_PULSE': {
      return { ...state, completionPulse: false };
    }

    case 'RESET': {
      return createInitialState(action.size ?? state.engine.puzzle.size);
    }

    default:
      return state;
  }
}

// ─── Hook ───────────────────────────────────

export function useCanvasFracture(size: number = 4) {
  const [state, dispatch] = useReducer(
    reducer,
    size,
    (s) => createInitialState(s),
  );

  const slideTile = useCallback((index: number) => {
    dispatch({ type: 'SLIDE_TILE', index });
  }, []);

  const clearPulse = useCallback(() => {
    dispatch({ type: 'CLEAR_PULSE' });
  }, []);

  const reset = useCallback((newSize?: number) => {
    dispatch({ type: 'RESET', size: newSize });
  }, []);

  const e = state.engine;
  const movable = getMovableTiles(e);
  const movableSet = new Set(movable);

  return {
    // State
    tiles: e.tiles,
    emptyIndex: e.emptyIndex,
    gridSize: e.puzzle.size,
    moves: e.moves,
    isComplete: e.isComplete,
    score: e.score,
    completionPulse: state.completionPulse,
    movableSet,

    // Actions
    slideTile,
    clearPulse,
    reset,
  };
}
