// ──────────────────────────────────────────────
// NINE — Shared Game Mode Data
// Single source of truth for all 14 game modes
// ──────────────────────────────────────────────

export type GameCategory = 'Core Systems' | 'The Cyphers' | 'The Archives' | 'The Matrices';

export interface GameModeEntry {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
  rules: string[];
  playerCount: string;
  avgDuration: string;
}

// ─── Mode Definitions ───────────────────────

export const GAME_MODES: readonly GameModeEntry[] = [
  {
    id: 'prime-grid',
    name: 'Prime Grid',
    description: 'Classic 9×9 logic.',
    category: 'Core Systems',
    rules: [
      'Fill the 9×9 grid so every row, column, and 3×3 box contains 1–9.',
      'Given cells are locked and cannot be changed.',
      'Use pencil marks to track candidates.',
      'Errors are flagged in real-time.',
    ],
    playerCount: '1v1',
    avgDuration: '8 min',
  },
  {
    id: 'glyph-grid',
    name: 'Glyph Grid',
    description: 'Wordoku with diagonals.',
    category: 'Core Systems',
    rules: [
      'Fill the grid with 9 unique letters instead of numbers.',
      'Diagonal constraints add an extra dimension.',
      'Each letter appears exactly once per row, column, box, and diagonal.',
      'Speed determines your multiplier.',
    ],
    playerCount: '1v1',
    avgDuration: '10 min',
  },
  {
    id: 'shattered-grid',
    name: 'Shattered Grid',
    description: 'Reassemble polyomino shards.',
    category: 'Core Systems',
    rules: [
      'Drag polyomino fragments onto the assembly board.',
      'All fragments must fit without overlap.',
      'Fragments snap to grid positions when close enough.',
      'Fewer moves = higher score.',
    ],
    playerCount: '1v1',
    avgDuration: '5 min',
  },
  {
    id: 'canvas-fracture',
    name: 'Canvas Fracture',
    description: 'Slide & rotate tiles.',
    category: 'Core Systems',
    rules: [
      'A scrambled image is split into tiles.',
      'Slide and rotate tiles to restore the original.',
      'Tap to rotate, drag to slide.',
      'Solve under the time limit for bonus XP.',
    ],
    playerCount: '1v1',
    avgDuration: '6 min',
  },
  {
    id: 'vault-breaker',
    name: 'Vault Breaker',
    description: 'Crack the 5-letter code.',
    category: 'The Cyphers',
    rules: [
      'Guess the 5-letter code in 6 attempts.',
      'Green = correct letter & position. Yellow = correct letter, wrong position.',
      'Gray = letter not in the code.',
      'First to crack it wins the round.',
    ],
    playerCount: '1v1',
    avgDuration: '4 min',
  },
  {
    id: 'cipher-scramble',
    name: 'Cipher Scramble',
    description: 'Unscramble. Find every word.',
    category: 'The Cyphers',
    rules: [
      'Given a set of scrambled letters, find all valid words.',
      'Longer words score more points.',
      'Time pressure increases as the clock ticks down.',
      'Bonus for finding all possible words.',
    ],
    playerCount: '1v1',
    avgDuration: '5 min',
  },
  {
    id: 'lexicon-weave',
    name: 'Lexicon Weave',
    description: 'Crossword intersections.',
    category: 'The Cyphers',
    rules: [
      'Fill interlocking word slots from given clues.',
      'Intersecting letters must match across words.',
      'No hints — pure vocabulary and deduction.',
      'Complete the grid before your opponent.',
    ],
    playerCount: '1v1',
    avgDuration: '7 min',
  },
  {
    id: 'enigma-weave',
    name: 'Enigma Weave',
    description: 'Cryptic double meanings.',
    category: 'The Cyphers',
    rules: [
      'Each clue has a surface reading and a cryptic definition.',
      'Decode wordplay: anagrams, containers, reversals.',
      'Type your answer and lock it in.',
      'Most correct answers wins.',
    ],
    playerCount: '1v1',
    avgDuration: '8 min',
  },
  {
    id: 'interrogation',
    name: 'The Interrogation',
    description: 'Timed quiz. Multiplier decays.',
    category: 'The Archives',
    rules: [
      'Answer trivia questions as fast as possible.',
      'A score multiplier decays over time per question.',
      'Wrong answers reset your streak multiplier.',
      'Highest cumulative score after 10 rounds wins.',
    ],
    playerCount: '1v1',
    avgDuration: '5 min',
  },
  {
    id: 'alias-protocol',
    name: 'Alias Protocol',
    description: '5 clues. 3 guesses.',
    category: 'The Archives',
    rules: [
      'You receive 5 one-word clues about a mystery subject.',
      'You have 3 attempts to guess correctly.',
      'Earlier guesses earn more points.',
      'Clues range from obscure to obvious.',
    ],
    playerCount: '1v1',
    avgDuration: '3 min',
  },
  {
    id: 'global-override',
    name: 'Global Override',
    description: 'Rapid-fire geo flash.',
    category: 'The Archives',
    rules: [
      'Identify countries, capitals, or landmarks from visual clues.',
      'Speed-round format with 15-second per question.',
      'Proximity scoring for map-based questions.',
      'Perfect streak unlocks bonus rounds.',
    ],
    playerCount: '1v1',
    avgDuration: '4 min',
  },
  {
    id: 'data-sift',
    name: 'Data Sift',
    description: 'Find 4 that belong.',
    category: 'The Matrices',
    rules: [
      '16 items are shown. Find 4 groups of 4 related items.',
      'Select 4 items and submit your grouping.',
      'Incorrect guesses cost a life (3 lives).',
      'Difficulty increases with each correct group.',
    ],
    playerCount: '1v1',
    avgDuration: '6 min',
  },
  {
    id: 'cinema-lattice',
    name: 'Cinema Lattice',
    description: 'Actor-genre-decade matrix.',
    category: 'The Matrices',
    rules: [
      'Fill a 3×3 matrix where rows and columns are constraints.',
      'Each cell must satisfy both its row and column category.',
      'Example: Row = "Action", Column = "1980s" → name an 80s action film.',
      'Obscure answers score higher.',
    ],
    playerCount: '1v1',
    avgDuration: '5 min',
  },
  {
    id: 'chronos-shift',
    name: 'Chronos Shift',
    description: 'Sort events chronologically.',
    category: 'The Matrices',
    rules: [
      'A set of historical events is presented in random order.',
      'Drag them into chronological order.',
      'Scoring is based on accuracy and speed.',
      'Bonus points for perfect order.',
    ],
    playerCount: '1v1',
    avgDuration: '4 min',
  },
];

// ─── Category Data ──────────────────────────

export const CATEGORIES: readonly GameCategory[] = [
  'Core Systems',
  'The Cyphers',
  'The Archives',
  'The Matrices',
];

export const CATEGORY_ACCENTS: Record<GameCategory, string> = {
  'Core Systems': '#00FFFF',
  'The Cyphers':  '#FF00FF',
  'The Archives': '#FF6600',
  'The Matrices': '#AAFF00',
};

export const CATEGORY_GLYPHS: Record<GameCategory, string> = {
  'Core Systems': '◈',
  'The Cyphers':  '⟁',
  'The Archives': '⧖',
  'The Matrices': '⬡',
};

// ─── Helpers ────────────────────────────────

export function getModeById(id: string): GameModeEntry | undefined {
  return GAME_MODES.find((m) => m.id === id);
}

export function getModesForCategory(cat: GameCategory): GameModeEntry[] {
  return GAME_MODES.filter((m) => m.category === cat);
}
