// ──────────────────────────────────────────────
// NINE — Chronos Shift (Sorting) UI Component
// ──────────────────────────────────────────────

import { useCallback } from 'react';
import { AnimatePresence, motion, Reorder, type Variants } from 'framer-motion';
import clsx from 'clsx';
import { useChronosShift, type ChronosGameState } from '../../hooks/useChronosShift';
import type { ChronosItem } from '../../types/expanded_games';

// ─── Types ──────────────────────────────────

interface ChronosShiftProps {
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

const pulseVariants: Variants = {
  idle: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.02, 1],
    opacity: [1, 0.85, 1],
    transition: { duration: 0.4, ease: 'easeOut' as const },
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

// ─── Sortable Card ──────────────────────────

interface SortCardProps {
  item: ChronosItem;
  index: number;
  isLocked: boolean;
  isCorrect: boolean | null;
  isIncorrect: boolean;
}

function SortCard({ item, index, isLocked, isCorrect, isIncorrect }: SortCardProps) {
  const bg = isLocked
    ? 'rgba(255,255,255,0.06)'
    : 'rgba(255,255,255,0.03)';

  const borderColor = isLocked
    ? 'var(--color-accent)'
    : isCorrect === true
      ? 'var(--color-accent)'
      : isIncorrect
        ? 'var(--color-error)'
        : 'rgba(255,255,255,0.08)';

  return (
    <Reorder.Item
      value={item.id}
      dragListener={!isLocked}
      as="div"
      className={clsx(
        'flex items-center justify-between',
        'rounded-xl px-5 py-4 w-full',
        'border-2 select-none',
        !isLocked && 'cursor-grab active:cursor-grabbing',
      )}
      style={{
        background: bg,
        borderColor,
      }}
      whileDrag={{
        scale: 1.05,
        boxShadow: '0 8px 30px rgba(var(--accent-rgb, 74,144,226), 0.25)',
        zIndex: 50,
      }}
      variants={isIncorrect ? shakeVariants : isCorrect ? pulseVariants : undefined}
      animate={isIncorrect ? 'shake' : isCorrect ? 'pulse' : 'idle'}
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Position indicator */}
      <div className="flex items-center gap-4">
        <span
          className="text-xs font-black tabular-nums w-5 text-center"
          style={{
            color: isLocked ? 'var(--color-accent)' : 'rgba(255,255,255,0.25)',
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="flex flex-col gap-0.5">
          <span
            className="text-sm font-bold leading-tight"
            style={{
              color: isLocked ? 'var(--color-accent)' : 'var(--color-primary-text)',
            }}
          >
            {item.label}
          </span>
          {isLocked && (
            <motion.span
              className="text-[0.6rem] tracking-wider uppercase"
              style={{ color: 'var(--color-accent)', opacity: 0.6 }}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 0.6, y: 0 }}
            >
              {item.revealText}
            </motion.span>
          )}
        </div>
      </div>

      {/* Lock / Drag indicator */}
      {isLocked ? (
        <span
          className="text-[0.6rem] font-bold uppercase tracking-widest"
          style={{ color: 'var(--color-accent)', opacity: 0.5 }}
        >
          ✓
        </span>
      ) : (
        <span className="text-white/15 text-xs">⠿</span>
      )}
    </Reorder.Item>
  );
}

// ─── Game Over Overlay ──────────────────────

interface OverlayProps {
  gameState: ChronosGameState;
  attemptsUsed: number;
  onReset: () => void;
  onExit: () => void;
}

function GameOverOverlay({ gameState, attemptsUsed, onReset, onExit }: OverlayProps) {
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
        <div className="flex flex-col gap-1">
          <span
            className="text-2xl font-black tracking-wide"
            style={{
              color: isWon ? 'var(--color-accent)' : 'var(--color-error)',
            }}
          >
            {isWon ? 'SEQUENCE LOCKED' : 'TIMELINE FRACTURED'}
          </span>
          <span className="text-xs text-white/40 uppercase tracking-widest">
            {isWon
              ? `Solved in ${attemptsUsed} ${attemptsUsed === 1 ? 'attempt' : 'attempts'}`
              : 'Maximum attempts exceeded'}
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

export function ChronosShift({ onExit }: ChronosShiftProps) {
  const {
    orderedItems,
    currentOrder,
    lockedSlots,
    attemptsUsed,
    maxAttempts,
    gameState,
    lastValidation,
    shakeGrid,
    category,
    sortDirection,
    reorder,
    lockSequence,
    clearShake,
    reset,
  } = useChronosShift();

  const handleReorder = useCallback(
    (newOrder: string[]) => {
      reorder(newOrder);
    },
    [reorder],
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
          Chronos Shift
        </h1>
        <span className="text-xs tabular-nums text-white/30">
          {attemptsUsed}/{maxAttempts}
        </span>
      </header>

      {/* ── Category ── */}
      <div className="flex flex-col items-center gap-1 px-5 pb-4">
        <span
          className="text-[0.55rem] uppercase tracking-[0.25em]"
          style={{ color: 'var(--color-accent)', opacity: 0.5 }}
        >
          Sort {sortDirection}
        </span>
        <h2
          className="text-lg font-bold text-center tracking-tight"
          style={{ color: 'var(--color-primary-text)' }}
        >
          {category}
        </h2>
      </div>

      {/* ── Sortable List ── */}
      <motion.div
        className="flex-1 w-full max-w-lg px-5"
        variants={shakeVariants}
        animate={shakeGrid ? 'shake' : 'idle'}
        onAnimationComplete={() => {
          if (shakeGrid) clearShake();
        }}
      >
        <Reorder.Group
          axis="y"
          values={currentOrder}
          onReorder={handleReorder}
          as="div"
          className="flex flex-col gap-2"
        >
          {currentOrder.map((id, i) => {
            const item = orderedItems[i];
            if (!item) return null;

            const isLocked = lockedSlots[i];
            const isCorrect = lastValidation ? lastValidation.slotResults[i] : null;
            const isIncorrect = lastValidation ? !lastValidation.slotResults[i] && !isLocked : false;

            return (
              <SortCard
                key={id}
                item={item}
                index={i}
                isLocked={isLocked}
                isCorrect={isCorrect}
                isIncorrect={isIncorrect}
              />
            );
          })}
        </Reorder.Group>
      </motion.div>

      {/* ── Lock Button ── */}
      {!isGameOver && (
        <div className="w-full max-w-lg px-5 py-6">
          <motion.button
            className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em]"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-background)',
            }}
            whileHover={{ scale: 1.02, opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            onClick={lockSequence}
            disabled={gameState === 'validating'}
          >
            Lock Sequence
          </motion.button>
        </div>
      )}

      {/* ── Game Over ── */}
      <AnimatePresence>
        {isGameOver && (
          <GameOverOverlay
            gameState={gameState}
            attemptsUsed={attemptsUsed}
            onReset={reset}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
