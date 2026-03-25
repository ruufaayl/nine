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
  isFogged: boolean;
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
  initial: { opacity: 0, scale: 1.3 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'tween' as const, duration: 0.12, ease: 'easeOut' as const },
  },
  exit: { opacity: 0, scale: 0.7, transition: { duration: 0.08 } },
};

// Error shake animation variant — 200ms horizontal
const shakeVariants: Variants = {
  shake: {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.2, ease: 'easeInOut' as const },
  },
  idle: { x: 0 },
};

// Fog reveal/hide
const fogVariants: Variants = {
  fogged: { opacity: 1 },
  revealed: { opacity: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// ─── Component ───────────────────────────────

export function Cell({
  cell,
  isSelected,
  isPeer,
  isMatchingValue,
  isError,
  isFogged,
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
      aria-label={`Cell row ${cell.row + 1} col ${cell.col + 1}${cell.value ? `, value ${cell.value}` : ''}${isFogged ? ', fogged' : ''}`}
      aria-selected={isSelected}
      animate={isError ? 'shake' : 'idle'}
      variants={shakeVariants}
    >
      {/* Main value */}
      <AnimatePresence mode="wait">
        {cell.value !== null && !isFogged && (
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

      {/* Pencil marks (hidden when fogged) */}
      {hasPencilMarks && !isFogged && (
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

      {/* Fog overlay */}
      <AnimatePresence>
        {isFogged && (
          <motion.div
            className="absolute inset-0 z-20 rounded-[1px]"
            style={{
              background: 'var(--color-background)',
              boxShadow: 'inset 0 0 8px 2px var(--color-grid-lines)',
            }}
            variants={fogVariants}
            initial="fogged"
            animate="fogged"
            exit="revealed"
          />
        )}
      </AnimatePresence>

      {/* Selection ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 border-2 pointer-events-none z-30"
          style={{ borderColor: 'var(--color-accent)' }}
          layoutId="cell-selection-ring"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </motion.button>
  );
}
