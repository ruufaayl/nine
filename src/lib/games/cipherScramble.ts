// ──────────────────────────────────────────────
// NINE — Cipher Scramble (Anagrams) Engine
// ──────────────────────────────────────────────

import type {
  CipherScramblePuzzle,
  CipherScrambleState,
} from '../../types/expanded_games';

// ─── Dictionary ──────────────────────────────

/**
 * Compact dictionary organized by sorted-letter key.
 * Each key maps to all valid English words that are anagrams of each other.
 * In production this would be loaded from a file; here we include a curated set.
 */
const ANAGRAM_GROUPS: ReadonlyMap<string, readonly string[]> = new Map([
  ['AELPS', ['LEAPS', 'PALES', 'PEALS', 'SEPAL', 'PLEAS']],
  ['AELRT', ['ALTER', 'LATER', 'RATEL', 'ALERT']],
  ['AENRS', ['EARNS', 'NEARS', 'SANER', 'SNARE']],
  ['EINST', ['INSET', 'STEIN', 'TINES', 'TSINE', 'SENTI']],
  ['DEILS', ['IDLES', 'SLIDE', 'SIDLE', 'DELIS']],
  ['AELST', ['STEAL', 'TALES', 'SLATE', 'STALE', 'LEAST', 'TESLA']],
  ['EINPS', ['SPINE', 'PINES', 'SNIPE', 'PEINS']],
  ['ACERT', ['TRACE', 'CRATE', 'CATER', 'REACT', 'CARTE']],
  ['DEIRS', ['RIDES', 'SIRED', 'DRIES', 'RESID']],
  ['AEIST', ['IRATE', 'ARISE']],
  ['ACERS', ['CARES', 'ACRES', 'RACES', 'SCARE', 'ARCES']],
  ['AINST', ['SAINT', 'STAIN', 'SATIN', 'ANTIS']],
  ['EINRT', ['INTER', 'INERT', 'TRINE', 'NITER']],
  ['AELNS', ['LANES', 'LEANS', 'ELANS', 'NEALS']],
  ['DEIST', ['DIETS', 'EDITS', 'SITED', 'TIDES', 'STIED']],
  ['GINRS', ['RINGS', 'GRINS', 'GIRNS', 'SRING']],
  ['AELMS', ['MALES', 'MEALS', 'LAMES', 'ALMES', 'MESAL']],
  ['EORST', ['STORE', 'ROTES', 'TORES', 'STORE']],
  ['EINRS', ['REINS', 'RINSE', 'RISEN', 'SIREN', 'SERIN']],
  ['AILNS', ['NAILS', 'SLAIN', 'SNAIL', 'ANILS']],
]);

/** Curated seed words (one per anagram group, always valid). */
const SEED_WORDS: readonly string[] = [
  'LEAPS', 'ALTER', 'EARNS', 'STEIN', 'SLIDE',
  'STEAL', 'SPINE', 'TRACE', 'RIDES', 'CARES',
  'SAINT', 'INTER', 'LANES', 'DIETS', 'RINGS',
  'MALES', 'STORE', 'REINS', 'NAILS',
];

// ─── Helpers ─────────────────────────────────

/** Sort letters alphabetically to form the canonical key. */
function sortKey(word: string): string {
  return [...word.toUpperCase()].sort().join('');
}

/** Fisher-Yates shuffle for strings. */
function scrambleWord(word: string): string {
  const chars = [...word.toUpperCase()];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }
  const result = chars.join('');
  // If scramble produced the same word, swap first two chars
  return result === word.toUpperCase()
    ? chars[1] + chars[0] + chars.slice(2).join('')
    : result;
}

/**
 * Look up all valid anagrams for a given word from the dictionary.
 * Falls back to only the seed word if no group is found.
 */
function findAnagrams(word: string): ReadonlySet<string> {
  const key = sortKey(word);
  const group = ANAGRAM_GROUPS.get(key);
  if (group) {
    return new Set(group.map((w) => w.toUpperCase()));
  }
  return new Set([word.toUpperCase()]);
}

// ─── Public API ──────────────────────────────

/**
 * Generate a Cipher Scramble puzzle.
 */
export function generateCipherScramble(
  minLength: number = 4,
): CipherScramblePuzzle {
  const seedWord =
    SEED_WORDS[Math.floor(Math.random() * SEED_WORDS.length)].toUpperCase();
  const scrambled = scrambleWord(seedWord);
  const validAnagrams = findAnagrams(seedWord);

  return {
    seedWord,
    scrambled,
    validAnagrams,
    minLength,
  };
}

/**
 * Create a fresh game state from a puzzle.
 */
export function createCipherScrambleState(
  puzzle: CipherScramblePuzzle,
  timeLimit: number = 120,
): CipherScrambleState {
  return {
    puzzle,
    foundWords: new Set<string>(),
    currentInput: '',
    timeRemaining: timeLimit,
  };
}

/**
 * Check whether a user-submitted word is a valid anagram.
 * Returns true if:
 * 1. The word uses only letters from the scrambled set
 * 2. The word is in the valid anagrams set
 * 3. The word meets the minimum length
 * 4. The word hasn't been found yet
 */
export function validateAnagram(
  state: CipherScrambleState,
  word: string,
): boolean {
  const upper = word.toUpperCase();
  if (upper.length < state.puzzle.minLength) return false;
  if (state.foundWords.has(upper)) return false;

  // Check letters are a subset of the scrambled letters
  const available = [...state.puzzle.scrambled];
  for (const ch of upper) {
    const idx = available.indexOf(ch);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }

  return state.puzzle.validAnagrams.has(upper);
}

/**
 * Submit a word and return the next state.
 * Pure function.
 */
export function submitAnagram(
  state: CipherScrambleState,
  word: string,
): CipherScrambleState {
  if (!validateAnagram(state, word)) return state;

  const nextFound = new Set(state.foundWords);
  nextFound.add(word.toUpperCase());

  return {
    ...state,
    foundWords: nextFound,
    currentInput: '',
  };
}
