// ──────────────────────────────────────────────
// NINE — Global Override (Geo Flash) Engine
// ──────────────────────────────────────────────

import type {
  GeoAnswerResult,
  GeoEntry,
  GeoPrompt,
  GeoPromptType,
  GlobalOverrideConfig,
  GlobalOverrideState,
} from '../../types/trivia_games';

// ─── Geo Database ────────────────────────────

const GEO_DB: readonly GeoEntry[] = [
  { country: 'Japan', capital: 'Tokyo', continent: 'Asia', isoCode: 'JP' },
  { country: 'France', capital: 'Paris', continent: 'Europe', isoCode: 'FR' },
  { country: 'Brazil', capital: 'Brasilia', continent: 'South America', isoCode: 'BR' },
  { country: 'Egypt', capital: 'Cairo', continent: 'Africa', isoCode: 'EG' },
  { country: 'Australia', capital: 'Canberra', continent: 'Oceania', isoCode: 'AU' },
  { country: 'Canada', capital: 'Ottawa', continent: 'North America', isoCode: 'CA' },
  { country: 'Germany', capital: 'Berlin', continent: 'Europe', isoCode: 'DE' },
  { country: 'India', capital: 'New Delhi', continent: 'Asia', isoCode: 'IN' },
  { country: 'South Korea', capital: 'Seoul', continent: 'Asia', isoCode: 'KR' },
  { country: 'Mexico', capital: 'Mexico City', continent: 'North America', isoCode: 'MX' },
  { country: 'Nigeria', capital: 'Abuja', continent: 'Africa', isoCode: 'NG' },
  { country: 'Turkey', capital: 'Ankara', continent: 'Asia', isoCode: 'TR' },
  { country: 'Italy', capital: 'Rome', continent: 'Europe', isoCode: 'IT' },
  { country: 'Argentina', capital: 'Buenos Aires', continent: 'South America', isoCode: 'AR' },
  { country: 'Thailand', capital: 'Bangkok', continent: 'Asia', isoCode: 'TH' },
  { country: 'Kenya', capital: 'Nairobi', continent: 'Africa', isoCode: 'KE' },
  { country: 'Poland', capital: 'Warsaw', continent: 'Europe', isoCode: 'PL' },
  { country: 'Colombia', capital: 'Bogota', continent: 'South America', isoCode: 'CO' },
  { country: 'Sweden', capital: 'Stockholm', continent: 'Europe', isoCode: 'SE' },
  { country: 'Indonesia', capital: 'Jakarta', continent: 'Asia', isoCode: 'ID' },
  { country: 'South Africa', capital: 'Pretoria', continent: 'Africa', isoCode: 'ZA' },
  { country: 'Spain', capital: 'Madrid', continent: 'Europe', isoCode: 'ES' },
  { country: 'Vietnam', capital: 'Hanoi', continent: 'Asia', isoCode: 'VN' },
  { country: 'Peru', capital: 'Lima', continent: 'South America', isoCode: 'PE' },
  { country: 'Norway', capital: 'Oslo', continent: 'Europe', isoCode: 'NO' },
  { country: 'New Zealand', capital: 'Wellington', continent: 'Oceania', isoCode: 'NZ' },
  { country: 'Morocco', capital: 'Rabat', continent: 'Africa', isoCode: 'MA' },
  { country: 'Philippines', capital: 'Manila', continent: 'Asia', isoCode: 'PH' },
  { country: 'Chile', capital: 'Santiago', continent: 'South America', isoCode: 'CL' },
  { country: 'Greece', capital: 'Athens', continent: 'Europe', isoCode: 'GR' },
  { country: 'Switzerland', capital: 'Bern', continent: 'Europe', isoCode: 'CH' },
  { country: 'Portugal', capital: 'Lisbon', continent: 'Europe', isoCode: 'PT' },
  { country: 'Ukraine', capital: 'Kyiv', continent: 'Europe', isoCode: 'UA' },
  { country: 'Pakistan', capital: 'Islamabad', continent: 'Asia', isoCode: 'PK' },
  { country: 'Cuba', capital: 'Havana', continent: 'North America', isoCode: 'CU' },
  { country: 'Mongolia', capital: 'Ulaanbaatar', continent: 'Asia', isoCode: 'MN' },
  { country: 'Iceland', capital: 'Reykjavik', continent: 'Europe', isoCode: 'IS' },
  { country: 'Finland', capital: 'Helsinki', continent: 'Europe', isoCode: 'FI' },
  { country: 'Nepal', capital: 'Kathmandu', continent: 'Asia', isoCode: 'NP' },
  { country: 'Ethiopia', capital: 'Addis Ababa', continent: 'Africa', isoCode: 'ET' },
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
  return answer.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
}

/** Generate a single prompt from a geo entry. */
function createPrompt(
  entry: GeoEntry,
  type: GeoPromptType,
  timeLimit: number,
): GeoPrompt {
  switch (type) {
    case 'capital_of':
      return {
        type,
        displayText: `Capital of ${entry.country}?`,
        correctAnswer: entry.capital,
        acceptedAnswers: [entry.capital],
        timeLimit,
      };
    case 'country_of_capital':
      return {
        type,
        displayText: `${entry.capital} is the capital of?`,
        correctAnswer: entry.country,
        acceptedAnswers: [entry.country],
        timeLimit,
      };
    case 'continent_of':
      return {
        type,
        displayText: `What continent is ${entry.country} in?`,
        correctAnswer: entry.continent,
        acceptedAnswers: [entry.continent],
        timeLimit,
      };
    case 'flag_of':
      return {
        type,
        displayText: `Which country has the flag code ${entry.isoCode}?`,
        correctAnswer: entry.country,
        acceptedAnswers: [entry.country],
        timeLimit,
      };
  }
}

// ─── Public API ──────────────────────────────

/**
 * Create a default config.
 */
export function createGlobalOverrideConfig(
  totalRounds: number = 20,
  timePerPrompt: number = 5,
  promptTypes: readonly GeoPromptType[] = ['capital_of', 'country_of_capital', 'continent_of'],
): GlobalOverrideConfig {
  return { totalRounds, timePerPrompt, promptTypes };
}

/**
 * Generate a full round of prompts.
 */
export function generateGlobalOverride(
  config: GlobalOverrideConfig,
): GlobalOverrideState {
  const entries = shuffle([...GEO_DB]);
  const types = config.promptTypes;

  const prompts: GeoPrompt[] = [];
  for (let i = 0; i < config.totalRounds; i++) {
    const entry = entries[i % entries.length];
    const type = types[i % types.length];
    prompts.push(createPrompt(entry, type, config.timePerPrompt));
  }

  return {
    config,
    prompts,
    currentIndex: 0,
    timeRemaining: config.timePerPrompt,
    score: 0,
    streak: 0,
    maxStreak: 0,
    answers: new Array(prompts.length).fill(null),
    isComplete: false,
  };
}

/**
 * Get the current prompt (or null if complete).
 */
export function getCurrentPrompt(
  state: GlobalOverrideState,
): GeoPrompt | null {
  if (state.isComplete || state.currentIndex >= state.prompts.length) {
    return null;
  }
  return state.prompts[state.currentIndex];
}

/**
 * Validate an answer against a prompt.
 * Uses normalized fuzzy matching.
 */
export function validateGeoAnswer(
  prompt: GeoPrompt,
  answer: string,
): boolean {
  const normalized = normalizeAnswer(answer);
  return prompt.acceptedAnswers.some(
    (accepted) => normalizeAnswer(accepted) === normalized,
  );
}

/**
 * Submit an answer for the current prompt.
 * Pure function.
 */
export function submitGeoAnswer(
  state: GlobalOverrideState,
  answer: string,
  responseTimeMs: number,
): GlobalOverrideState {
  if (state.isComplete) return state;

  const prompt = state.prompts[state.currentIndex];
  if (!prompt) return state;

  const correct = validateGeoAnswer(prompt, answer);

  // XP: base 100, +20 per streak, bonus for fast answers
  const speedBonus = Math.max(0, Math.round((1 - responseTimeMs / (prompt.timeLimit * 1000)) * 50));
  const streakBonus = correct ? state.streak * 20 : 0;
  const xpEarned = correct ? 100 + speedBonus + streakBonus : 0;

  const result: GeoAnswerResult = {
    promptIndex: state.currentIndex,
    playerAnswer: answer,
    correct,
    responseTimeMs,
    xpEarned,
  };

  const nextAnswers = [...state.answers];
  nextAnswers[state.currentIndex] = result;

  const nextStreak = correct ? state.streak + 1 : 0;
  const nextMaxStreak = Math.max(state.maxStreak, nextStreak);
  const nextIndex = state.currentIndex + 1;
  const isComplete = nextIndex >= state.prompts.length;

  return {
    ...state,
    answers: nextAnswers,
    score: state.score + xpEarned,
    streak: nextStreak,
    maxStreak: nextMaxStreak,
    currentIndex: nextIndex,
    timeRemaining: isComplete ? 0 : state.config.timePerPrompt,
    isComplete,
  };
}

/**
 * Handle a timeout (no answer given).
 * Pure function.
 */
export function timeoutGeoPrompt(
  state: GlobalOverrideState,
): GlobalOverrideState {
  return submitGeoAnswer(state, '', state.config.timePerPrompt * 1000);
}

/**
 * Get final round statistics.
 */
export function getGlobalOverrideStats(state: GlobalOverrideState): {
  totalScore: number;
  correctCount: number;
  accuracy: number;
  maxStreak: number;
  averageResponseMs: number;
} {
  let correctCount = 0;
  let totalMs = 0;
  let answered = 0;

  for (const a of state.answers) {
    if (!a) continue;
    answered++;
    totalMs += a.responseTimeMs;
    if (a.correct) correctCount++;
  }

  return {
    totalScore: state.score,
    correctCount,
    accuracy: answered > 0 ? correctCount / answered : 0,
    maxStreak: state.maxStreak,
    averageResponseMs: answered > 0 ? totalMs / answered : 0,
  };
}
