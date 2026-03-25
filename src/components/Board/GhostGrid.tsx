// ──────────────────────────────────────────────
// NINE — Ghost Grid (Opponent's Board)
// ──────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import clsx from 'clsx';
import type { GhostCell } from '../../hooks/useRaceMode';

// ─── Types ──────────────────────────────────

interface GhostGridProps {
  /** Coordinates the opponent has filled. */
  filledCells: GhostCell[];
  /** Array of completed 3×3 box indices. */
  completedBoxes: number[];
  /** Index of the box that just flashed (null when not flashing). */
  latestBoxFlash: number | null;
  /** Opponent total cells filled count. */
  opponentCellCount: number;
}

// ─── Constants ──────────────────────────────

const SIZE = 9;

/** Ghost cell threat color. */
const GHOST_COLOR = 'rgba(168, 85, 247, 0.4)'; // deep purple
const GHOST_FLASH_COLOR = 'rgba(239, 68, 68, 0.6)'; // muted red

// ─── Animation Variants ─────────────────────

const ghostCellVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
};

const boxFlashVariants: Variants = {
  idle: { opacity: 0 },
  flash: {
    opacity: [0, 0.9, 0],
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

// ─── Helpers ────────────────────────────────

function getBoxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

function getBoxBounds(boxIndex: number): { startRow: number; startCol: number } {
  return {
    startRow: Math.floor(boxIndex / 3) * 3,
    startCol: (boxIndex % 3) * 3,
  };
}

// ─── Component ──────────────────────────────

export function GhostGrid({
  filledCells,
  completedBoxes,
  latestBoxFlash,
  opponentCellCount,
}: GhostGridProps) {
  // Build a quick lookup set for filled cells
  const filledSet = useRef(new Set<string>());

  useEffect(() => {
    const set = new Set<string>();
    for (const cell of filledCells) {
      set.add(`${cell.row},${cell.col}`);
    }
    filledSet.current = set;
  }, [filledCells]);

  const completedSet = new Set(completedBoxes);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Label */}
      <div className="flex items-center gap-2">
        <span className="text-[0.5rem] uppercase tracking-[0.25em] text-white/20">
          Opponent
        </span>
        <span className="text-[0.6rem] font-bold tabular-nums text-purple-400/60">
          {opponentCellCount}/81
        </span>
      </div>

      {/* Grid */}
      <div
        className="relative grid grid-cols-9 grid-rows-9 border rounded-sm opacity-30 hover:opacity-40 transition-opacity duration-300"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          width: 'min(40vw, 200px)',
          height: 'min(40vw, 200px)',
        }}
      >
        {Array.from({ length: SIZE * SIZE }, (_, i) => {
          const row = Math.floor(i / SIZE);
          const col = i % SIZE;
          const key = `${row},${col}`;
          const isFilled = filledSet.current.has(key);
          const boxIdx = getBoxIndex(row, col);
          const isBoxComplete = completedSet.has(boxIdx);
          const isFlashing = latestBoxFlash === boxIdx;

          const isBoxRight = col === 2 || col === 5;
          const isBoxBottom = row === 2 || row === 5;
          const isLastCol = col === 8;
          const isLastRow = row === 8;

          return (
            <div
              key={key}
              className={clsx(
                'relative',
                !isLastCol && isBoxRight && 'border-r-[2px]',
                !isLastCol && !isBoxRight && 'border-r',
                !isLastRow && isBoxBottom && 'border-b-[2px]',
                !isLastRow && !isBoxBottom && 'border-b',
              )}
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              {/* Ghost cell glow */}
              <AnimatePresence>
                {isFilled && (
                  <motion.div
                    className="absolute inset-0 rounded-[1px]"
                    style={{
                      background: isBoxComplete ? GHOST_FLASH_COLOR : GHOST_COLOR,
                    }}
                    variants={ghostCellVariants}
                    initial="hidden"
                    animate="visible"
                  />
                )}
              </AnimatePresence>

              {/* Box flash overlay */}
              {isFlashing && (
                <motion.div
                  className="absolute inset-0 z-10 rounded-[1px]"
                  style={{ background: 'rgba(239,68,68,0.8)' }}
                  variants={boxFlashVariants}
                  initial="idle"
                  animate="flash"
                />
              )}
            </div>
          );
        })}

        {/* Box completion borders — overlay when a box is complete */}
        {completedBoxes.map((boxIdx) => {
          const { startRow, startCol } = getBoxBounds(boxIdx);
          const cellSize = 100 / SIZE;

          return (
            <motion.div
              key={`box-${boxIdx}`}
              className="absolute pointer-events-none z-20"
              style={{
                left: `${startCol * cellSize}%`,
                top: `${startRow * cellSize}%`,
                width: `${3 * cellSize}%`,
                height: `${3 * cellSize}%`,
                border: '2px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '2px',
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          );
        })}
      </div>
    </div>
  );
}
