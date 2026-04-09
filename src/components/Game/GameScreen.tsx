// ──────────────────────────────────────────────
// NINE — GameScreen (Offline Solo — Liquid UI)
// 3-mistake game over, XP on completion
// ──────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SudokuGrid } from '../Board/SudokuGrid';
import { NumberPad } from '../Board/NumberPad';
import { useGameState } from '../../hooks/useGameState';
import { MAX_MISTAKES, TIME_LIMITS } from '../../lib/economy';
import type { Difficulty } from '../../types/game';

// ─── Types ───────────────────────────────────

interface GameScreenProps {
  difficulty: Difficulty;
  onExit: () => void;
  onComplete?: (result: {
    difficulty: Difficulty;
    timeMs: number;
    mistakes: number;
    xp: number;
    won: boolean;
  }) => void;
}

// ─── Mistake Hearts ──────────────────────────

function MistakeHearts({ mistakes, max }: { mistakes: number; max: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${mistakes} of ${max} mistakes used`}>
      {Array.from({ length: max }, (_, i) => (
        <motion.div
          key={i}
          className="w-5 h-5 flex items-center justify-center text-sm"
          animate={
            i < mistakes
              ? { scale: [1, 1.3, 1], opacity: 0.3 }
              : { scale: 1, opacity: 1 }
          }
          transition={{ duration: 0.3 }}
        >
          {i < mistakes ? '💔' : '❤️'}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Timer Display ───────────────────────────

function TimerDisplay({ elapsed, limit }: { elapsed: number; limit: number }) {
  const remaining = Math.max(0, limit - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isWarning = remaining < 120;
  const isCritical = remaining < 30;

  return (
    <motion.div
      className="pill"
      style={{
        background: isCritical
          ? 'rgba(255, 107, 107, 0.12)'
          : 'var(--bg-card)',
        border: isCritical
          ? '1px solid rgba(255, 107, 107, 0.2)'
          : '1px solid var(--border-subtle)',
        color: isCritical
          ? 'var(--accent-error)'
          : isWarning
            ? 'var(--accent-warning)'
            : 'var(--text-secondary)',
        fontFamily: 'var(--font-primary)',
        fontSize: '0.8rem',
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
      }}
      animate={isCritical ? { opacity: [1, 0.5, 1] } : undefined}
      transition={isCritical ? { repeat: Infinity, duration: 0.8 } : undefined}
    >
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </motion.div>
  );
}

// ─── Game Over Overlay ───────────────────────

function GameOverOverlay({
  mistakes,
  elapsed,
  difficulty,
  onExit,
  onPlayAgain,
}: {
  mistakes: number;
  elapsed: number;
  difficulty: Difficulty;
  onExit: () => void;
  onPlayAgain: () => void;
}) {
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'rgba(12, 12, 15, 0.92)',
        backdropFilter: 'blur(12px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex flex-col items-center gap-5 text-center px-8"
        initial={{ y: 24, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.span
          className="text-5xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          💀
        </motion.span>
        <h2
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: 'var(--accent-error)', fontFamily: 'var(--font-primary)' }}
        >
          Game Over
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {mistakes} mistakes • {timeStr} • {difficulty}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          You've used all {MAX_MISTAKES} lives
        </p>

        <div className="flex gap-3 mt-4">
          <motion.button
            className="px-6 py-3 text-sm font-semibold cursor-pointer"
            style={{
              fontFamily: 'var(--font-primary)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
            }}
            whileHover={{ background: 'var(--bg-card-hover)', scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onExit}
          >
            Exit
          </motion.button>
          <motion.button
            className="px-6 py-3 text-sm font-semibold cursor-pointer"
            style={{
              fontFamily: 'var(--font-primary)',
              background: 'var(--accent-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
            }}
            whileHover={{ opacity: 0.9, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPlayAgain}
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Completion Overlay ──────────────────────

function CompletionOverlay({
  elapsed,
  difficulty,
  mistakes,
  xp,
  onExit,
  onPlayAgain,
}: {
  elapsed: number;
  difficulty: Difficulty;
  mistakes: number;
  xp: number;
  onExit: () => void;
  onPlayAgain: () => void;
}) {
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'rgba(12, 12, 15, 0.92)',
        backdropFilter: 'blur(12px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex flex-col items-center gap-5 text-center px-8"
        initial={{ y: 24, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.span
          className="text-5xl"
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          🎉
        </motion.span>
        <h2
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: 'var(--accent-success)', fontFamily: 'var(--font-primary)' }}
        >
          Puzzle Solved!
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {timeStr}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>•</span>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {difficulty}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>•</span>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {mistakes} mistake{mistakes !== 1 ? 's' : ''}
          </span>
        </div>

        <motion.div
          className="flex items-center gap-2 mt-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 18 }}
        >
          <span className="text-2xl font-extrabold tabular-nums" style={{ color: 'var(--accent-primary)' }}>
            +{xp}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)', opacity: 0.6 }}>
            XP
          </span>
        </motion.div>

        <div className="flex gap-3 mt-4">
          <motion.button
            className="px-6 py-3 text-sm font-semibold cursor-pointer"
            style={{
              fontFamily: 'var(--font-primary)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
            }}
            whileHover={{ background: 'var(--bg-card-hover)', scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onExit}
          >
            Exit
          </motion.button>
          <motion.button
            className="px-6 py-3 text-sm font-semibold cursor-pointer"
            style={{
              fontFamily: 'var(--font-primary)',
              background: 'var(--accent-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
            }}
            whileHover={{ opacity: 0.9, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPlayAgain}
          >
            Play Again
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────

export function GameScreen({
  difficulty,
  onExit,
  onComplete,
}: GameScreenProps) {
  const {
    currentGrid,
    selectedCell,
    isPencilMode,
    errors,
    mistakes,
    isComplete,
    isGameOver,
    startTime,
    lastCorrectCell,
    lastErrorCell,
    earnedXP,
    initGame,
    selectCell,
    fillCell,
    eraseCell,
    togglePencil,
    resetGame,
    clearAnimation,
  } = useGameState();

  const [elapsed, setElapsed] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const limit = TIME_LIMITS[difficulty] ?? 900;
  const resultSubmittedRef = useRef(false);

  // Initialize on mount
  useEffect(() => {
    initGame(difficulty);
    setElapsed(0);
    setShowCompletion(false);
    resultSubmittedRef.current = false;
  }, [difficulty, initGame]);

  // Elapsed timer
  useEffect(() => {
    if (isComplete || isGameOver) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (!currentGrid) return;

    intervalRef.current = setInterval(() => {
      setElapsed((s) => {
        const next = s + 1;
        if (next >= limit) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return limit;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentGrid, isComplete, isGameOver, limit]);

  // Clear animation feedback after delay
  useEffect(() => {
    if (lastCorrectCell || lastErrorCell) {
      const t = setTimeout(clearAnimation, 500);
      return () => clearTimeout(t);
    }
  }, [lastCorrectCell, lastErrorCell, clearAnimation]);

  // Show completion overlay after brief pause
  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => setShowCompletion(true), 600);
      return () => clearTimeout(t);
    }
  }, [isComplete]);

  // Submit result on completion or game over
  useEffect(() => {
    if ((isComplete || isGameOver) && !resultSubmittedRef.current) {
      resultSubmittedRef.current = true;
      const timeMs = startTime ? Date.now() - startTime : elapsed * 1000;

      onComplete?.({
        difficulty,
        timeMs,
        mistakes,
        xp: isComplete ? earnedXP : 0,
        won: isComplete,
      });

      // Submit to server (new economy engine)
      fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          intent: 'offline_complete',
          modeId: 'prime-grid',
          difficulty,
          outcome: isComplete ? 'win' : 'game_over',
          score: isComplete ? earnedXP : 0,
          mistakes,
          timeMs,
        }),
      }).catch(() => {
        // Silent fail — offline play still works
      });
    }
  }, [isComplete, isGameOver, difficulty, mistakes, earnedXP, elapsed, startTime, onComplete]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setElapsed(0);
    setShowCompletion(false);
    resultSubmittedRef.current = false;
  }, [resetGame]);

  if (!currentGrid) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: 'var(--bg-primary)' }}
      >
        <motion.div
          className="text-sm font-medium"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}
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
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* ── Top bar ── */}
      <motion.header
        className="w-full flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Exit */}
        <motion.button
          className="text-sm font-medium cursor-pointer"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}
          whileHover={{ color: 'var(--text-secondary)' }}
          whileTap={{ scale: 0.94 }}
          onClick={onExit}
        >
          ← Exit
        </motion.button>

        {/* Difficulty badge */}
        <div className="pill pill-accent">
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </div>

        {/* Right: mistakes + timer */}
        <div className="flex items-center gap-3">
          <MistakeHearts mistakes={mistakes} max={MAX_MISTAKES} />
          <TimerDisplay elapsed={elapsed} limit={limit} />
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
          lastCorrectCell={lastCorrectCell}
          lastErrorCell={lastErrorCell}
          onSelectCell={selectCell}
          onFillCell={fillCell}
          onErase={eraseCell}
          onTogglePencil={togglePencil}
        />

        <NumberPad
          grid={currentGrid}
          isPencilMode={isPencilMode}
          onFillCell={fillCell}
          onErase={eraseCell}
          onTogglePencil={togglePencil}
        />
      </motion.main>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {showCompletion && isComplete && (
          <CompletionOverlay
            elapsed={elapsed}
            difficulty={difficulty}
            mistakes={mistakes}
            xp={earnedXP}
            onExit={onExit}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGameOver && (
          <GameOverOverlay
            mistakes={mistakes}
            elapsed={elapsed}
            difficulty={difficulty}
            onExit={onExit}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
