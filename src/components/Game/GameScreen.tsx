// ──────────────────────────────────────────────
// NINE — GameScreen Component
// ──────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { SudokuGrid } from '../Board/SudokuGrid';
import { NumberPad } from '../Board/NumberPad';
import { useGameState } from '../../hooks/useGameState';
import type { Difficulty, GameMode } from '../../types/game';

// ─── Types ───────────────────────────────────

interface GameScreenProps {
  difficulty: Difficulty;
  characterId: string;
  mode: GameMode;
  onExit: () => void;
}

// ─── Constants ───────────────────────────────

/** Time limit per difficulty in seconds (classic / fog modes). */
const TIME_LIMITS: Record<Difficulty, number> = {
  easy: 600,
  medium: 900,
  hard: 1200,
  expert: 1800,
};

// ─── Timer Ring ──────────────────────────────

interface TimerRingProps {
  elapsed: number;
  limit: number;
}

function TimerRing({ elapsed, limit }: TimerRingProps) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const remaining = Math.max(0, limit - elapsed);
  const fraction = remaining / limit;
  const offset = circumference * (1 - fraction);

  const isWarning = fraction < 0.25;
  const isCritical = fraction < 0.1;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const label = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="var(--color-grid-lines)"
          strokeWidth="3"
        />
        <motion.circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={
            isCritical
              ? 'var(--color-error)'
              : isWarning
                ? '#f59e0b'
                : 'var(--color-accent)'
          }
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>
      <motion.span
        className="relative z-10 text-xs font-mono font-bold tabular-nums"
        style={{
          color: isCritical
            ? 'var(--color-error)'
            : 'var(--color-primary-text)',
          fontSize: '0.6rem',
        }}
        animate={isCritical ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
        transition={
          isCritical ? { repeat: Infinity, duration: 0.8 } : undefined
        }
      >
        {label}
      </motion.span>
    </div>
  );
}

// ─── Sprint Countdown Ring ────────────────────

interface SprintCountdownProps {
  remaining: number;
  total: number;
}

function SprintCountdown({ remaining, total }: SprintCountdownProps) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const fraction = remaining / total;
  const offset = circumference * (1 - fraction);

  const isCritical = remaining <= 30;
  const isWarning = remaining <= 60;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const label = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="var(--color-grid-lines)"
          strokeWidth="3"
        />
        <motion.circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={
            isCritical
              ? 'var(--color-error)'
              : isWarning
                ? '#f59e0b'
                : 'var(--color-accent)'
          }
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>
      <motion.span
        className="relative z-10 font-mono font-bold tabular-nums"
        style={{
          color: isCritical
            ? 'var(--color-error)'
            : 'var(--color-primary-text)',
          fontSize: '0.6rem',
        }}
        animate={isCritical ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
        transition={
          isCritical ? { repeat: Infinity, duration: 0.6 } : undefined
        }
      >
        {label}
      </motion.span>
    </div>
  );
}

// ─── XP Counter ───────────────────────────────

interface XpCounterProps {
  xp: number;
}

function XpCounter({ xp }: XpCounterProps) {
  return (
    <motion.div
      className="flex items-center gap-1"
      key={xp}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 0.2 }}
    >
      <span
        className="text-xs font-black tabular-nums"
        style={{ color: 'var(--color-accent)' }}
      >
        {xp}
      </span>
      <span
        className="text-[0.55rem] uppercase tracking-widest font-bold"
        style={{ color: 'var(--color-accent)', opacity: 0.6 }}
      >
        XP
      </span>
    </motion.div>
  );
}

// ─── Error Counter ────────────────────────────

interface ErrorCounterProps {
  count: number;
  max?: number;
}

function ErrorCounter({ count, max = 3 }: ErrorCounterProps) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${count} errors`}>
      {Array.from({ length: max }, (_, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            background:
              i < count ? 'var(--color-error)' : 'var(--color-grid-lines)',
          }}
          animate={
            i < count
              ? { scale: [1, 1.4, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 0.3 }}
        />
      ))}
      {count > max && (
        <span
          className="text-xs font-mono"
          style={{ color: 'var(--color-error)' }}
        >
          +{count - max}
        </span>
      )}
    </div>
  );
}

// ─── Mode Badge ───────────────────────────────

function ModeBadge({ mode }: { mode: GameMode }) {
  const labels: Record<GameMode, string> = {
    classic: 'Classic',
    sprint: 'Sprint',
    fogOfWar: 'Fog of War',
  };
  return (
    <span
      className="text-[0.5rem] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-full"
      style={{
        background: 'var(--color-grid-lines)',
        color: 'var(--color-accent)',
      }}
    >
      {labels[mode]}
    </span>
  );
}

// ─── Completion Overlay ───────────────────────

interface CompletionOverlayProps {
  elapsed: number;
  difficulty: Difficulty;
  mode: GameMode;
  xp: number;
  onExit: () => void;
  onPlayAgain: () => void;
}

function CompletionOverlay({
  elapsed,
  difficulty,
  mode,
  xp,
  onExit,
  onPlayAgain,
}: CompletionOverlayProps) {
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex flex-col items-center gap-4 text-center px-8"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
      >
        <motion.span
          className="text-6xl"
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          ◈
        </motion.span>
        <h2
          className="text-3xl font-black tracking-widest uppercase"
          style={{ color: 'var(--color-accent)' }}
        >
          Solved
        </h2>
        <p
          className="text-sm uppercase tracking-widest opacity-60"
          style={{ color: 'var(--color-primary-text)' }}
        >
          {difficulty} · {timeStr}
        </p>
        {mode === 'sprint' && (
          <motion.p
            className="text-lg font-black tabular-nums"
            style={{ color: 'var(--color-accent)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 18 }}
          >
            {xp} XP
          </motion.p>
        )}
      </motion.div>

      <div className="flex gap-3">
        <motion.button
          className="px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-widest"
          style={{
            background: 'var(--color-grid-lines)',
            color: 'var(--color-primary-text)',
          }}
          whileHover={{ opacity: 0.8 }}
          whileTap={{ scale: 0.96 }}
          onClick={onExit}
        >
          Exit
        </motion.button>
        <motion.button
          className="px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-widest"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
          whileHover={{ opacity: 0.85 }}
          whileTap={{ scale: 0.96 }}
          onClick={onPlayAgain}
        >
          Play Again
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Time Up Overlay (Sprint) ─────────────────

interface TimeUpOverlayProps {
  xp: number;
  onExit: () => void;
  onPlayAgain: () => void;
}

function TimeUpOverlay({ xp, onExit, onPlayAgain }: TimeUpOverlayProps) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex flex-col items-center gap-4 text-center px-8"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
      >
        <motion.span
          className="text-5xl"
          style={{ color: 'var(--color-error)' }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: 2, duration: 0.5 }}
        >
          ⏱
        </motion.span>
        <h2
          className="text-2xl font-black tracking-widest uppercase"
          style={{ color: 'var(--color-error)' }}
        >
          Time's Up
        </h2>
        <motion.p
          className="text-lg font-black tabular-nums"
          style={{ color: 'var(--color-accent)' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 18 }}
        >
          {xp} XP
        </motion.p>
      </motion.div>

      <div className="flex gap-3">
        <motion.button
          className="px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-widest"
          style={{
            background: 'var(--color-grid-lines)',
            color: 'var(--color-primary-text)',
          }}
          whileHover={{ opacity: 0.8 }}
          whileTap={{ scale: 0.96 }}
          onClick={onExit}
        >
          Exit
        </motion.button>
        <motion.button
          className="px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-widest"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-background)',
          }}
          whileHover={{ opacity: 0.85 }}
          whileTap={{ scale: 0.96 }}
          onClick={onPlayAgain}
        >
          Retry
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────

export function GameScreen({
  difficulty,
  characterId,
  mode,
  onExit,
}: GameScreenProps) {
  const {
    currentGrid,
    selectedCell,
    isPencilMode,
    errors,
    isComplete,
    activeTheme,
    xp,
    sprintTimeRemaining,
    foggedCells,
    initGame,
    selectCell,
    fillCell,
    togglePencil,
    resetGame,
    sprintTick,
  } = useGameState();

  const [elapsed, setElapsed] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [sprintTimeUp, setSprintTimeUp] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sprintRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const limit = TIME_LIMITS[difficulty];

  // Initialise on mount / when props change
  useEffect(() => {
    initGame(difficulty, characterId, mode);
    setElapsed(0);
    setShowCompletion(false);
    setSprintTimeUp(false);
  }, [difficulty, characterId, mode, initGame]);

  // Classic/FogOfWar elapsed timer
  useEffect(() => {
    if (mode === 'sprint') return;
    if (isComplete || showCompletion) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (!currentGrid) return;

    intervalRef.current = setInterval(() => {
      setElapsed((s) => {
        if (s + 1 >= limit) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return limit;
        }
        return s + 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode, currentGrid, isComplete, showCompletion, limit]);

  // Sprint countdown timer
  useEffect(() => {
    if (mode !== 'sprint') return;
    if (isComplete || showCompletion || sprintTimeUp) {
      if (sprintRef.current) clearInterval(sprintRef.current);
      return;
    }
    if (!currentGrid) return;

    sprintRef.current = setInterval(() => {
      sprintTick();
      setElapsed((s) => s + 1);
    }, 1000);

    return () => {
      if (sprintRef.current) clearInterval(sprintRef.current);
    };
  }, [mode, currentGrid, isComplete, showCompletion, sprintTimeUp, sprintTick]);

  // Sprint time up detection
  useEffect(() => {
    if (mode === 'sprint' && sprintTimeRemaining <= 0 && currentGrid && !isComplete) {
      setSprintTimeUp(true);
    }
  }, [mode, sprintTimeRemaining, currentGrid, isComplete]);

  // Show completion overlay after a brief pause
  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => setShowCompletion(true), 600);
      return () => clearTimeout(t);
    }
  }, [isComplete]);

  // Apply CSS variables for theme
  const themeVars = activeTheme
    ? ({
        '--color-background': activeTheme.colors.background,
        '--color-grid-lines': activeTheme.colors.gridLines,
        '--color-primary-text': activeTheme.colors.primaryText,
        '--color-accent': activeTheme.colors.accent,
        '--color-error': activeTheme.colors.error,
      } as React.CSSProperties)
    : {};

  const handleErase = useCallback(() => {
    if (!currentGrid || !selectedCell) return;
    const cell = currentGrid[selectedCell.row][selectedCell.col];
    if (!cell.isGiven && cell.value !== null) {
      fillCell(cell.value);
    }
  }, [currentGrid, selectedCell, fillCell]);

  const handlePlayAgain = useCallback(() => {
    initGame(difficulty, characterId, mode);
    setElapsed(0);
    setShowCompletion(false);
    setSprintTimeUp(false);
  }, [difficulty, characterId, mode, initGame]);

  if (!currentGrid) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: '#0a0e27', color: '#f0f4ff' }}
      >
        <motion.div
          className="text-sm uppercase tracking-widest opacity-50"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Generating puzzle…
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col items-center min-h-screen overflow-hidden"
      style={{ background: 'var(--color-background)', ...themeVars }}
    >
      {/* ── Top bar ── */}
      <motion.header
        className={clsx(
          'w-full flex items-center justify-between',
          'px-5 py-4',
          'border-b',
        )}
        style={{ borderColor: 'var(--color-grid-lines)' }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Exit */}
        <motion.button
          className="text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-primary-text)' }}
          whileTap={{ scale: 0.94 }}
          onClick={onExit}
          aria-label="Exit game"
        >
          ← Exit
        </motion.button>

        {/* Character name + mode + difficulty */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--color-accent)' }}
          >
            {activeTheme?.name ?? '—'}
          </span>
          <div className="flex items-center gap-2">
            <ModeBadge mode={mode} />
            <span
              className="text-[0.6rem] uppercase tracking-widest opacity-40"
              style={{ color: 'var(--color-primary-text)' }}
            >
              {difficulty}
            </span>
          </div>
        </div>

        {/* Right: mode-specific HUD */}
        <div className="flex items-center gap-3">
          {mode === 'sprint' && <XpCounter xp={xp} />}
          <ErrorCounter count={errors.size} />
          {mode === 'sprint' ? (
            <SprintCountdown remaining={sprintTimeRemaining} total={180} />
          ) : (
            <TimerRing elapsed={elapsed} limit={limit} />
          )}
        </div>
      </motion.header>

      {/* ── Board ── */}
      <motion.main
        className="flex flex-col items-center justify-center flex-1 gap-5 px-4 py-6 w-full"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <SudokuGrid
          grid={currentGrid}
          selectedCell={selectedCell}
          errors={errors}
          isPencilMode={isPencilMode}
          foggedCells={foggedCells}
          onSelectCell={selectCell}
          onFillCell={fillCell}
          onTogglePencil={togglePencil}
        />

        <NumberPad
          grid={currentGrid}
          isPencilMode={isPencilMode}
          onFillCell={fillCell}
          onErase={handleErase}
          onTogglePencil={togglePencil}
        />

        {/* Reset button */}
        <motion.button
          className="text-xs uppercase tracking-widest opacity-30 hover:opacity-70 transition-opacity mt-1"
          style={{ color: 'var(--color-primary-text)' }}
          whileTap={{ scale: 0.94 }}
          onClick={resetGame}
        >
          Reset puzzle
        </motion.button>
      </motion.main>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {showCompletion && (
          <CompletionOverlay
            elapsed={elapsed}
            difficulty={difficulty}
            mode={mode}
            xp={xp}
            onExit={onExit}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sprintTimeUp && !isComplete && (
          <TimeUpOverlay
            xp={xp}
            onExit={onExit}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
