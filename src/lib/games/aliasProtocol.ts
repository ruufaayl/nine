// ──────────────────────────────────────────────
// NINE — Alias Protocol (Progressive Deduction) Engine
// ──────────────────────────────────────────────

import type {
  AliasClue,
  AliasEntityType,
  AliasProtocolPuzzle,
  AliasProtocolState,
} from '../../types/trivia_games';

// ─── Constants ───────────────────────────────

/** XP per clue level: clue 1 = 500, clue 2 = 400, ... clue 5 = 100. */
const XP_PER_CLUE: readonly [number, number, number, number, number] = [500, 400, 300, 200, 100];

const DEFAULT_MAX_GUESSES = 3;

// ─── Puzzle Bank ─────────────────────────────

interface PuzzleTemplate {
  entityType: AliasEntityType;
  answer: string;
  acceptedAnswers: readonly string[];
  clueTexts: readonly [string, string, string, string, string];
  category: string;
}

const PUZZLE_BANK: readonly PuzzleTemplate[] = [
  {
    entityType: 'person',
    answer: 'Ada Lovelace',
    acceptedAnswers: ['Ada Lovelace', 'Lovelace', 'Augusta Ada King'],
    clueTexts: [
      'Born in 1815, this person\'s parent was a famous Romantic poet.',
      'They are often associated with Charles Babbage\'s Analytical Engine.',
      'They wrote what is considered the first computer algorithm.',
      'They have a programming language named after them.',
      'Daughter of Lord Byron, often called the first computer programmer.',
    ],
    category: 'Technology Pioneers',
  },
  {
    entityType: 'person',
    answer: 'Nikola Tesla',
    acceptedAnswers: ['Nikola Tesla', 'Tesla'],
    clueTexts: [
      'Born in the Austrian Empire in 1856, this person held over 300 patents.',
      'They famously feuded with a peer over the distribution of electricity.',
      'They demonstrated wireless energy transfer and built a famous coil.',
      'Their surname is now a unit of measurement for magnetic flux density.',
      'A major electric car company is named after this Serbian-American inventor.',
    ],
    category: 'Science & Invention',
  },
  {
    entityType: 'place',
    answer: 'Machu Picchu',
    acceptedAnswers: ['Machu Picchu', 'Macchu Picchu', 'Machu Pichu'],
    clueTexts: [
      'This place sits at approximately 2,430 meters above sea level.',
      'It was built in the 15th century and abandoned roughly 100 years later.',
      'Hiram Bingham III brought it to international attention in 1911.',
      'It is located on a mountain ridge above the Urubamba River valley.',
      'This Incan citadel in Peru is one of the New Seven Wonders of the World.',
    ],
    category: 'World Landmarks',
  },
  {
    entityType: 'place',
    answer: 'Chernobyl',
    acceptedAnswers: ['Chernobyl', 'Chornobyl', 'Pripyat'],
    clueTexts: [
      'An event here in 1986 was rated 7 on the INES scale.',
      'The area around it is now an Exclusion Zone spanning 2,600 km².',
      'Reactor number 4 was at the center of the incident.',
      'A massive concrete sarcophagus was built to contain the aftermath.',
      'This Ukrainian city\'s nuclear disaster is the worst in history.',
    ],
    category: 'Historic Events',
  },
  {
    entityType: 'thing',
    answer: 'Bitcoin',
    acceptedAnswers: ['Bitcoin', 'BTC'],
    clueTexts: [
      'Its foundational paper was published in October 2008 under a pseudonym.',
      'The genesis block contains a hidden message referencing a newspaper headline.',
      'Its supply is mathematically capped at 21 million units.',
      'It uses a proof-of-work consensus mechanism with SHA-256 hashing.',
      'Created by the pseudonymous Satoshi Nakamoto, it is the first cryptocurrency.',
    ],
    category: 'Technology',
  },
  {
    entityType: 'thing',
    answer: 'The Rosetta Stone',
    acceptedAnswers: ['Rosetta Stone', 'The Rosetta Stone'],
    clueTexts: [
      'This object dates to 196 BC and was created during the Ptolemaic dynasty.',
      'It was discovered by French soldiers in 1799 during a military campaign.',
      'It contains the same text written in three different scripts.',
      'Jean-François Champollion used it to decode an ancient writing system.',
      'This granodiorite stele was the key to deciphering Egyptian hieroglyphs.',
    ],
    category: 'Historical Artifacts',
  },
  {
    entityType: 'person',
    answer: 'Alan Turing',
    acceptedAnswers: ['Alan Turing', 'Turing'],
    clueTexts: [
      'This person published a groundbreaking paper in 1936 about computable numbers.',
      'During WWII, they worked at a secret facility in Buckinghamshire, England.',
      'They devised a test to determine if a machine can exhibit intelligent behavior.',
      'They helped crack the Enigma cipher, shortening the war by an estimated 2 years.',
      'Often called the father of computer science, they were posthumously pardoned in 2013.',
    ],
    category: 'Technology Pioneers',
  },
  {
    entityType: 'person',
    answer: 'Marie Curie',
    acceptedAnswers: ['Marie Curie', 'Curie', 'Maria Sklodowska-Curie'],
    clueTexts: [
      'Born in Warsaw in 1867, this person studied secretly due to restrictions on women.',
      'They are the only person to win Nobel Prizes in two different sciences.',
      'They discovered two chemical elements, one named after their homeland.',
      'Their personal effects remain radioactive and are stored in lead-lined boxes.',
      'This physicist and chemist pioneered research on radioactivity.',
    ],
    category: 'Science & Discovery',
  },
];

// ─── Helpers ─────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Public API ──────────────────────────────

/**
 * Generate an Alias Protocol puzzle.
 * Clues are ordered hardest (index 0) → easiest (index 4).
 * XP degrades: 500 → 400 → 300 → 200 → 100.
 */
export function generateAliasProtocol(): AliasProtocolPuzzle {
  const template = shuffle([...PUZZLE_BANK])[0];

  const clues: [AliasClue, AliasClue, AliasClue, AliasClue, AliasClue] = [
    { index: 0, text: template.clueTexts[0], xpValue: XP_PER_CLUE[0] },
    { index: 1, text: template.clueTexts[1], xpValue: XP_PER_CLUE[1] },
    { index: 2, text: template.clueTexts[2], xpValue: XP_PER_CLUE[2] },
    { index: 3, text: template.clueTexts[3], xpValue: XP_PER_CLUE[3] },
    { index: 4, text: template.clueTexts[4], xpValue: XP_PER_CLUE[4] },
  ];

  return {
    entityType: template.entityType,
    answer: template.answer,
    acceptedAnswers: template.acceptedAnswers,
    clues,
    category: template.category,
  };
}

/**
 * Create a fresh game state. Clue 1 (hardest, 500 XP) is revealed.
 */
export function createAliasProtocolState(
  puzzle: AliasProtocolPuzzle,
  maxGuesses: number = DEFAULT_MAX_GUESSES,
): AliasProtocolState {
  return {
    puzzle,
    cluesRevealed: 1,
    currentMaxXp: XP_PER_CLUE[0], // 500
    guesses: [],
    maxGuesses,
    solved: false,
    failed: false,
    xpEarned: 0,
  };
}

/**
 * Reveal the next clue.
 * Lowers the potential XP to the value of the newly revealed clue.
 * Pure function.
 */
export function revealNextClue(
  state: AliasProtocolState,
): AliasProtocolState {
  if (state.solved || state.failed) return state;
  if (state.cluesRevealed >= 5) return state;

  const nextRevealed = state.cluesRevealed + 1;
  // The max XP is now the value of the most recently revealed clue
  const nextMaxXp = XP_PER_CLUE[nextRevealed - 1];

  return {
    ...state,
    cluesRevealed: nextRevealed,
    currentMaxXp: nextMaxXp,
  };
}

/**
 * Submit a guess.
 * Returns the next state. Pure function.
 */
export function submitAliasGuess(
  state: AliasProtocolState,
  guess: string,
): AliasProtocolState {
  if (state.solved || state.failed) return state;

  const normalizedGuess = normalizeAnswer(guess);
  const nextGuesses = [...state.guesses, guess];

  // Check against all accepted answers
  const isCorrect = state.puzzle.acceptedAnswers.some(
    (accepted) => normalizeAnswer(accepted) === normalizedGuess,
  );

  if (isCorrect) {
    return {
      ...state,
      guesses: nextGuesses,
      solved: true,
      xpEarned: state.currentMaxXp,
    };
  }

  const failed = nextGuesses.length >= state.maxGuesses;

  return {
    ...state,
    guesses: nextGuesses,
    failed,
    xpEarned: 0,
  };
}

/**
 * Get the clues currently visible to the player.
 */
export function getVisibleClues(
  state: AliasProtocolState,
): readonly AliasClue[] {
  return state.puzzle.clues.slice(0, state.cluesRevealed);
}

/**
 * Get a hint about whether to reveal another clue or guess.
 * Returns the XP cost of revealing the next clue.
 */
export function getNextClueXpCost(
  state: AliasProtocolState,
): number | null {
  if (state.cluesRevealed >= 5) return null;
  const currentXp = state.currentMaxXp;
  const nextXp = XP_PER_CLUE[state.cluesRevealed]; // clue after current
  return currentXp - nextXp;
}
