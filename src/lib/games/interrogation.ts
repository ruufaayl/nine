// ──────────────────────────────────────────────
// NINE — The Interrogation (Timed Quiz) Engine
// ──────────────────────────────────────────────

import type {
  InterrogationAnswerResult,
  InterrogationConfig,
  InterrogationDifficulty,
  InterrogationQuestion,
  InterrogationRoundState,
} from '../../types/trivia_games';

// ─── Difficulty Presets ──────────────────────

const DIFFICULTY_CONFIGS: Record<InterrogationDifficulty, InterrogationConfig> = {
  rookie: {
    difficulty: 'rookie',
    timePerQuestion: 15,
    totalQuestions: 10,
    maxMultiplier: 2.0,
    minMultiplier: 1.0,
  },
  agent: {
    difficulty: 'agent',
    timePerQuestion: 12,
    totalQuestions: 15,
    maxMultiplier: 3.0,
    minMultiplier: 0.5,
  },
  commander: {
    difficulty: 'commander',
    timePerQuestion: 10,
    totalQuestions: 20,
    maxMultiplier: 4.0,
    minMultiplier: 0.25,
  },
  shadow: {
    difficulty: 'shadow',
    timePerQuestion: 7,
    totalQuestions: 25,
    maxMultiplier: 5.0,
    minMultiplier: 0.1,
  },
};

// ─── Question Bank ───────────────────────────

const QUESTION_BANK: readonly InterrogationQuestion[] = [
  { id: 'q01', prompt: 'What is the only planet that rotates clockwise?', choices: ['Mars', 'Venus', 'Jupiter', 'Saturn'], correctIndex: 1, category: 'Science', baseXp: 100 },
  { id: 'q02', prompt: 'In what year did the Berlin Wall fall?', choices: ['1987', '1989', '1991', '1985'], correctIndex: 1, category: 'History', baseXp: 100 },
  { id: 'q03', prompt: 'What element has the atomic number 79?', choices: ['Silver', 'Platinum', 'Gold', 'Copper'], correctIndex: 2, category: 'Science', baseXp: 100 },
  { id: 'q04', prompt: 'Which language has the most native speakers?', choices: ['English', 'Hindi', 'Mandarin', 'Spanish'], correctIndex: 2, category: 'Geography', baseXp: 100 },
  { id: 'q05', prompt: 'What is the smallest country by area?', choices: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correctIndex: 1, category: 'Geography', baseXp: 100 },
  { id: 'q06', prompt: 'Who painted the ceiling of the Sistine Chapel?', choices: ['Raphael', 'Da Vinci', 'Michelangelo', 'Caravaggio'], correctIndex: 2, category: 'Art', baseXp: 100 },
  { id: 'q07', prompt: 'What is the speed of light in km/s (approx)?', choices: ['150,000', '300,000', '500,000', '1,000,000'], correctIndex: 1, category: 'Science', baseXp: 100 },
  { id: 'q08', prompt: 'Which chess piece can only move diagonally?', choices: ['Rook', 'Knight', 'Bishop', 'Queen'], correctIndex: 2, category: 'Games', baseXp: 100 },
  { id: 'q09', prompt: 'What year was the first iPhone released?', choices: ['2005', '2006', '2007', '2008'], correctIndex: 2, category: 'Tech', baseXp: 100 },
  { id: 'q10', prompt: 'How many bones are in the adult human body?', choices: ['186', '206', '226', '256'], correctIndex: 1, category: 'Science', baseXp: 100 },
  { id: 'q11', prompt: 'Which ocean is the deepest?', choices: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correctIndex: 2, category: 'Geography', baseXp: 100 },
  { id: 'q12', prompt: 'Who wrote "1984"?', choices: ['Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells'], correctIndex: 1, category: 'Literature', baseXp: 100 },
  { id: 'q13', prompt: 'What gas makes up ~78% of Earth\'s atmosphere?', choices: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'], correctIndex: 2, category: 'Science', baseXp: 100 },
  { id: 'q14', prompt: 'In binary, what is the decimal number 10?', choices: ['1010', '1100', '1001', '1110'], correctIndex: 0, category: 'Tech', baseXp: 100 },
  { id: 'q15', prompt: 'Which city hosted the first modern Olympics?', choices: ['Paris', 'London', 'Athens', 'Rome'], correctIndex: 2, category: 'History', baseXp: 100 },
  { id: 'q16', prompt: 'What is the hardest natural substance?', choices: ['Titanium', 'Diamond', 'Graphene', 'Quartz'], correctIndex: 1, category: 'Science', baseXp: 100 },
  { id: 'q17', prompt: 'How many symphonies did Beethoven compose?', choices: ['7', '8', '9', '10'], correctIndex: 2, category: 'Music', baseXp: 100 },
  { id: 'q18', prompt: 'What currency is used in Japan?', choices: ['Won', 'Yuan', 'Yen', 'Baht'], correctIndex: 2, category: 'Geography', baseXp: 100 },
  { id: 'q19', prompt: 'Which protocol operates on port 443?', choices: ['HTTP', 'FTP', 'HTTPS', 'SSH'], correctIndex: 2, category: 'Tech', baseXp: 100 },
  { id: 'q20', prompt: 'What is the largest organ in the human body?', choices: ['Liver', 'Brain', 'Skin', 'Lungs'], correctIndex: 2, category: 'Science', baseXp: 100 },
  { id: 'q21', prompt: 'Who discovered penicillin?', choices: ['Pasteur', 'Fleming', 'Koch', 'Jenner'], correctIndex: 1, category: 'Science', baseXp: 100 },
  { id: 'q22', prompt: 'What is the chemical formula for table salt?', choices: ['KCl', 'NaCl', 'CaCl₂', 'NaOH'], correctIndex: 1, category: 'Science', baseXp: 100 },
  { id: 'q23', prompt: 'Which planet has the most moons?', choices: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correctIndex: 1, category: 'Science', baseXp: 100 },
  { id: 'q24', prompt: 'What is the longest river in the world?', choices: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correctIndex: 1, category: 'Geography', baseXp: 100 },
  { id: 'q25', prompt: 'Who developed the theory of general relativity?', choices: ['Newton', 'Bohr', 'Einstein', 'Hawking'], correctIndex: 2, category: 'Science', baseXp: 100 },
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
 * Compute the multiplier for a given response time.
 * Degrades linearly from maxMultiplier → minMultiplier
 * over the question's time limit.
 */
export function computeMultiplier(
  elapsedMs: number,
  timeLimitSeconds: number,
  maxMultiplier: number,
  minMultiplier: number,
): number {
  const timeLimitMs = timeLimitSeconds * 1000;
  if (elapsedMs <= 0) return maxMultiplier;
  if (elapsedMs >= timeLimitMs) return minMultiplier;

  const fraction = elapsedMs / timeLimitMs;
  const multiplier = maxMultiplier - fraction * (maxMultiplier - minMultiplier);
  // Round to 2 decimal places
  return Math.round(multiplier * 100) / 100;
}

/**
 * Calculate XP earned for a single correct answer.
 */
export function calculateXp(
  baseXp: number,
  multiplier: number,
  streak: number,
): number {
  // Streak bonus: +5% per consecutive correct answer, capped at +50%
  const streakBonus = 1 + Math.min(streak * 0.05, 0.5);
  return Math.round(baseXp * multiplier * streakBonus);
}

/**
 * Create a new round from a difficulty preset.
 */
export function createInterrogationRound(
  difficulty: InterrogationDifficulty,
): InterrogationRoundState {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const questions = shuffle([...QUESTION_BANK]).slice(0, config.totalQuestions);

  return {
    config,
    questions,
    currentIndex: 0,
    timeRemaining: config.timePerQuestion,
    questionStartedAt: Date.now(),
    currentMultiplier: config.maxMultiplier,
    score: 0,
    streak: 0,
    answers: new Array(questions.length).fill(null),
    isComplete: false,
  };
}

/**
 * Tick the timer by `deltaMs` milliseconds.
 * Returns the updated state with degraded multiplier and decremented time.
 * Pure function.
 */
export function tickInterrogation(
  state: InterrogationRoundState,
  deltaMs: number,
): InterrogationRoundState {
  if (state.isComplete) return state;

  const elapsed = Date.now() - state.questionStartedAt;
  const newMultiplier = computeMultiplier(
    elapsed,
    state.config.timePerQuestion,
    state.config.maxMultiplier,
    state.config.minMultiplier,
  );

  const newTimeRemaining = Math.max(
    0,
    state.config.timePerQuestion - elapsed / 1000,
  );

  // Time expired — auto-skip with wrong answer
  if (newTimeRemaining <= 0) {
    return submitInterrogationAnswer(state, -1); // -1 = no selection (timeout)
  }

  return {
    ...state,
    currentMultiplier: newMultiplier,
    timeRemaining: Math.round(newTimeRemaining * 10) / 10,
  };
}

/**
 * Submit an answer for the current question.
 * `selectedIndex` -1 indicates a timeout (no answer).
 * Returns the next state. Pure function.
 */
export function submitInterrogationAnswer(
  state: InterrogationRoundState,
  selectedIndex: number,
): InterrogationRoundState {
  if (state.isComplete) return state;

  const { currentIndex, questions, config } = state;
  if (currentIndex >= questions.length) return state;

  const question = questions[currentIndex];
  const responseTimeMs = Date.now() - state.questionStartedAt;

  const correct = selectedIndex === question.correctIndex;

  const multiplierAtAnswer = correct
    ? computeMultiplier(
        responseTimeMs,
        config.timePerQuestion,
        config.maxMultiplier,
        config.minMultiplier,
      )
    : 0;

  const nextStreak = correct ? state.streak + 1 : 0;
  const xpEarned = correct
    ? calculateXp(question.baseXp, multiplierAtAnswer, state.streak)
    : 0;

  const answerResult: InterrogationAnswerResult = {
    questionId: question.id,
    selectedIndex,
    correct,
    responseTimeMs,
    multiplierAtAnswer,
    xpEarned,
  };

  const nextAnswers = [...state.answers];
  nextAnswers[currentIndex] = answerResult;

  const nextIndex = currentIndex + 1;
  const isComplete = nextIndex >= questions.length;

  return {
    ...state,
    answers: nextAnswers,
    score: state.score + xpEarned,
    streak: nextStreak,
    currentIndex: nextIndex,
    timeRemaining: isComplete ? 0 : config.timePerQuestion,
    questionStartedAt: isComplete ? state.questionStartedAt : Date.now(),
    currentMultiplier: isComplete ? 0 : config.maxMultiplier,
    isComplete,
  };
}

/**
 * Get the current question (or null if round is complete).
 */
export function getCurrentQuestion(
  state: InterrogationRoundState,
): InterrogationQuestion | null {
  if (state.isComplete || state.currentIndex >= state.questions.length) {
    return null;
  }
  return state.questions[state.currentIndex];
}

/**
 * Calculate final round statistics.
 */
export function getRoundStats(state: InterrogationRoundState): {
  totalScore: number;
  correctCount: number;
  accuracy: number;
  averageResponseMs: number;
  bestStreak: number;
} {
  let correctCount = 0;
  let totalResponseMs = 0;
  let answeredCount = 0;
  let bestStreak = 0;
  let currentStreak = 0;

  for (const answer of state.answers) {
    if (!answer) continue;
    answeredCount++;
    totalResponseMs += answer.responseTimeMs;
    if (answer.correct) {
      correctCount++;
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return {
    totalScore: state.score,
    correctCount,
    accuracy: answeredCount > 0 ? correctCount / answeredCount : 0,
    averageResponseMs: answeredCount > 0 ? totalResponseMs / answeredCount : 0,
    bestStreak,
  };
}
