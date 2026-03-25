// ──────────────────────────────────────────────
// NINE — Vault Breaker State Hook
// ──────────────────────────────────────────────

import { useCallback, useReducer } from 'react';
import type {
  VaultBreakerState,
  VaultGuessResult,
  VaultSlotState,
} from '../types/expanded_games';
import {
  evaluateGuess,
  generateVaultBreaker,
  getEliminatedLetters,
} from '../lib/games/vaultBreaker';

// ─── Types ──────────────────────────────────

export type VaultGameStatus = 'playing' | 'won' | 'lost';

export type KeyboardLetterState = 'correct' | 'present' | 'absent' | 'unused';

interface VaultState {
  targetWord: string;
  guesses: VaultGuessResult[];
  currentGuess: string;
  gameStatus: VaultGameStatus;
  maxGuesses: number;
  wordLength: number;
  /** Triggers the row-shake animation on invalid submit. */
  shakeRow: boolean;
  /** Index of the most recently submitted row (for flip animation gating). */
  lastSubmittedRow: number;
}

type VaultAction =
  | { type: 'ADD_LETTER'; letter: string }
  | { type: 'REMOVE_LETTER' }
  | { type: 'SUBMIT_GUESS' }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'RESET'; wordLength?: 5 | 6 };

// ─── Keyboard State Computation ─────────────

function computeKeyboardState(
  guesses: readonly VaultGuessResult[],
): Map<string, KeyboardLetterState> {
  const map = new Map<string, KeyboardLetterState>();

  // Priority: correct > present > absent
  for (const guess of guesses) {
    for (let i = 0; i < guess.guess.length; i++) {
      const letter = guess.guess[i];
      const slot = guess.slots[i];
      const current = map.get(letter);

      if (slot === 'correct_placement') {
        map.set(letter, 'correct');
      } else if (slot === 'wrong_placement') {
        if (current !== 'correct') {
          map.set(letter, 'present');
        }
      } else {
        if (current === undefined) {
          map.set(letter, 'absent');
        }
      }
    }
  }

  return map;
}

// ─── Reducer ────────────────────────────────

function createInitialState(wordLength: 5 | 6 = 5): VaultState {
  const puzzle = generateVaultBreaker(wordLength);
  return {
    targetWord: puzzle.target,
    guesses: [],
    currentGuess: '',
    gameStatus: 'playing',
    maxGuesses: puzzle.maxGuesses,
    wordLength: puzzle.wordLength,
    shakeRow: false,
    lastSubmittedRow: -1,
  };
}

function reducer(state: VaultState, action: VaultAction): VaultState {
  switch (action.type) {
    case 'ADD_LETTER': {
      if (state.gameStatus !== 'playing') return state;
      if (state.currentGuess.length >= state.wordLength) return state;

      const letter = action.letter.toUpperCase();
      if (!/^[A-Z]$/.test(letter)) return state;

      return {
        ...state,
        currentGuess: state.currentGuess + letter,
        shakeRow: false,
      };
    }

    case 'REMOVE_LETTER': {
      if (state.gameStatus !== 'playing') return state;
      if (state.currentGuess.length === 0) return state;

      return {
        ...state,
        currentGuess: state.currentGuess.slice(0, -1),
        shakeRow: false,
      };
    }

    case 'SUBMIT_GUESS': {
      if (state.gameStatus !== 'playing') return state;

      // Not enough letters — trigger shake
      if (state.currentGuess.length !== state.wordLength) {
        return { ...state, shakeRow: true };
      }

      const result = evaluateGuess(state.currentGuess, state.targetWord);
      const nextGuesses = [...state.guesses, result];

      const won = result.slots.every((s) => s === 'correct_placement');
      const lost = !won && nextGuesses.length >= state.maxGuesses;

      return {
        ...state,
        guesses: nextGuesses,
        currentGuess: '',
        gameStatus: won ? 'won' : lost ? 'lost' : 'playing',
        shakeRow: false,
        lastSubmittedRow: nextGuesses.length - 1,
      };
    }

    case 'CLEAR_SHAKE': {
      return { ...state, shakeRow: false };
    }

    case 'RESET': {
      return createInitialState(action.wordLength ?? 5);
    }

    default:
      return state;
  }
}

// ─── Hook ───────────────────────────────────

export function useVaultBreaker(wordLength: 5 | 6 = 5) {
  const [state, dispatch] = useReducer(reducer, wordLength, createInitialState);

  const addLetter = useCallback(
    (letter: string) => dispatch({ type: 'ADD_LETTER', letter }),
    [],
  );

  const removeLetter = useCallback(
    () => dispatch({ type: 'REMOVE_LETTER' }),
    [],
  );

  const submitGuess = useCallback(
    () => dispatch({ type: 'SUBMIT_GUESS' }),
    [],
  );

  const clearShake = useCallback(
    () => dispatch({ type: 'CLEAR_SHAKE' }),
    [],
  );

  const resetGame = useCallback(
    (wl?: 5 | 6) => dispatch({ type: 'RESET', wordLength: wl }),
    [],
  );

  const keyboardState = computeKeyboardState(state.guesses);

  return {
    // State
    targetWord: state.targetWord,
    guesses: state.guesses,
    currentGuess: state.currentGuess,
    gameStatus: state.gameStatus,
    maxGuesses: state.maxGuesses,
    wordLength: state.wordLength,
    shakeRow: state.shakeRow,
    lastSubmittedRow: state.lastSubmittedRow,
    keyboardState,

    // Actions
    addLetter,
    removeLetter,
    submitGuess,
    clearShake,
    resetGame,
  };
}
