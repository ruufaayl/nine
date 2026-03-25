// ──────────────────────────────────────────────
// NINE — Canvas Fracture (Sliding Puzzle) UI
// ──────────────────────────────────────────────

import { useCallback } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import clsx from 'clsx';
import { useCanvasFracture } from '../../hooks/useCanvasFracture';

// ─── Types ──────────────────────────────────

interface CanvasFractureProps {
  onExit: () => void;
}

// ─── Animation Variants ─────────────────────

const pulseVariants: Variants = {
  idle: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.04, 1],
    opacity: [1, 0.8, 1],
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

// ─── Tile ───────────────────────────────────

interface TileProps {
  displayNumber: number;
  isEmpty: boolean;
  isMovable: boolean;
  isComplete: boolean;
  pulseDelay: number;
  onClick: () => void;
}

function Tile({ displayNumber, isEmpty, isMovable, isComplete, pulseDelay, onClick }: TileProps) {
  if (isEmpty) {
    return <div className="w-full aspect-square" />;
  }

  return (
    <motion.button
      className={clsx(
        'w-full aspect-square flex items-center justify-center',
        'rounded-lg border text-lg font-bold tabular-nums',
        'select-none outline-none',
        isMovable && 'cursor-pointer',
        !isMovable && 'cursor-default',
      )}
      style={{
        background: isComplete
          ? 'var(--color-accent)'
          : 'rgba(255,255,255,0.05)',
        borderColor: isComplete
          ? 'var(--color-accent)'
          : isMovable
            ? 'rgba(255,255,255,0.15)'
            : 'rgba(255,255,255,0.06)',
        color: isComplete
          ? 'var(--color-background)'
          : isMovable
            ? 'var(--color-primary-text)'
            : 'rgba(255,255,255,0.5)',
      }}
      layout
      transition={{
        layout: { type: 'spring', stiffness: 400, damping: 30 },
      }}
      whileHover={isMovable && !isComplete ? { borderColor: 'rgba(255,255,255,0.35)' } : undefined}
      whileTap={isMovable && !isComplete ? { scale: 0.95 } : undefined}
      animate={
        isComplete
          ? {
              scale: [1, 1.06, 1],
              transition: {
                delay: pulseDelay,
                duration: 0.3,
                ease: 'easeOut' as const,
              },
            }
          : undefined
      }
      onClick={onClick}
      disabled={!isMovable && !isComplete}
    >
      {displayNumber}
    </motion.button>
  );
}

// ─── Completion Overlay ─────────────────────

interface OverlayProps {
  moves: number;
  score: number;
  onReset: () => void;
  onExit: () => void;
}

function CompletionOverlay({ moves, score, onReset, onExit }: OverlayProps) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2, duration: 0.4 }}
    >
      <motion.div
        className="flex flex-col items-center gap-5 px-8 py-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md max-w-xs w-full text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.3 }}
      >
        <span
          className="text-2xl font-black tracking-wide"
          style={{ color: 'var(--color-accent)' }}
        >
          CANVAS RESTORED
        </span>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="flex flex-col items-center gap-1 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <span className="text-lg font-black tabular-nums" style={{ color: 'var(--color-primary-text)' }}>
              {moves}
            </span>
            <span className="text-[0.5rem] uppercase tracking-widest text-white/30">Moves</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <span className="text-lg font-black tabular-nums" style={{ color: 'var(--color-accent)' }}>
              {score.toLocaleString()}
            </span>
            <span className="text-[0.5rem] uppercase tracking-widest text-white/30">Score</span>
          </div>
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
            style={{ background: 'var(--color-accent)', color: 'var(--color-background)' }}
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

export function CanvasFracture({ onExit }: CanvasFractureProps) {
  const {
    tiles,
    emptyIndex,
    gridSize,
    moves,
    isComplete,
    score,
    completionPulse,
    movableSet,
    slideTile,
    clearPulse,
    reset,
  } = useCanvasFracture(4);

  const handleTileClick = useCallback(
    (index: number) => {
      if (!isComplete) slideTile(index);
    },
    [isComplete, slideTile],
  );

  return (
    <div
      className="relative flex flex-col items-center min-h-screen overflow-hidden"
      style={{ background: 'var(--color-background)' }}
    >
      {/* Header */}
      <header className="w-full max-w-lg flex items-center justify-between px-5 pt-5 pb-3">
        <motion.button
          className="text-[0.6rem] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors"
          whileTap={{ scale: 0.95 }}
          onClick={onExit}
        >
          ← Lobby
        </motion.button>
        <h1
          className="text-sm font-black uppercase tracking-[0.15em]"
          style={{ color: 'var(--color-primary-text)' }}
        >
          Canvas Fracture
        </h1>
        <span className="text-xs tabular-nums text-white/30">
          {moves} moves
        </span>
      </header>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center px-5 pb-8">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            width: `min(85vw, 85vh, 400px)`,
            height: `min(85vw, 85vh, 400px)`,
          }}
        >
          {tiles.map((tile, i) => (
            <Tile
              key={tile.originalIndex}
              displayNumber={tile.originalIndex + 1}
              isEmpty={tile.isEmpty}
              isMovable={movableSet.has(i)}
              isComplete={completionPulse}
              pulseDelay={i * 0.04}
              onClick={() => handleTileClick(i)}
            />
          ))}
        </div>
      </div>

      {/* Completion */}
      <AnimatePresence>
        {isComplete && (
          <CompletionOverlay
            moves={moves}
            score={score}
            onReset={() => reset()}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
