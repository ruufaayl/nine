// ──────────────────────────────────────────────
// NINE — The Interrogation State Hook
// ──────────────────────────────────────────────

import { useCallback, useEffect, useReducer, useRef } from 'react';
import type {
  InterrogationAnswerResult,
  InterrogationDifficulty,
  InterrogationQuestion,
} from '../types/trivia_games';
import {
  computeMultiplier,
  calculateXp,
  createInterrogationRound,
  getCurrentQuestion,
  getRoundStats,
} from '../lib/games/interrogation';

// ─── Types ──────────────────────────────────

export type InterrogationGameState = 'ready' | 'playing' | 'answered' | 'finished';

export interface InterrogationResult {
  selectedIndex: number;
  correct: boolean;
  xpEarned: number;
  correctIndex: number;
}

interface HookState {
  questions: readonly InterrogationQuestion[];
  currentIndex: number;
  score: number;
  streak: number;
  /** Milliseconds remaining, updated at ~60fps for smooth bar. */
  timeRemainingMs: number;
  /** Total time per question in ms. */
  timeLimitMs: number;
  gameState: InterrogationGameState;
  /** Result of the most recent answer (for reveal animation). */
  lastResult: InterrogationResult | null;
  /** Timestamp (performance.now) when the current question started. */
  questionStartedAt: number;
  /** Difficulty setting. */
  difficulty: InterrogationDifficulty;
  /** Max/min multiplier from config. */
  maxMultiplier: number;
  minMultiplier: number;
  /** Current multiplier (displayed in UI). */
  currentMultiplier: number;
  /** Answers log for final stats. */
  answers: (InterrogationAnswerResult | null)[];
  /** Whether the score just increased (for pulse animation). */
  scorePulse: boolean;
}

type HookAction =
  | { type: 'START_GAME' }
  | { type: 'TICK'; now: number }
  | { type: 'SELECT_ANSWER'; index: number; now: number }
  | { type: 'ADVANCE' }
  | { type: 'TIMEOUT'; now: number }
  | { type: 'CLEAR_PULSE' };

// ─── Reducer ────────────────────────────────

function createInitialState(difficulty: InterrogationDifficulty): HookState {
  const round = createInterrogationRound(difficulty);

  return {
    questions: round.questions,
    currentIndex: 0,
    score: 0,
    streak: 0,
    timeRemainingMs: round.config.timePerQuestion * 1000,
    timeLimitMs: round.config.timePerQuestion * 1000,
    gameState: 'ready',
    lastResult: null,
    questionStartedAt: 0,
    difficulty,
    maxMultiplier: round.config.maxMultiplier,
    minMultiplier: round.config.minMultiplier,
    currentMultiplier: round.config.maxMultiplier,
    answers: new Array(round.questions.length).fill(null),
    scorePulse: false,
  };
}

function reducer(state: HookState, action: HookAction): HookState {
  switch (action.type) {
    case 'START_GAME': {
      if (state.gameState !== 'ready') return state;
      return {
        ...state,
        gameState: 'playing',
        questionStartedAt: performance.now(),
        currentMultiplier: state.maxMultiplier,
      };
    }

    case 'TICK': {
      if (state.gameState !== 'playing') return state;

      const elapsedMs = action.now - state.questionStartedAt;
      const remaining = Math.max(0, state.timeLimitMs - elapsedMs);

      const multiplier = computeMultiplier(
        elapsedMs,
        state.timeLimitMs / 1000,
        state.maxMultiplier,
        state.minMultiplier,
      );

      return {
        ...state,
        timeRemainingMs: remaining,
        currentMultiplier: multiplier,
      };
    }

    case 'TIMEOUT': {
      if (state.gameState !== 'playing') return state;

      const question = state.questions[state.currentIndex];
      if (!question) return state;

      const result: InterrogationResult = {
        selectedIndex: -1,
        correct: false,
        xpEarned: 0,
        correctIndex: question.correctIndex,
      };

      const answerLog: InterrogationAnswerResult = {
        questionId: question.id,
        selectedIndex: -1,
        correct: false,
        responseTimeMs: state.timeLimitMs,
        multiplierAtAnswer: 0,
        xpEarned: 0,
      };

      const nextAnswers = [...state.answers];
      nextAnswers[state.currentIndex] = answerLog;

      return {
        ...state,
        gameState: 'answered',
        lastResult: result,
        streak: 0,
        timeRemainingMs: 0,
        currentMultiplier: 0,
        answers: nextAnswers,
      };
    }

    case 'SELECT_ANSWER': {
      if (state.gameState !== 'playing') return state;

      const question = state.questions[state.currentIndex];
      if (!question) return state;

      const elapsedMs = action.now - state.questionStartedAt;
      const correct = action.index === question.correctIndex;

      const multiplier = correct
        ? computeMultiplier(
            elapsedMs,
            state.timeLimitMs / 1000,
            state.maxMultiplier,
            state.minMultiplier,
          )
        : 0;

      const xpEarned = correct
        ? calculateXp(question.baseXp, multiplier, state.streak)
        : 0;

      const result: InterrogationResult = {
        selectedIndex: action.index,
        correct,
        xpEarned,
        correctIndex: question.correctIndex,
      };

      const answerLog: InterrogationAnswerResult = {
        questionId: question.id,
        selectedIndex: action.index,
        correct,
        responseTimeMs: elapsedMs,
        multiplierAtAnswer: multiplier,
        xpEarned,
      };

      const nextAnswers = [...state.answers];
      nextAnswers[state.currentIndex] = answerLog;

      return {
        ...state,
        gameState: 'answered',
        lastResult: result,
        score: state.score + xpEarned,
        streak: correct ? state.streak + 1 : 0,
        answers: nextAnswers,
        scorePulse: correct,
      };
    }

    case 'ADVANCE': {
      if (state.gameState !== 'answered') return state;

      const nextIndex = state.currentIndex + 1;
      const isFinished = nextIndex >= state.questions.length;

      if (isFinished) {
        return {
          ...state,
          currentIndex: nextIndex,
          gameState: 'finished',
          lastResult: null,
          scorePulse: false,
        };
      }

      return {
        ...state,
        currentIndex: nextIndex,
        gameState: 'playing',
        lastResult: null,
        timeRemainingMs: state.timeLimitMs,
        questionStartedAt: performance.now(),
        currentMultiplier: state.maxMultiplier,
        scorePulse: false,
      };
    }

    case 'CLEAR_PULSE': {
      return { ...state, scorePulse: false };
    }

    default:
      return state;
  }
}

// ─── Hook ───────────────────────────────────

export function useInterrogation(difficulty: InterrogationDifficulty = 'agent') {
  const [state, dispatch] = useReducer(reducer, difficulty, createInitialState);
  const rafRef = useRef<number>(0);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── RAF-based timer ──
  useEffect(() => {
    if (state.gameState !== 'playing') {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    let running = true;

    function tick() {
      if (!running) return;

      const now = performance.now();
      const elapsed = now - state.questionStartedAt;

      if (elapsed >= state.timeLimitMs) {
        dispatch({ type: 'TIMEOUT', now });
        return;
      }

      dispatch({ type: 'TICK', now });
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [state.gameState, state.questionStartedAt, state.timeLimitMs]);

  // ── Auto-advance after answer reveal ──
  useEffect(() => {
    if (state.gameState !== 'answered') return;

    advanceTimerRef.current = setTimeout(() => {
      dispatch({ type: 'ADVANCE' });
    }, 1500);

    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [state.gameState, state.currentIndex]);

  // ── Actions ──
  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, []);

  const selectAnswer = useCallback((index: number) => {
    dispatch({ type: 'SELECT_ANSWER', index, now: performance.now() });
  }, []);

  const clearPulse = useCallback(() => {
    dispatch({ type: 'CLEAR_PULSE' });
  }, []);

  const resetGame = useCallback((diff?: InterrogationDifficulty) => {
    // Reset by re-creating the full component state
    // Since useReducer doesn't support re-init natively, we dispatch START after ADVANCE cycles
    // Instead, we use the parent to unmount/remount. For now, expose a reset flag.
  }, []);

  // ── Derived ──
  const currentQuestion = state.currentIndex < state.questions.length
    ? state.questions[state.currentIndex]
    : null;

  const timerFraction = state.timeLimitMs > 0
    ? state.timeRemainingMs / state.timeLimitMs
    : 0;

  const totalQuestions = state.questions.length;

  const stats = state.gameState === 'finished'
    ? (() => {
        let correctCount = 0;
        let totalMs = 0;
        let answered = 0;
        let bestStreak = 0;
        let streak = 0;

        for (const a of state.answers) {
          if (!a) continue;
          answered++;
          totalMs += a.responseTimeMs;
          if (a.correct) {
            correctCount++;
            streak++;
            bestStreak = Math.max(bestStreak, streak);
          } else {
            streak = 0;
          }
        }

        return {
          totalScore: state.score,
          correctCount,
          accuracy: answered > 0 ? correctCount / answered : 0,
          averageResponseMs: answered > 0 ? totalMs / answered : 0,
          bestStreak,
        };
      })()
    : null;

  return {
    // State
    questions: state.questions,
    currentQuestion,
    currentIndex: state.currentIndex,
    totalQuestions,
    score: state.score,
    streak: state.streak,
    timeRemainingMs: state.timeRemainingMs,
    timeLimitMs: state.timeLimitMs,
    timerFraction,
    gameState: state.gameState,
    lastResult: state.lastResult,
    currentMultiplier: state.currentMultiplier,
    scorePulse: state.scorePulse,
    stats,

    // Actions
    startGame,
    selectAnswer,
    clearPulse,
  };
}
