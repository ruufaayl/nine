// ──────────────────────────────────────────────
// NINE — Chronos Shift (Sorting) Engine
// ──────────────────────────────────────────────

import type {
  ChronosItem,
  ChronosShiftPuzzle,
  ChronosShiftState,
  ChronosSortDirection,
} from '../../types/expanded_games';

// ─── Puzzle Data ─────────────────────────────

interface ChronosDataSet {
  category: string;
  direction: ChronosSortDirection;
  items: ChronosItem[];
}

const DATA_SETS: readonly ChronosDataSet[] = [
  {
    category: 'Moon landings',
    direction: 'ascending',
    items: [
      { id: 'a11', label: 'Apollo 11', sortValue: 1969, revealText: 'July 1969' },
      { id: 'a12', label: 'Apollo 12', sortValue: 1969.9, revealText: 'Nov 1969' },
      { id: 'a14', label: 'Apollo 14', sortValue: 1971, revealText: 'Feb 1971' },
      { id: 'a15', label: 'Apollo 15', sortValue: 1971.6, revealText: 'Jul 1971' },
      { id: 'a17', label: 'Apollo 17', sortValue: 1972, revealText: 'Dec 1972' },
    ],
  },
  {
    category: 'World population milestones',
    direction: 'ascending',
    items: [
      { id: 'p1', label: '1 Billion', sortValue: 1804, revealText: '~1804' },
      { id: 'p2', label: '2 Billion', sortValue: 1927, revealText: '~1927' },
      { id: 'p3', label: '3 Billion', sortValue: 1960, revealText: '~1960' },
      { id: 'p5', label: '5 Billion', sortValue: 1987, revealText: '~1987' },
      { id: 'p8', label: '8 Billion', sortValue: 2022, revealText: 'Nov 2022' },
    ],
  },
  {
    category: 'Programming languages created',
    direction: 'ascending',
    items: [
      { id: 'fortran', label: 'Fortran', sortValue: 1957, revealText: '1957' },
      { id: 'c', label: 'C', sortValue: 1972, revealText: '1972' },
      { id: 'python', label: 'Python', sortValue: 1991, revealText: '1991' },
      { id: 'java', label: 'Java', sortValue: 1995, revealText: '1995' },
      { id: 'rust', label: 'Rust', sortValue: 2010, revealText: '2010' },
    ],
  },
  {
    category: 'Tallest buildings (height)',
    direction: 'descending',
    items: [
      { id: 'burj', label: 'Burj Khalifa', sortValue: 828, revealText: '828m' },
      { id: 'merdi', label: 'Merdeka 118', sortValue: 679, revealText: '679m' },
      { id: 'tower', label: 'Shanghai Tower', sortValue: 632, revealText: '632m' },
      { id: 'ctf', label: 'CTF Finance', sortValue: 530, revealText: '530m' },
      { id: 'owtc', label: 'One WTC', sortValue: 541, revealText: '541m' },
    ],
  },
  {
    category: 'Planet distances from Sun',
    direction: 'ascending',
    items: [
      { id: 'merc', label: 'Mercury', sortValue: 57.9, revealText: '57.9M km' },
      { id: 'ven', label: 'Venus', sortValue: 108.2, revealText: '108.2M km' },
      { id: 'earth', label: 'Earth', sortValue: 149.6, revealText: '149.6M km' },
      { id: 'mars', label: 'Mars', sortValue: 227.9, revealText: '227.9M km' },
      { id: 'jup', label: 'Jupiter', sortValue: 778.5, revealText: '778.5M km' },
    ],
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

// ─── Public API ──────────────────────────────

/**
 * Generate a Chronos Shift puzzle from a random data set.
 */
export function generateChronosShift(): ChronosShiftPuzzle {
  const dataSet = DATA_SETS[Math.floor(Math.random() * DATA_SETS.length)];

  return {
    items: dataSet.items as unknown as ChronosShiftPuzzle['items'],
    sortDirection: dataSet.direction,
    category: dataSet.category,
  };
}

/**
 * Create a fresh game state with a shuffled initial ordering.
 */
export function createChronosShiftState(
  puzzle: ChronosShiftPuzzle,
  maxAttempts: number = 5,
): ChronosShiftState {
  const shuffled = shuffle([...puzzle.items].map((i) => i.id));

  return {
    puzzle,
    currentOrder: shuffled as ChronosShiftState['currentOrder'],
    lockedSlots: [false, false, false, false, false],
    attemptsUsed: 0,
    maxAttempts,
    solved: false,
  };
}

/**
 * Swap two positions in the current order.
 * Returns the new state. Pure function.
 */
export function swapItems(
  state: ChronosShiftState,
  indexA: number,
  indexB: number,
): ChronosShiftState {
  if (state.solved) return state;
  if (state.lockedSlots[indexA] || state.lockedSlots[indexB]) return state;
  if (indexA === indexB) return state;

  const nextOrder = [...state.currentOrder] as ChronosShiftState['currentOrder'];
  const tmp = nextOrder[indexA];
  nextOrder[indexA] = nextOrder[indexB];
  nextOrder[indexB] = tmp;

  return { ...state, currentOrder: nextOrder };
}

/**
 * Submit the current ordering for validation.
 * - Locks correct positions in place.
 * - Increments attempts.
 * - Marks solved if all correct.
 */
export function submitChronosOrder(
  state: ChronosShiftState,
): ChronosShiftState {
  if (state.solved) return state;

  const { puzzle, currentOrder } = state;

  // Build the correct order from the items based on sort direction
  const correctOrder = [...puzzle.items]
    .sort((a, b) =>
      puzzle.sortDirection === 'ascending'
        ? a.sortValue - b.sortValue
        : b.sortValue - a.sortValue,
    )
    .map((item) => item.id);

  const nextLocked: ChronosShiftState['lockedSlots'] = [...state.lockedSlots] as ChronosShiftState['lockedSlots'];

  let allCorrect = true;
  for (let i = 0; i < 5; i++) {
    if (currentOrder[i] === correctOrder[i]) {
      nextLocked[i] = true;
    } else {
      allCorrect = false;
    }
  }

  const nextAttempts = state.attemptsUsed + 1;

  return {
    ...state,
    lockedSlots: nextLocked,
    attemptsUsed: nextAttempts,
    solved: allCorrect,
  };
}

/**
 * Check if the game is over (solved or out of attempts).
 */
export function isGameOver(state: ChronosShiftState): boolean {
  return state.solved || state.attemptsUsed >= state.maxAttempts;
}
