// ──────────────────────────────────────────────
// NINE — Trivia & Deduction Game Types
// ──────────────────────────────────────────────

// ─── Shared ──────────────────────────────────

export type TriviaGameMode =
  | 'interrogation'
  | 'dataSift'
  | 'lexiconWeave'
  | 'aliasProtocol'
  | 'globalOverride';

export interface TriviaGameResult {
  mode: TriviaGameMode;
  totalScore: number;
  questionsAnswered: number;
  accuracy: number;
  timeElapsed: number;
}

// ─── 1. The Interrogation (Timed Quiz) ──────

export type InterrogationDifficulty = 'rookie' | 'agent' | 'commander' | 'shadow';

export interface InterrogationQuestion {
  id: string;
  prompt: string;
  choices: readonly [string, string, string, string];
  /** Index 0-3 of the correct choice. */
  correctIndex: number;
  category: string;
  /** Base XP awarded for a correct answer before multiplier. */
  baseXp: number;
}

export interface InterrogationConfig {
  difficulty: InterrogationDifficulty;
  /** Seconds allowed per question. */
  timePerQuestion: number;
  /** Total questions in the round. */
  totalQuestions: number;
  /** Starting score multiplier (degrades over time). */
  maxMultiplier: number;
  /** Minimum multiplier floor (never drops below this). */
  minMultiplier: number;
}

export interface InterrogationRoundState {
  config: InterrogationConfig;
  questions: readonly InterrogationQuestion[];
  currentIndex: number;
  /** Seconds remaining for the current question. */
  timeRemaining: number;
  /** Millisecond timestamp when the current question was shown. */
  questionStartedAt: number;
  /** Current score multiplier (degrades each 100ms the question is open). */
  currentMultiplier: number;
  score: number;
  streak: number;
  /** Per-question results (null = unanswered). */
  answers: (InterrogationAnswerResult | null)[];
  isComplete: boolean;
}

export interface InterrogationAnswerResult {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
  /** Time in ms the player took to answer. */
  responseTimeMs: number;
  /** The multiplier at the moment of answering. */
  multiplierAtAnswer: number;
  /** Actual XP earned (baseXp * multiplier, 0 if wrong). */
  xpEarned: number;
}

// ─── 2. Data Sift (Categorization Matrix) ────

export interface DataSiftItem {
  id: string;
  label: string;
  /** Which category this item belongs to. */
  category: string;
}

export interface DataSiftPuzzle {
  /** The target category the player must identify items for. */
  targetCategory: string;
  /** All 16 items in the grid (exactly 4 belong to the target). */
  items: readonly [
    DataSiftItem, DataSiftItem, DataSiftItem, DataSiftItem,
    DataSiftItem, DataSiftItem, DataSiftItem, DataSiftItem,
    DataSiftItem, DataSiftItem, DataSiftItem, DataSiftItem,
    DataSiftItem, DataSiftItem, DataSiftItem, DataSiftItem,
  ];
  /** IDs of the 4 correct items. */
  correctItemIds: readonly [string, string, string, string];
}

export interface DataSiftValidationResult {
  correct: readonly string[];
  incorrect: readonly string[];
  missed: readonly string[];
  perfectMatch: boolean;
  score: number;
}

export interface DataSiftState {
  puzzle: DataSiftPuzzle;
  /** Currently selected item IDs (max 4). */
  selectedIds: Set<string>;
  /** Items revealed as wrong (for penalty display). */
  penalizedIds: Set<string>;
  attemptsUsed: number;
  maxAttempts: number;
  score: number;
  solved: boolean;
}

// ─── 3. Lexicon / Enigma Weave (Crossword) ──

export type CrosswordCellType = 'input' | 'void';

export type ClueDirection = 'across' | 'down';

export interface CrosswordCell {
  type: CrosswordCellType;
  /** The correct letter (null for void cells). */
  solution: string | null;
  /** The player's current input (null if empty or void). */
  playerValue: string | null;
  /** Clue number displayed in the cell corner (null if not a clue start). */
  clueNumber: number | null;
  row: number;
  col: number;
}

export interface CrosswordClue {
  number: number;
  direction: ClueDirection;
  text: string;
  /** Starting row of the answer. */
  startRow: number;
  /** Starting col of the answer. */
  startCol: number;
  /** Number of letters in the answer. */
  length: number;
  /** The full correct answer string. */
  answer: string;
}

export interface CrosswordPuzzle {
  width: number;
  height: number;
  grid: CrosswordCell[][];
  clues: readonly CrosswordClue[];
  /** Whether this is a cryptic crossword (Enigma Weave). */
  isCryptic: boolean;
  title: string;
}

export interface CrosswordState {
  puzzle: CrosswordPuzzle;
  /** Current focus position. */
  focusRow: number;
  focusCol: number;
  focusDirection: ClueDirection;
  /** Set of "row,col" keys the player has filled correctly. */
  correctCells: Set<string>;
  /** Errors revealed (only populated after explicit check). */
  errorCells: Set<string>;
  isComplete: boolean;
  score: number;
}

// ─── 4. Alias Protocol (Progressive Deduction) ─

export type AliasEntityType = 'person' | 'place' | 'thing';

export interface AliasClue {
  index: number;
  text: string;
  /** XP this clue is worth if the player guesses correctly after seeing it. */
  xpValue: number;
}

export interface AliasProtocolPuzzle {
  entityType: AliasEntityType;
  answer: string;
  /** Alternate accepted spellings / names. */
  acceptedAnswers: readonly string[];
  clues: readonly [AliasClue, AliasClue, AliasClue, AliasClue, AliasClue];
  category: string;
}

export interface AliasProtocolState {
  puzzle: AliasProtocolPuzzle;
  /** Number of clues currently revealed (1-5). */
  cluesRevealed: number;
  /** The maximum XP the player can still earn. */
  currentMaxXp: number;
  guesses: readonly string[];
  maxGuesses: number;
  solved: boolean;
  failed: boolean;
  /** The XP actually earned (0 if failed). */
  xpEarned: number;
}

// ─── 5. Global Override (Geo Flash) ──────────

export type GeoPromptType = 'capital_of' | 'country_of_capital' | 'continent_of' | 'flag_of';

export interface GeoEntry {
  country: string;
  capital: string;
  continent: string;
  /** ISO 3166-1 alpha-2 code for flag lookup. */
  isoCode: string;
}

export interface GeoPrompt {
  type: GeoPromptType;
  displayText: string;
  /** The correct answer string. */
  correctAnswer: string;
  /** Additional accepted spellings. */
  acceptedAnswers: readonly string[];
  /** Time limit in seconds for this prompt. */
  timeLimit: number;
}

export interface GlobalOverrideConfig {
  totalRounds: number;
  timePerPrompt: number;
  promptTypes: readonly GeoPromptType[];
}

export interface GlobalOverrideState {
  config: GlobalOverrideConfig;
  prompts: readonly GeoPrompt[];
  currentIndex: number;
  timeRemaining: number;
  score: number;
  streak: number;
  maxStreak: number;
  answers: (GeoAnswerResult | null)[];
  isComplete: boolean;
}

export interface GeoAnswerResult {
  promptIndex: number;
  playerAnswer: string;
  correct: boolean;
  responseTimeMs: number;
  xpEarned: number;
}
