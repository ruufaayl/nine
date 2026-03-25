// ──────────────────────────────────────────────
// NINE — Expanded Game Mode Types
// ──────────────────────────────────────────────

// ─── Shared ──────────────────────────────────

export type ExpandedGameMode =
  | 'glyphGrid'
  | 'vaultBreaker'
  | 'cipherScramble'
  | 'chronosShift'
  | 'cinemaLattice';

export interface GameResult {
  mode: ExpandedGameMode;
  solved: boolean;
  timeElapsed: number;
  score: number;
}

// ─── 1. Glyph Grid (Wordoku) ────────────────

/** A single cell in a 9×9 Wordoku grid. */
export interface GlyphCell {
  readonly row: number;
  readonly col: number;
  value: string | null;
  isGiven: boolean;
  pencilMarks: Set<string>;
  isValid: boolean;
}

export type GlyphRow = [
  GlyphCell, GlyphCell, GlyphCell,
  GlyphCell, GlyphCell, GlyphCell,
  GlyphCell, GlyphCell, GlyphCell,
];

export type GlyphGrid = [
  GlyphRow, GlyphRow, GlyphRow,
  GlyphRow, GlyphRow, GlyphRow,
  GlyphRow, GlyphRow, GlyphRow,
];

export interface GlyphGridPuzzle {
  /** The 9-letter heterogram used as the symbol set. */
  heterogram: string;
  /** Mapping: index 0-8 → character (preserves number↔letter bijection). */
  charMap: readonly [string, string, string, string, string, string, string, string, string];
  initial: GlyphGrid;
  solved: GlyphGrid;
  /** The target word spelled by the main diagonal. */
  diagonalWord: string;
}

// ─── 2. Vault Breaker (Cryptex / Wordle) ─────

export type VaultSlotState =
  | 'correct_placement'
  | 'wrong_placement'
  | 'not_in_word';

export interface VaultGuessResult {
  guess: string;
  slots: VaultSlotState[];
}

export interface VaultBreakerPuzzle {
  /** Length of the target word (5 or 6). */
  wordLength: 5 | 6;
  /** Maximum number of attempts. */
  maxGuesses: number;
  /** The secret target word (hidden from UI). */
  target: string;
}

export interface VaultBreakerState {
  puzzle: VaultBreakerPuzzle;
  guesses: VaultGuessResult[];
  currentInput: string;
  solved: boolean;
  failed: boolean;
}

// ─── 3. Cipher Scramble (Anagrams) ───────────

export interface CipherScramblePuzzle {
  /** The original seed word (the canonical answer). */
  seedWord: string;
  /** The scrambled letter sequence shown to the player. */
  scrambled: string;
  /** All valid anagrams of the seed (including the seed itself). */
  validAnagrams: ReadonlySet<string>;
  /** Minimum word length accepted as a valid answer. */
  minLength: number;
}

export interface CipherScrambleState {
  puzzle: CipherScramblePuzzle;
  /** Words the player has successfully found. */
  foundWords: Set<string>;
  currentInput: string;
  timeRemaining: number;
}

// ─── 4. Chronos Shift (Sorting / Ordering) ───

export interface ChronosItem {
  id: string;
  label: string;
  /** The hidden sort key (year, population, etc.). */
  sortValue: number;
  /** Display hint shown after correct placement. */
  revealText: string;
}

export type ChronosSortDirection = 'ascending' | 'descending';

export interface ChronosShiftPuzzle {
  items: readonly [ChronosItem, ChronosItem, ChronosItem, ChronosItem, ChronosItem];
  sortDirection: ChronosSortDirection;
  category: string;
}

export interface ChronosShiftState {
  puzzle: ChronosShiftPuzzle;
  /** Current ordering (array of item IDs). */
  currentOrder: [string, string, string, string, string];
  /** Which slots are locked in (confirmed correct). */
  lockedSlots: [boolean, boolean, boolean, boolean, boolean];
  attemptsUsed: number;
  maxAttempts: number;
  solved: boolean;
}

// ─── 5. Cinema Lattice (Movie Matrix) ────────

export interface CinemaEntity {
  id: string;
  name: string;
  type: 'actor' | 'director' | 'genre' | 'decade';
}

export interface CinemaAnswer {
  movieTitle: string;
  year: number;
}

export interface CinemaLatticeCell {
  rowEntity: CinemaEntity;
  colEntity: CinemaEntity;
  /** The correct answer(s) — some intersections may accept multiple movies. */
  validAnswers: readonly CinemaAnswer[];
  /** The player's submitted answer (null if unanswered). */
  playerAnswer: string | null;
  isCorrect: boolean | null;
}

/** 3×3 grid of cinema intersections. */
export type CinemaLatticeGrid = [
  [CinemaLatticeCell, CinemaLatticeCell, CinemaLatticeCell],
  [CinemaLatticeCell, CinemaLatticeCell, CinemaLatticeCell],
  [CinemaLatticeCell, CinemaLatticeCell, CinemaLatticeCell],
];

export interface CinemaLatticePuzzle {
  rowEntities: readonly [CinemaEntity, CinemaEntity, CinemaEntity];
  colEntities: readonly [CinemaEntity, CinemaEntity, CinemaEntity];
  grid: CinemaLatticeGrid;
}

export interface CinemaLatticeState {
  puzzle: CinemaLatticePuzzle;
  /** Number of correct guesses out of 9. */
  correctCount: number;
  guessesRemaining: number;
  solved: boolean;
}
