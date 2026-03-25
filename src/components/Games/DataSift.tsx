// ──────────────────────────────────────────────
// NINE — Data Sift (Categorization Matrix) UI
// ──────────────────────────────────────────────

import { useCallback } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import clsx from 'clsx';
import { useDataSift, type DataSiftGameState } from '../../hooks/useDataSift';
import type { DataSiftItem } from '../../types/trivia_games';

// ─── Types ──────────────────────────────────

interface DataSiftProps {
  onExit: () => void;
}

// ─── Animation Variants ─────────────────────

const shakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.2, ease: 'easeInOut' as const },
  },
};

const correctPulse: Variants = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
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

// ─── Grid Cell ──────────────────────────────

interface GridCellProps {
  item: DataSiftItem;
  isSelected: boolean;
  isSolved: boolean;
  isCorrectFeedback: boolean;
  isIncorrectFeedback: boolean;
  onClick: () => void;
}

function GridCell({
  item,
  isSelected,
  isSolved,
  isCorrectFeedback,
  isIncorrectFeedback,
  onClick,
}: GridCellProps) {
  let bg = 'transparent';
  let borderColor = 'rgba(255,255,255,0.1)';
  let textColor = 'var(--color-primary-text)';

  if (isSolved) {
    bg = 'rgba(255,255,255,0.04)';
    borderColor = 'var(--color-accent)';
    textColor = 'var(--color-accent)';
  } else if (isCorrectFeedback) {
    bg = 'var(--color-accent)';
    borderColor = 'var(--color-accent)';
    textColor = 'var(--color-background)';
  } else if (isIncorrectFeedback) {
    bg = 'rgba(255,80,80,0.12)';
    borderColor = 'var(--color-error)';
    textColor = 'var(--color-error)';
  } else if (isSelected) {
    bg = 'rgba(255,255,255,0.04)';
    borderColor = 'var(--color-accent)';
    textColor = 'var(--color-accent)';
  }

  return (
    <motion.button
      className={clsx(
        'flex items-center justify-center',
        'rounded-lg border-2 text-center',
        'text-sm font-semibold leading-tight',
        'outline-none focus-visible:ring-1 focus-visible:ring-white/20',
        'select-none aspect-square',
      )}
      style={{
        background: bg,
        borderColor,
        color: textColor,
        textShadow: isSelected && !isSolved ? '0 0 12px currentColor' : 'none',
      }}
      variants={isCorrectFeedback ? correctPulse : undefined}
      animate={isCorrectFeedback ? 'pulse' : 'idle'}
      whileTap={!isSolved ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={isSolved}
      aria-label={item.label}
    >
      {item.label}
    </motion.button>
  );
}

// ─── Lives Display ──────────────────────────

function LivesDisplay({ lives, maxLives }: { lives: number; maxLives: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: maxLives }, (_, i) => (
        <motion.div
          key={i}
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background:
              i < lives ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
          }}
          animate={
            i >= lives
              ? { scale: [1, 0.8], opacity: 0.3 }
              : { scale: 1, opacity: 1 }
          }
        />
      ))}
    </div>
  );
}

// ─── Game Over Overlay ──────────────────────

interface OverlayProps {
  gameState: DataSiftGameState;
  score: number;
  onReset: () => void;
  onExit: () => void;
}

function GameOverOverlay({ gameState, score, onReset, onExit }: OverlayProps) {
  const isWon = gameState === 'won';

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <motion.div
        className="flex flex-col items-center gap-5 px-8 py-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md max-w-xs w-full text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        <div className="flex flex-col gap-2">
          <span
            className="text-2xl font-black tracking-wide"
            style={{
              color: isWon ? 'var(--color-accent)' : 'var(--color-error)',
            }}
          >
            {isWon ? 'DATA EXTRACTED' : 'SIGNAL LOST'}
          </span>
          <motion.span
            className="text-3xl font-black tabular-nums"
            style={{ color: 'var(--color-accent)' }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
          >
            {score.toLocaleString()}
          </motion.span>
          <span className="text-xs text-white/30 uppercase tracking-widest">
            Points
          </span>
        </div>

        <div className="flex gap-3 w-full mt-2">
          <motion.button
            className="flex-1 py-3 rounded-lg border border-white/10 text-sm font-semibold text-white/60"
            whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onExit}
          >
            Lobby
          </motion.button>
          <motion.button
            className="flex-1 py-3 rounded-lg text-sm font-bold"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-background)',
            }}
            whileHover={{ scale: 1.03, opacity: 0.9 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReset}
          >
            Again
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────

export function DataSift({ onExit }: DataSiftProps) {
  const {
    items,
    targetCategory,
    selectedIds,
    solvedIds,
    lives,
    maxLives,
    gameState,
    feedback,
    shakeGrid,
    score,
    toggleItem,
    clearShake,
    reset,
  } = useDataSift();

  const handleCellClick = useCallback(
    (id: string) => {
      if (gameState !== 'playing') return;
      toggleItem(id);
    },
    [gameState, toggleItem],
  );

  const isGameOver = gameState === 'won' || gameState === 'lost';

  return (
    <div
      className="relative flex flex-col items-center min-h-screen overflow-hidden"
      style={{ background: 'var(--color-background)' }}
    >
      {/* ── Header ── */}
      <header className="w-full max-w-lg flex items-center justify-between px-5 pt-5 pb-3">
        <motion.button
          className="text-[0.6rem] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors"
          whileTap={{ scale: 0.95 }}
          onClick={onExit}
          aria-label="Back to lobby"
        >
          ← Lobby
        </motion.button>
        <h1
          className="text-sm font-black uppercase tracking-[0.15em]"
          style={{ color: 'var(--color-primary-text)' }}
        >
          Data Sift
        </h1>
        <LivesDisplay lives={lives} maxLives={maxLives} />
      </header>

      {/* ── Category & Score ── */}
      <div className="flex flex-col items-center gap-1 px-5 pb-4">
        <span
          className="text-[0.55rem] uppercase tracking-[0.25em]"
          style={{ color: 'var(--color-accent)', opacity: 0.5 }}
        >
          Find all 4
        </span>
        <h2
          className="text-lg font-bold text-center tracking-tight"
          style={{ color: 'var(--color-primary-text)' }}
        >
          {targetCategory}
        </h2>
        <span className="text-xs tabular-nums text-white/30 mt-1">
          {score.toLocaleString()} pts
        </span>
      </div>

      {/* ── 4×4 Grid ── */}
      <motion.div
        className="w-full max-w-md px-5"
        variants={shakeVariants}
        animate={shakeGrid ? 'shake' : 'idle'}
        onAnimationComplete={() => {
          if (shakeGrid) clearShake();
        }}
      >
        <div className="grid grid-cols-4 gap-2">
          {items.map((item) => {
            const isSolved = solvedIds.has(item.id);
            const isSelected = selectedIds.has(item.id);
            const isCorrectFeedback = feedback?.correctIds.includes(item.id) ?? false;
            const isIncorrectFeedback = feedback?.incorrectIds.includes(item.id) ?? false;

            return (
              <GridCell
                key={item.id}
                item={item}
                isSelected={isSelected}
                isSolved={isSolved}
                isCorrectFeedback={isCorrectFeedback}
                isIncorrectFeedback={isIncorrectFeedback}
                onClick={() => handleCellClick(item.id)}
              />
            );
          })}
        </div>
      </motion.div>

      {/* ── Selection count ── */}
      {!isGameOver && (
        <div className="mt-4">
          <span className="text-xs text-white/25 tabular-nums">
            {[...selectedIds].filter((id) => !solvedIds.has(id)).length} / 4 selected
          </span>
        </div>
      )}

      {/* ── Game Over ── */}
      <AnimatePresence>
        {isGameOver && (
          <GameOverOverlay
            gameState={gameState}
            score={score}
            onReset={reset}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
