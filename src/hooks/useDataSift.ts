// ──────────────────────────────────────────────
// NINE — Data Sift (Categorization) State Hook
// ──────────────────────────────────────────────

import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { DataSiftItem, DataSiftPuzzle } from '../types/trivia_games';
import {
  generateDataSift,
  toggleSiftSelection,
  submitSiftSelection,
  validateSift,
  createDataSiftState,
} from '../lib/games/dataSift';

// ─── Types ──────────────────────────────────

export type DataSiftGameState = 'playing' | 'validating' | 'won' | 'lost';

export interface SiftValidationFeedback {
  correctIds: readonly string[];
  incorrectIds: readonly string[];
  isPerfect: boolean;
}

interface HookState {
  puzzle: DataSiftPuzzle;
  selectedIds: Set<string>;
  /** IDs permanently locked as correct across rounds. */
  solvedIds: Set<string>;
  lives: number;
  maxLives: number;
  gameState: DataSiftGameState;
  /** Feedback from the most recent validation. */
  feedback: SiftValidationFeedback | null;
  /** Whether the grid should shake. */
  shakeGrid: boolean;
  /** Score. */
  score: number;
}

type HookAction =
  | { type: 'TOGGLE_ITEM'; id: string }
  | { type: 'VALIDATE' }
  | { type: 'CLEAR_FEEDBACK' }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'RESET' };

// ─── Reducer ────────────────────────────────

function createInitialState(): HookState {
  const puzzle = generateDataSift();

  return {
    puzzle,
    selectedIds: new Set<string>(),
    solvedIds: new Set<string>(),
    lives: 3,
    maxLives: 3,
    gameState: 'playing',
    feedback: null,
    shakeGrid: false,
    score: 0,
  };
}

function reducer(state: HookState, action: HookAction): HookState {
  switch (action.type) {
    case 'TOGGLE_ITEM': {
      if (state.gameState !== 'playing') return state;
      // Can't toggle solved items
      if (state.solvedIds.has(action.id)) return state;

      const next = new Set(state.selectedIds);
      if (next.has(action.id)) {
        next.delete(action.id);
      } else {
        // Max 4 non-solved selections
        const activeCount = [...next].filter((id) => !state.solvedIds.has(id)).length;
        if (activeCount >= 4) return state;
        next.add(action.id);
      }

      return { ...state, selectedIds: next, feedback: null };
    }

    case 'VALIDATE': {
      if (state.gameState !== 'playing') return state;

      // Only validate when we have exactly 4 non-solved selections
      const activeSelections = new Set(
        [...state.selectedIds].filter((id) => !state.solvedIds.has(id)),
      );
      if (activeSelections.size !== 4) return state;

      // Check against correct answers
      const allSelected = new Set([...state.solvedIds, ...activeSelections]);
      const result = validateSift(allSelected, state.puzzle);

      // Find which of the active selections are correct/incorrect
      const correctSet = new Set(state.puzzle.correctItemIds);
      const correctIds: string[] = [];
      const incorrectIds: string[] = [];

      for (const id of activeSelections) {
        if (correctSet.has(id)) {
          correctIds.push(id);
        } else {
          incorrectIds.push(id);
        }
      }

      const isPerfect = incorrectIds.length === 0;

      if (isPerfect) {
        // All 4 new selections are correct — lock them in
        const nextSolved = new Set([...state.solvedIds, ...correctIds]);
        const allSolved = nextSolved.size === 4;

        return {
          ...state,
          solvedIds: nextSolved,
          selectedIds: new Set<string>(),
          gameState: allSolved ? 'won' : 'playing',
          feedback: { correctIds, incorrectIds, isPerfect: true },
          score: state.score + correctIds.length * 250,
        };
      }

      // Some wrong — deduct a life
      const nextLives = state.lives - 1;
      const isLost = nextLives <= 0;

      return {
        ...state,
        lives: nextLives,
        selectedIds: new Set<string>(),
        gameState: isLost ? 'lost' : 'validating',
        feedback: { correctIds, incorrectIds, isPerfect: false },
        shakeGrid: true,
        score: state.score + Math.max(0, correctIds.length * 250 - incorrectIds.length * 100),
      };
    }

    case 'CLEAR_FEEDBACK': {
      if (state.gameState === 'won' || state.gameState === 'lost') return state;
      return { ...state, gameState: 'playing', feedback: null, shakeGrid: false };
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

export function useDataSift() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleItem = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_ITEM', id });
  }, []);

  const validate = useCallback(() => {
    dispatch({ type: 'VALIDATE' });

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      dispatch({ type: 'CLEAR_FEEDBACK' });
    }, 1500);
  }, []);

  const clearShake = useCallback(() => {
    dispatch({ type: 'CLEAR_SHAKE' });
  }, []);

  const reset = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    dispatch({ type: 'RESET' });
  }, []);

  // Auto-validate when 4 items selected (excluding solved)
  const activeCount = [...state.selectedIds].filter(
    (id) => !state.solvedIds.has(id),
  ).length;

  useEffect(() => {
    if (activeCount === 4 && state.gameState === 'playing') {
      validate();
    }
  }, [activeCount, state.gameState, validate]);

  return {
    // State
    items: state.puzzle.items,
    targetCategory: state.puzzle.targetCategory,
    selectedIds: state.selectedIds,
    solvedIds: state.solvedIds,
    lives: state.lives,
    maxLives: state.maxLives,
    gameState: state.gameState,
    feedback: state.feedback,
    shakeGrid: state.shakeGrid,
    score: state.score,

    // Actions
    toggleItem,
    clearShake,
    reset,
  };
}
