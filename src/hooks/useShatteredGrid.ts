// ──────────────────────────────────────────────
// NINE — Shattered Grid (Polyomino) State Hook
// ──────────────────────────────────────────────

import { useCallback, useReducer } from 'react';
import type { Coord, GridFragment, ShatteredGridState } from '../types/visual_games';
import {
  generateShatteredGrid,
  createShatteredGridState,
  snapFragment,
  selectFragment,
} from '../lib/games/spatial_engine';

// ─── Types ──────────────────────────────────

interface HookState {
  engine: ShatteredGridState;
  /** Index of the fragment that just snapped (for flash animation). */
  flashFragmentIndex: number | null;
  /** Whether completion pulse is active. */
  completionPulse: boolean;
}

type HookAction =
  | { type: 'SELECT_FRAGMENT'; index: number | null }
  | { type: 'SNAP_FRAGMENT'; fragmentIndex: number; anchorRow: number; anchorCol: number }
  | { type: 'CLEAR_FLASH' }
  | { type: 'CLEAR_PULSE' }
  | { type: 'RESET'; size?: number };

// ─── Helpers ────────────────────────────────

function isFragmentAtTarget(frag: GridFragment): boolean {
  return (
    frag.currentCoords.length === frag.targetCoords.length &&
    frag.currentCoords.every(
      (c, i) => c.row === frag.targetCoords[i].row && c.col === frag.targetCoords[i].col,
    )
  );
}

// ─── Reducer ────────────────────────────────

function createInitialState(size: number = 4): HookState {
  const puzzle = generateShatteredGrid(size, 5);
  const engine = createShatteredGridState(puzzle);

  return {
    engine,
    flashFragmentIndex: null,
    completionPulse: false,
  };
}

function reducer(state: HookState, action: HookAction): HookState {
  switch (action.type) {
    case 'SELECT_FRAGMENT': {
      const nextEngine = selectFragment(state.engine, action.index);
      return { ...state, engine: nextEngine };
    }

    case 'SNAP_FRAGMENT': {
      if (state.engine.isComplete) return state;

      const nextEngine = snapFragment(
        state.engine,
        action.fragmentIndex,
        action.anchorRow,
        action.anchorCol,
      );

      // Check if this fragment is now at target
      const frag = nextEngine.fragments[action.fragmentIndex];
      const isAtTarget = frag ? isFragmentAtTarget(frag) : false;

      return {
        ...state,
        engine: nextEngine,
        flashFragmentIndex: isAtTarget ? action.fragmentIndex : null,
        completionPulse: nextEngine.isComplete,
      };
    }

    case 'CLEAR_FLASH': {
      return { ...state, flashFragmentIndex: null };
    }

    case 'CLEAR_PULSE': {
      return { ...state, completionPulse: false };
    }

    case 'RESET': {
      return createInitialState(action.size ?? state.engine.puzzle.width);
    }

    default:
      return state;
  }
}

// ─── Hook ───────────────────────────────────

export function useShatteredGrid(size: number = 4) {
  const [state, dispatch] = useReducer(
    reducer,
    size,
    (s) => createInitialState(s),
  );

  const selectFrag = useCallback((index: number | null) => {
    dispatch({ type: 'SELECT_FRAGMENT', index });
  }, []);

  const snapTo = useCallback(
    (fragmentIndex: number, anchorRow: number, anchorCol: number) => {
      dispatch({ type: 'SNAP_FRAGMENT', fragmentIndex, anchorRow, anchorCol });
    },
    [],
  );

  const clearFlash = useCallback(() => {
    dispatch({ type: 'CLEAR_FLASH' });
  }, []);

  const clearPulse = useCallback(() => {
    dispatch({ type: 'CLEAR_PULSE' });
  }, []);

  const reset = useCallback((newSize?: number) => {
    dispatch({ type: 'RESET', size: newSize });
  }, []);

  const e = state.engine;

  // Separate placed vs dock fragments
  const placedFragments: { frag: GridFragment; index: number }[] = [];
  const dockFragments: { frag: GridFragment; index: number }[] = [];

  for (let i = 0; i < e.fragments.length; i++) {
    const frag = e.fragments[i];
    if (isFragmentAtTarget(frag)) {
      placedFragments.push({ frag, index: i });
    } else {
      dockFragments.push({ frag, index: i });
    }
  }

  return {
    // State
    fragments: e.fragments,
    gridWidth: e.puzzle.width,
    gridHeight: e.puzzle.height,
    selectedFragmentIndex: e.selectedFragmentIndex,
    moves: e.moves,
    isComplete: e.isComplete,
    score: e.score,
    flashFragmentIndex: state.flashFragmentIndex,
    completionPulse: state.completionPulse,

    // Derived
    placedFragments,
    dockFragments,

    // Actions
    selectFragment: selectFrag,
    snapTo,
    clearFlash,
    clearPulse,
    reset,
  };
}
