// ──────────────────────────────────────────────
// NINE — Chronos Shift (Sorting) State Hook
// ──────────────────────────────────────────────

import { useCallback, useReducer, useRef } from 'react';
import type { ChronosShiftPuzzle, ChronosShiftState } from '../types/expanded_games';
import {
  generateChronosShift,
  createChronosShiftState,
  submitChronosOrder,
  isGameOver,
} from '../lib/games/chronosShift';

// ─── Types ──────────────────────────────────

export type ChronosGameState = 'playing' | 'validating' | 'won' | 'lost';

export interface ChronosValidationResult {
  /** Per-slot correctness for the most recent submission. */
  slotResults: boolean[];
}

interface HookState {
  puzzle: ChronosShiftPuzzle;
  engine: ChronosShiftState;
  /** The live ordering managed by Reorder (array of item IDs). */
  currentOrder: string[];
  gameState: ChronosGameState;
  /** Result of the most recent validation (for animations). */
  lastValidation: ChronosValidationResult | null;
  /** Whether the grid should shake (incorrect submission). */
  shakeGrid: boolean;
}

type HookAction =
  | { type: 'REORDER'; newOrder: string[] }
  | { type: 'LOCK_SEQUENCE' }
  | { type: 'VALIDATION_COMPLETE' }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'RESET' };

// ─── Reducer ────────────────────────────────

function createInitialState(): HookState {
  const puzzle = generateChronosShift();
  const engine = createChronosShiftState(puzzle);

  return {
    puzzle,
    engine,
    currentOrder: [...engine.currentOrder],
    gameState: 'playing',
    lastValidation: null,
    shakeGrid: false,
  };
}

function reducer(state: HookState, action: HookAction): HookState {
  switch (action.type) {
    case 'REORDER': {
      if (state.gameState !== 'playing') return state;

      // Don't allow locked items to move — filter ensures locked items stay
      const lockedPositions = new Map<string, number>();
      for (let i = 0; i < state.engine.lockedSlots.length; i++) {
        if (state.engine.lockedSlots[i]) {
          lockedPositions.set(state.engine.currentOrder[i], i);
        }
      }

      // If no locked items, just accept the new order
      if (lockedPositions.size === 0) {
        return { ...state, currentOrder: action.newOrder };
      }

      // Rebuild order respecting locks
      const newOrder = [...action.newOrder];
      // Remove locked items from their wrong positions
      const locked = new Map<number, string>();
      for (const [id, pos] of lockedPositions) {
        locked.set(pos, id);
        const idx = newOrder.indexOf(id);
        if (idx !== -1) newOrder.splice(idx, 1);
      }

      // Insert locked items back at correct positions
      const result: string[] = [];
      let freeIdx = 0;
      for (let i = 0; i < 5; i++) {
        if (locked.has(i)) {
          result.push(locked.get(i)!);
        } else {
          result.push(newOrder[freeIdx++]);
        }
      }

      return { ...state, currentOrder: result };
    }

    case 'LOCK_SEQUENCE': {
      if (state.gameState !== 'playing') return state;

      // Sync currentOrder into the engine state
      const syncedEngine: ChronosShiftState = {
        ...state.engine,
        currentOrder: state.currentOrder as ChronosShiftState['currentOrder'],
      };

      const nextEngine = submitChronosOrder(syncedEngine);

      // Build per-slot results
      const slotResults: boolean[] = [];
      for (let i = 0; i < 5; i++) {
        slotResults.push(nextEngine.lockedSlots[i]);
      }

      const allCorrect = nextEngine.solved;
      const gameOver = isGameOver(nextEngine);
      const hasIncorrect = slotResults.some((r) => !r);

      let nextGameState: ChronosGameState = 'validating';
      if (allCorrect) nextGameState = 'won';
      else if (gameOver) nextGameState = 'lost';

      return {
        ...state,
        engine: nextEngine,
        currentOrder: [...nextEngine.currentOrder],
        gameState: nextGameState,
        lastValidation: { slotResults },
        shakeGrid: hasIncorrect && !allCorrect,
      };
    }

    case 'VALIDATION_COMPLETE': {
      if (state.gameState === 'won' || state.gameState === 'lost') return state;

      return {
        ...state,
        gameState: 'playing',
        lastValidation: null,
        shakeGrid: false,
      };
    }

    case 'CLEAR_SHAKE': {
      return { ...state, shakeGrid: false };
    }

    case 'RESET': {
      return createInitialState();
    }

    default:
      return state;
  }
}

// ─── Hook ───────────────────────────────────

export function useChronosShift() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);
  const validationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reorder = useCallback((newOrder: string[]) => {
    dispatch({ type: 'REORDER', newOrder });
  }, []);

  const lockSequence = useCallback(() => {
    dispatch({ type: 'LOCK_SEQUENCE' });

    // Auto-return to playing after animation
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    validationTimerRef.current = setTimeout(() => {
      dispatch({ type: 'VALIDATION_COMPLETE' });
    }, 1200);
  }, []);

  const clearShake = useCallback(() => {
    dispatch({ type: 'CLEAR_SHAKE' });
  }, []);

  const reset = useCallback(() => {
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    dispatch({ type: 'RESET' });
  }, []);

  // Derived
  const items = state.puzzle.items;
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const orderedItems = state.currentOrder.map((id) => itemMap.get(id)!);
  const category = state.puzzle.category;
  const sortDirection = state.puzzle.sortDirection;

  return {
    // State
    orderedItems,
    currentOrder: state.currentOrder,
    lockedSlots: state.engine.lockedSlots,
    attemptsUsed: state.engine.attemptsUsed,
    maxAttempts: state.engine.maxAttempts,
    gameState: state.gameState,
    lastValidation: state.lastValidation,
    shakeGrid: state.shakeGrid,
    category,
    sortDirection,

    // Actions
    reorder,
    lockSequence,
    clearShake,
    reset,
  };
}
