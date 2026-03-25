// ──────────────────────────────────────────────
// NINE — Cell Component
// ──────────────────────────────────────────────

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useCallback } from 'react';
import clsx from 'clsx';
import type { Cell as CellType } from '../../types/game';

// ─── Types ───────────────────────────────────

interface CellProps {
  cell: CellType;
  isSelected: boolean;
  isPeer: boolean;
  isMatchingValue: boolean;
  isError: boolean;
  onClick: (row: number, col: number) => void;
}

// ─── Pencil marks grid (3x3 layout 1-9) ─────

const PENCIL_POSITIONS: Record<number, string> = {
  1: 'top-0 left-0',
  2: 'top-0 left-1/3',
  3: 'top-0 right-0',
  4: 'top-1/3 left-0',
  5: 'top-1/3 left-1/3',
  6: 'top-1/3 right-0',
  7: 'bottom-0 left-0',
  8: 'bottom-0 left-1/3',
  9: 'bottom-0 right-0',
};

// ─── Value digit animation variants ──────────

const digitVariants: Variants = {
  initial: { opacity: 0, scale: 1.4 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 600, damping: 20, duration: 0.12 },
  },
  exit: { opacity: 0, scale: 0.7, transition: { duration: 0.08 } },
};

// Error shake animation variant
const shakeVariants: Variants = {
  shake: {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.2, ease: 'easeInOut' as const },
  },
  idle: { x: 0 },
};

// ─── Component ───────────────────────────────

export function Cell({
  cell,
  isSelected,
  isPeer,
  isMatchingValue,
  isError,
  onClick,
}: CellProps) {
  const handleClick = useCallback(() => {
    onClick(cell.row, cell.col);
  }, [cell.row, cell.col, onClick]);

  const hasPencilMarks = cell.value === null && cell.pencilMarks.size > 0;

  return (
    <motion.button
      className={clsx(
        'relative flex items-center justify-center',
        'w-full h-full outline-none select-none',
        'transition-colors duration-100',
        // Background layers via CSS variables
        isSelected
          ? 'bg-[var(--color-accent)] bg-opacity-25'
          : isMatchingValue && !isError
            ? 'bg-[var(--color-accent)] bg-opacity-15'
            : isPeer
              ? 'bg-[var(--color-grid-lines)] bg-opacity-30'
              : 'bg-transparent',
      )}
      style={{
        color: isError
          ? 'var(--color-error)'
          : cell.isGiven
            ? 'var(--color-primary-text)'
            : 'var(--color-accent)',
      }}
      onClick={handleClick}
      aria-label={`Cell row ${cell.row + 1} col ${cell.col + 1}${cell.value ? `, value ${cell.value}` : ''}`}
      aria-selected={isSelected}
      animate={isError ? 'shake' : 'idle'}
      variants={shakeVariants}
    >
      {/* Main value */}
      <AnimatePresence mode="wait">
        {cell.value !== null && (
          <motion.span
            key={`${cell.row}-${cell.col}-${cell.value}`}
            className={clsx(
              'absolute inset-0 flex items-center justify-center',
              'text-xl font-bold leading-none tabular-nums',
              cell.isGiven ? 'font-extrabold' : 'font-semibold',
            )}
            variants={digitVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {cell.value}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Pencil marks */}
      {hasPencilMarks && (
        <div className="absolute inset-0">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) =>
            cell.pencilMarks.has(n) ? (
              <span
                key={n}
                className={clsx(
                  'absolute text-[0.45rem] leading-none font-medium tabular-nums',
                  'flex items-center justify-center',
                  'w-1/3 h-1/3',
                  PENCIL_POSITIONS[n],
                )}
                style={{ color: 'var(--color-primary-text)', opacity: 0.6 }}
              >
                {n}
              </span>
            ) : null,
          )}
        </div>
      )}

      {/* Selection ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 border-2 pointer-events-none"
          style={{ borderColor: 'var(--color-accent)' }}
          layoutId="cell-selection-ring"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </motion.button>
  );
}
