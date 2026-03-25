// ──────────────────────────────────────────────
// NINE — The Interrogation (Timed Quiz) UI
// ──────────────────────────────────────────────

import { useCallback } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import clsx from 'clsx';
import {
  useInterrogation,
  type InterrogationResult,
} from '../../hooks/useInterrogation';
import type { InterrogationDifficulty } from '../../types/trivia_games';

// ─── Types ──────────────────────────────────

interface TheInterrogationProps {
  difficulty?: InterrogationDifficulty;
  onExit: () => void;
}

// ─── Constants ──────────────────────────────

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

const ADVANCE_DELAY_MS = 1500;

// ─── Animation Variants ─────────────────────

const questionVariants: Variants = {
  enter: {
    x: 20,
    opacity: 0,
  },
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
  exit: {
    x: -20,
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  },
};

const shakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.2, ease: 'easeInOut' as const },
  },
};

const scorePulseVariants: Variants = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

// ─── Timer Bar ──────────────────────────────

interface TimerBarProps {
  fraction: number;
}

function TimerBar({ fraction }: TimerBarProps) {
  // Interpolate from accent (>50%) → warning yellow (25-50%) → error red (<25%)
  const barColor =
    fraction > 0.5
      ? 'var(--color-accent)'
      : fraction > 0.25
        ? '#d4a04a'
        : 'var(--color-error)';

  return (
    <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
      <motion.div
        className="h-full rounded-full origin-left"
        style={{ background: barColor }}
        animate={{ scaleX: fraction }}
        transition={{ duration: 0.05, ease: 'linear' as const }}
      />
    </div>
  );
}

// ─── Option Button ──────────────────────────

interface OptionButtonProps {
  label: string;
  text: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  isRevealed: boolean;
  isDimmed: boolean;
  onClick: () => void;
}

function OptionButton({
  label,
  text,
  index,
  isSelected,
  isCorrect,
  isRevealed,
  isDimmed,
  onClick,
}: OptionButtonProps) {
  // Determine background
  let bg = 'transparent';
  let borderColor = 'rgba(255,255,255,0.1)';
  let textColor = 'var(--color-primary-text)';
  let labelColor = 'var(--color-accent)';

  if (isRevealed) {
    if (isSelected && isCorrect) {
      bg = 'var(--color-accent)';
      borderColor = 'var(--color-accent)';
      textColor = 'var(--color-background)';
      labelColor = 'var(--color-background)';
    } else if (isSelected && !isCorrect) {
      bg = 'rgba(255,80,80,0.15)';
      borderColor = 'var(--color-error)';
      textColor = 'var(--color-error)';
      labelColor = 'var(--color-error)';
    } else if (isCorrect) {
      // Show the correct answer even if not selected
      bg = 'rgba(255,255,255,0.04)';
      borderColor = 'var(--color-accent)';
      textColor = 'var(--color-accent)';
      labelColor = 'var(--color-accent)';
    }
  }

  return (
    <motion.button
      className={clsx(
        'relative flex items-center gap-3',
        'rounded-xl px-5 py-4',
        'border-2 text-left w-full',
        'outline-none focus-visible:ring-1 focus-visible:ring-white/20',
        'select-none',
      )}
      style={{
        background: bg,
        borderColor,
        opacity: isDimmed ? 0.3 : 1,
      }}
      variants={isSelected && isRevealed && !isCorrect ? shakeVariants : undefined}
      animate={
        isSelected && isRevealed && !isCorrect ? 'shake' : 'idle'
      }
      whileHover={!isRevealed ? { borderColor: 'rgba(255,255,255,0.3)' } : undefined}
      whileTap={!isRevealed ? { scale: 0.98 } : undefined}
      onClick={onClick}
      disabled={isRevealed}
      aria-label={`Option ${label}: ${text}`}
    >
      <span
        className="text-xs font-black tracking-wider shrink-0 w-6 text-center"
        style={{ color: labelColor }}
      >
        {label}
      </span>
      <span
        className="text-sm sm:text-base font-semibold leading-snug"
        style={{ color: textColor }}
      >
        {text}
      </span>
    </motion.button>
  );
}

// ─── Multiplier Badge ───────────────────────

function MultiplierBadge({ multiplier }: { multiplier: number }) {
  const intensity = Math.min(1, multiplier / 3);
  return (
    <span
      className="text-[0.65rem] font-bold tracking-wider uppercase tabular-nums"
      style={{
        color: intensity > 0.5
          ? 'var(--color-accent)'
          : intensity > 0.25
            ? '#d4a04a'
            : 'var(--color-error)',
        opacity: 0.8,
      }}
    >
      {multiplier.toFixed(1)}x
    </span>
  );
}

// ─── Ready Screen ───────────────────────────

interface ReadyScreenProps {
  totalQuestions: number;
  difficulty: InterrogationDifficulty;
  onStart: () => void;
  onExit: () => void;
}

function ReadyScreen({ totalQuestions, difficulty, onStart, onExit }: ReadyScreenProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen gap-8 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          className="text-[0.6rem] uppercase tracking-[0.3em] font-semibold"
          style={{ color: 'var(--color-accent)', opacity: 0.6 }}
        >
          The Interrogation
        </span>
        <h1
          className="text-3xl sm:text-4xl font-black tracking-tight"
          style={{ color: 'var(--color-primary-text)' }}
        >
          {totalQuestions} Questions
        </h1>
        <p className="text-sm text-white/40 max-w-xs">
          Answer fast. Multiplier decays every millisecond.
          Streak bonuses reward consistency.
        </p>
        <span
          className="text-[0.55rem] uppercase tracking-[0.2em] mt-1"
          style={{ color: 'var(--color-accent)', opacity: 0.5 }}
        >
          Difficulty: {difficulty}
        </span>
      </div>

      <div className="flex gap-3">
        <motion.button
          className="px-6 py-3 rounded-lg border border-white/10 text-sm font-semibold text-white/50"
          whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.3)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onExit}
        >
          Lobby
        </motion.button>
        <motion.button
          className="px-8 py-3 rounded-lg text-sm font-black uppercase tracking-widest"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
          whileHover={{ scale: 1.03, opacity: 0.9 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
        >
          Begin
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Finished Screen ────────────────────────

interface FinishedScreenProps {
  stats: {
    totalScore: number;
    correctCount: number;
    accuracy: number;
    averageResponseMs: number;
    bestStreak: number;
  };
  totalQuestions: number;
  onExit: () => void;
}

function FinishedScreen({ stats, totalQuestions, onExit }: FinishedScreenProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen gap-8 px-6"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col items-center gap-2">
        <span
          className="text-[0.6rem] uppercase tracking-[0.3em]"
          style={{ color: 'var(--color-accent)', opacity: 0.5 }}
        >
          Interrogation Complete
        </span>
        <motion.span
          className="text-5xl sm:text-6xl font-black tabular-nums"
          style={{ color: 'var(--color-accent)' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' as const, stiffness: 300, damping: 20 }}
        >
          {stats.totalScore.toLocaleString()}
        </motion.span>
        <span className="text-xs text-white/30 uppercase tracking-widest">
          Total XP
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        <StatCard label="Accuracy" value={`${Math.round(stats.accuracy * 100)}%`} />
        <StatCard label="Correct" value={`${stats.correctCount}/${totalQuestions}`} />
        <StatCard label="Best Streak" value={`${stats.bestStreak}`} />
        <StatCard
          label="Avg Speed"
          value={`${(stats.averageResponseMs / 1000).toFixed(1)}s`}
        />
      </div>

      <motion.button
        className="px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest border border-white/10 text-white/60"
        whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
        whileTap={{ scale: 0.97 }}
        onClick={onExit}
      >
        Back to Lobby
      </motion.button>
    </motion.div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-3 px-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      <span
        className="text-lg font-black tabular-nums"
        style={{ color: 'var(--color-primary-text)' }}
      >
        {value}
      </span>
      <span className="text-[0.55rem] uppercase tracking-widest text-white/30">
        {label}
      </span>
    </div>
  );
}

// ─── XP Earned Popup ────────────────────────

function XpPopup({ xp }: { xp: number }) {
  if (xp <= 0) return null;

  return (
    <motion.span
      className="absolute -top-6 left-1/2 text-xs font-black tracking-wider pointer-events-none"
      style={{ color: 'var(--color-accent)' }}
      initial={{ opacity: 1, y: 0, x: '-50%' }}
      animate={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8, ease: 'easeOut' as const }}
    >
      +{xp}
    </motion.span>
  );
}

// ─── Main Component ─────────────────────────

export function TheInterrogation({
  difficulty = 'agent',
  onExit,
}: TheInterrogationProps) {
  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    score,
    streak,
    timerFraction,
    gameState,
    lastResult,
    currentMultiplier,
    scorePulse,
    stats,
    startGame,
    selectAnswer,
    clearPulse,
  } = useInterrogation(difficulty);

  const handleOptionClick = useCallback(
    (index: number) => {
      if (gameState !== 'playing') return;
      selectAnswer(index);
    },
    [gameState, selectAnswer],
  );

  // ── Ready state ──
  if (gameState === 'ready') {
    return (
      <div style={{ background: 'var(--color-background)' }}>
        <ReadyScreen
          totalQuestions={totalQuestions}
          difficulty={difficulty}
          onStart={startGame}
          onExit={onExit}
        />
      </div>
    );
  }

  // ── Finished state ──
  if (gameState === 'finished' && stats) {
    return (
      <div style={{ background: 'var(--color-background)' }}>
        <FinishedScreen
          stats={stats}
          totalQuestions={totalQuestions}
          onExit={onExit}
        />
      </div>
    );
  }

  // ── Playing / Answered state ──
  const isRevealed = gameState === 'answered' && lastResult !== null;

  return (
    <div
      className="relative flex flex-col min-h-screen overflow-hidden"
      style={{ background: 'var(--color-background)' }}
    >
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        {/* Score */}
        <div className="relative flex flex-col items-start gap-0.5">
          <span className="text-[0.55rem] uppercase tracking-widest text-white/25">
            Score
          </span>
          <motion.span
            className="text-2xl font-black tabular-nums leading-none"
            style={{ color: 'var(--color-accent)' }}
            variants={scorePulseVariants}
            animate={scorePulse ? 'pulse' : 'idle'}
            onAnimationComplete={() => {
              if (scorePulse) clearPulse();
            }}
          >
            {score.toLocaleString()}
          </motion.span>
          <AnimatePresence>
            {isRevealed && lastResult && lastResult.xpEarned > 0 && (
              <XpPopup key={`xp-${currentIndex}`} xp={lastResult.xpEarned} />
            )}
          </AnimatePresence>
        </div>

        {/* Center: Multiplier + Streak */}
        <div className="flex flex-col items-center gap-0.5">
          <MultiplierBadge multiplier={currentMultiplier} />
          {streak > 0 && (
            <motion.span
              className="text-[0.5rem] uppercase tracking-widest text-white/30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {streak} streak
            </motion.span>
          )}
        </div>

        {/* Question counter */}
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[0.55rem] uppercase tracking-widest text-white/25">
            Question
          </span>
          <span
            className="text-2xl font-black tabular-nums leading-none"
            style={{ color: 'var(--color-primary-text)', opacity: 0.6 }}
          >
            {String(currentIndex + 1).padStart(2, '0')}
            <span className="text-sm font-semibold text-white/20">
              {' '}/ {String(totalQuestions).padStart(2, '0')}
            </span>
          </span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6 pb-8">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={`q-${currentIndex}`}
              className="flex flex-col items-center gap-5 w-full max-w-lg"
              variants={questionVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* Category badge */}
              <span
                className="text-[0.55rem] uppercase tracking-[0.25em] font-semibold"
                style={{ color: 'var(--color-accent)', opacity: 0.4 }}
              >
                {currentQuestion.category}
              </span>

              {/* Question text */}
              <h2
                className="text-xl sm:text-2xl font-bold text-center leading-snug tracking-tight"
                style={{ color: 'var(--color-primary-text)' }}
              >
                {currentQuestion.prompt}
              </h2>

              {/* Timer bar */}
              <div className="w-full max-w-sm">
                <TimerBar fraction={gameState === 'answered' ? 0 : timerFraction} />
              </div>

              {/* Options 2×2 grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-2">
                {currentQuestion.choices.map((choice, i) => {
                  const isSelected = isRevealed && lastResult !== null && lastResult.selectedIndex === i;
                  const isCorrect = i === currentQuestion.correctIndex;
                  const isDimmed = isRevealed && !isSelected && !isCorrect;

                  return (
                    <OptionButton
                      key={i}
                      label={OPTION_LABELS[i]}
                      text={choice}
                      index={i}
                      isSelected={isSelected}
                      isCorrect={isCorrect}
                      isRevealed={isRevealed}
                      isDimmed={isDimmed}
                      onClick={() => handleOptionClick(i)}
                    />
                  );
                })}
              </div>

              {/* Timeout indicator */}
              <AnimatePresence>
                {isRevealed && lastResult && lastResult.selectedIndex === -1 && (
                  <motion.span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--color-error)' }}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    Time expired
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Exit button (subtle, top-left) ── */}
      <motion.button
        className="absolute top-5 left-5 text-[0.6rem] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors z-20"
        whileTap={{ scale: 0.95 }}
        onClick={onExit}
        aria-label="Back to lobby"
      >
        ← Lobby
      </motion.button>
    </div>
  );
}
