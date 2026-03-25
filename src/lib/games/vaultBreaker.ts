// ──────────────────────────────────────────────
// NINE — Vault Breaker (Cryptex / Wordle) Engine
// ──────────────────────────────────────────────

import type {
  VaultBreakerPuzzle,
  VaultBreakerState,
  VaultGuessResult,
  VaultSlotState,
} from '../../types/expanded_games';

// ─── Word Lists ──────────────────────────────

const FIVE_LETTER_WORDS: readonly string[] = [
  'CRANE', 'PLUMB', 'GHOST', 'FAITH', 'BLITZ',
  'GLYPH', 'KNACK', 'PRISM', 'QUERY', 'SHARD',
  'SWORN', 'VIGOR', 'WRATH', 'CYNIC', 'DROIT',
  'EXPAT', 'FJORD', 'HAVEN', 'JOUST', 'MAXIM',
  'NEXUS', 'ORBIT', 'PSYCH', 'ROGUE', 'THUMP',
  'ULTRA', 'VENOM', 'WHIRL', 'YACHT', 'ZEBRA',
];

const SIX_LETTER_WORDS: readonly string[] = [
  'CYPHER', 'QUARTZ', 'BREEZE', 'FATHOM', 'SPHINX',
  'GRAVEL', 'JIGSAW', 'KNIGHT', 'MATRIX', 'BRONZE',
  'VOYAGE', 'WRAITH', 'CLIMAX', 'DYNAMO', 'FERVOR',
  'MOSAIC', 'PLUNGE', 'RADISH', 'SUBTLE', 'ZENITH',
];

// ─── Core Logic ──────────────────────────────

/**
 * Evaluate a guess against a target word.
 * Uses standard Wordle-style algorithm:
 * 1. Mark exact matches (correct_placement)
 * 2. For remaining letters, mark wrong_placement if the letter exists
 *    in the target at an unmatched position, respecting frequency.
 */
export function validateGuess(
  guess: string,
  target: string,
): VaultSlotState[] {
  const g = guess.toUpperCase();
  const t = target.toUpperCase();
  const len = t.length;

  const result: VaultSlotState[] = new Array(len).fill('not_in_word');

  // Track which target positions are still available
  const targetAvailable: boolean[] = new Array(len).fill(true);
  const guessMatched: boolean[] = new Array(len).fill(false);

  // Pass 1: exact matches
  for (let i = 0; i < len; i++) {
    if (g[i] === t[i]) {
      result[i] = 'correct_placement';
      targetAvailable[i] = false;
      guessMatched[i] = true;
    }
  }

  // Pass 2: wrong placement (respects letter frequency)
  for (let i = 0; i < len; i++) {
    if (guessMatched[i]) continue;

    for (let j = 0; j < len; j++) {
      if (targetAvailable[j] && g[i] === t[j]) {
        result[i] = 'wrong_placement';
        targetAvailable[j] = false;
        break;
      }
    }
  }

  return result;
}

/**
 * Build a full guess result object.
 */
export function evaluateGuess(
  guess: string,
  target: string,
): VaultGuessResult {
  return {
    guess: guess.toUpperCase(),
    slots: validateGuess(guess, target),
  };
}

/**
 * Generate a new Vault Breaker puzzle.
 */
export function generateVaultBreaker(
  wordLength: 5 | 6 = 5,
  maxGuesses: number = 6,
): VaultBreakerPuzzle {
  const pool = wordLength === 5 ? FIVE_LETTER_WORDS : SIX_LETTER_WORDS;
  const target = pool[Math.floor(Math.random() * pool.length)];

  return {
    wordLength,
    maxGuesses,
    target,
  };
}

/**
 * Create a fresh game state from a puzzle.
 */
export function createVaultBreakerState(
  puzzle: VaultBreakerPuzzle,
): VaultBreakerState {
  return {
    puzzle,
    guesses: [],
    currentInput: '',
    solved: false,
    failed: false,
  };
}

/**
 * Submit a guess and return the next state.
 * Pure function — does not mutate the input state.
 */
export function submitVaultGuess(
  state: VaultBreakerState,
  guess: string,
): VaultBreakerState {
  if (state.solved || state.failed) return state;

  const normalized = guess.toUpperCase();
  if (normalized.length !== state.puzzle.wordLength) return state;

  const result = evaluateGuess(normalized, state.puzzle.target);
  const nextGuesses = [...state.guesses, result];

  const solved = result.slots.every((s) => s === 'correct_placement');
  const failed = !solved && nextGuesses.length >= state.puzzle.maxGuesses;

  return {
    ...state,
    guesses: nextGuesses,
    currentInput: '',
    solved,
    failed,
  };
}

/**
 * Returns the set of letters known to not be in the word.
 */
export function getEliminatedLetters(
  guesses: readonly VaultGuessResult[],
): Set<string> {
  const eliminated = new Set<string>();
  const presentLetters = new Set<string>();

  for (const g of guesses) {
    for (let i = 0; i < g.guess.length; i++) {
      if (g.slots[i] === 'correct_placement' || g.slots[i] === 'wrong_placement') {
        presentLetters.add(g.guess[i]);
      }
    }
  }

  for (const g of guesses) {
    for (let i = 0; i < g.guess.length; i++) {
      if (g.slots[i] === 'not_in_word' && !presentLetters.has(g.guess[i])) {
        eliminated.add(g.guess[i]);
      }
    }
  }

  return eliminated;
}
