// ──────────────────────────────────────────────
// NINE — Data Sift (Categorization Matrix) Engine
// ──────────────────────────────────────────────

import type {
  DataSiftItem,
  DataSiftPuzzle,
  DataSiftState,
  DataSiftValidationResult,
} from '../../types/trivia_games';

// ─── Puzzle Data ─────────────────────────────

interface CategoryData {
  category: string;
  correct: readonly string[];
  distractors: readonly string[];
}

const CATEGORY_POOL: readonly CategoryData[] = [
  {
    category: 'Nobel Prize Winners in Physics',
    correct: ['Einstein', 'Feynman', 'Curie', 'Bohr'],
    distractors: ['Darwin', 'Pasteur', 'Turing', 'Mendel', 'Watson', 'Pauling', 'Hawking', 'Sagan', 'Tesla', 'Edison', 'Newton', 'Galileo'],
  },
  {
    category: 'Landlocked Countries',
    correct: ['Switzerland', 'Mongolia', 'Bolivia', 'Nepal'],
    distractors: ['Chile', 'Thailand', 'Turkey', 'Greece', 'Finland', 'Cuba', 'Japan', 'Iceland', 'Norway', 'Kenya', 'Vietnam', 'Egypt'],
  },
  {
    category: 'Prime Numbers Under 50',
    correct: ['37', '41', '43', '47'],
    distractors: ['21', '25', '27', '33', '35', '39', '45', '49', '9', '15', '51', '57'],
  },
  {
    category: 'Shakespeare Plays',
    correct: ['Hamlet', 'Othello', 'Macbeth', 'Tempest'],
    distractors: ['Faust', 'Candide', 'Inferno', 'Ulysses', 'Dracula', 'Beloved', 'Gatsby', 'Dune', 'Moor', 'Crown', 'Throne', 'Oracle'],
  },
  {
    category: 'Chemical Elements Named After People',
    correct: ['Curium', 'Einsteinium', 'Fermium', 'Nobelium'],
    distractors: ['Helium', 'Neon', 'Argon', 'Xenon', 'Radon', 'Krypton', 'Oxygen', 'Carbon', 'Silicon', 'Iridium', 'Osmium', 'Cobalt'],
  },
  {
    category: 'Functional Programming Languages',
    correct: ['Haskell', 'Erlang', 'Clojure', 'Elixir'],
    distractors: ['Java', 'Python', 'C++', 'Ruby', 'PHP', 'Perl', 'Swift', 'Kotlin', 'Go', 'Rust', 'COBOL', 'Fortran'],
  },
  {
    category: 'Bones in the Human Hand',
    correct: ['Scaphoid', 'Lunate', 'Capitate', 'Hamate'],
    distractors: ['Femur', 'Tibia', 'Fibula', 'Patella', 'Radius', 'Ulna', 'Humerus', 'Clavicle', 'Sternum', 'Sacrum', 'Atlas', 'Talus'],
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
 * Generate a Data Sift puzzle.
 * Picks a random category, selects 4 correct items + 12 distractors,
 * shuffles them into a 16-item grid.
 */
export function generateDataSift(): DataSiftPuzzle {
  const data = CATEGORY_POOL[Math.floor(Math.random() * CATEGORY_POOL.length)];

  const correctItems: DataSiftItem[] = data.correct.map((label, i) => ({
    id: `correct-${i}`,
    label,
    category: data.category,
  }));

  const distractorItems: DataSiftItem[] = shuffle([...data.distractors])
    .slice(0, 12)
    .map((label, i) => ({
      id: `distractor-${i}`,
      label,
      category: 'other',
    }));

  const allItems = shuffle([...correctItems, ...distractorItems]);

  return {
    targetCategory: data.category,
    items: allItems as unknown as DataSiftPuzzle['items'],
    correctItemIds: correctItems.map((i) => i.id) as unknown as DataSiftPuzzle['correctItemIds'],
  };
}

/**
 * Create a fresh game state.
 */
export function createDataSiftState(
  puzzle: DataSiftPuzzle,
  maxAttempts: number = 3,
): DataSiftState {
  return {
    puzzle,
    selectedIds: new Set<string>(),
    penalizedIds: new Set<string>(),
    attemptsUsed: 0,
    maxAttempts,
    score: 0,
    solved: false,
  };
}

/**
 * Toggle an item selection. Max 4 selected at once.
 * Pure function.
 */
export function toggleSiftSelection(
  state: DataSiftState,
  itemId: string,
): DataSiftState {
  if (state.solved) return state;

  const next = new Set(state.selectedIds);

  if (next.has(itemId)) {
    next.delete(itemId);
  } else {
    if (next.size >= 4) return state; // max 4 selections
    next.add(itemId);
  }

  return { ...state, selectedIds: next };
}

/**
 * Validate the current selection against the target category.
 * Returns a detailed result. Does NOT mutate state.
 */
export function validateSift(
  selectedIds: ReadonlySet<string>,
  puzzle: DataSiftPuzzle,
): DataSiftValidationResult {
  const correctSet = new Set(puzzle.correctItemIds);
  const selected = [...selectedIds];

  const correct: string[] = [];
  const incorrect: string[] = [];
  const missed: string[] = [];

  for (const id of selected) {
    if (correctSet.has(id)) {
      correct.push(id);
    } else {
      incorrect.push(id);
    }
  }

  for (const id of puzzle.correctItemIds) {
    if (!selectedIds.has(id)) {
      missed.push(id);
    }
  }

  const perfectMatch = incorrect.length === 0 && missed.length === 0;

  // Score: +250 per correct, -100 per incorrect
  const score = correct.length * 250 - incorrect.length * 100;

  return { correct, incorrect, missed, perfectMatch, score: Math.max(0, score) };
}

/**
 * Submit the current selection for validation.
 * Returns the next state. Pure function.
 */
export function submitSiftSelection(
  state: DataSiftState,
): DataSiftState {
  if (state.solved) return state;
  if (state.selectedIds.size !== 4) return state;

  const result = validateSift(state.selectedIds, state.puzzle);

  const nextPenalized = new Set(state.penalizedIds);
  for (const id of result.incorrect) {
    nextPenalized.add(id);
  }

  const nextAttempts = state.attemptsUsed + 1;

  if (result.perfectMatch) {
    return {
      ...state,
      attemptsUsed: nextAttempts,
      penalizedIds: nextPenalized,
      score: state.score + result.score,
      solved: true,
    };
  }

  // Not perfect — deselect incorrect items, keep correct locked
  const nextSelected = new Set<string>();
  for (const id of result.correct) {
    nextSelected.add(id);
  }

  return {
    ...state,
    selectedIds: nextSelected,
    penalizedIds: nextPenalized,
    attemptsUsed: nextAttempts,
    score: state.score + result.score,
  };
}
