// ──────────────────────────────────────────────
// NINE — Cell Component (Liquid Minimalist)
// ──────────────────────────────────────────────

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Cell as CellType } from '../../types/game';

interface CellProps {
  cell: CellType;
  isSelected: boolean;
  isPeer: boolean;
  isMatchingValue: boolean;
  isError: boolean;
  isFogged: boolean;
  isCorrectFlash: boolean;
  isErrorShake: boolean;
  isLockedByOpponent?: boolean;
  onClick: (row: number, col: number) => void;
}

function CellInner({
  cell,
  isSelected,
  isPeer,
  isMatchingValue,
  isError,
  isFogged,
  isCorrectFlash,
  isErrorShake,
  isLockedByOpponent,
  onClick,
}: CellProps) {
  const handleClick = useCallback(() => {
    onClick(cell.row, cell.col);
  }, [onClick, cell.row, cell.col]);

  // ── Background color logic ──
  let bg = 'transparent';
  if (isSelected) {
    bg = 'rgba(108, 99, 255, 0.15)';
  } else if (isPeer) {
    bg = 'rgba(108, 99, 255, 0.04)';
  } else if (isMatchingValue) {
    bg = 'rgba(78, 205, 196, 0.08)';
  }

  if (isLockedByOpponent) {
    bg = 'rgba(255, 255, 255, 0.03)';
  }

  // ── Text color ──
  let textColor = 'var(--text-primary)';
  if (cell.isGiven) {
    textColor = 'var(--text-primary)';
  } else if (isLockedByOpponent) {
    textColor = 'var(--text-tertiary)';
  } else if (isError) {
    textColor = 'var(--accent-error)';
  } else if (cell.value !== null) {
    textColor = 'var(--accent-primary)';
  }

  // ── Pencil marks ──
  const showPencil = cell.value === null && cell.pencilMarks.size > 0;

  return (
    <motion.button
      className="relative w-full h-full flex items-center justify-center outline-none cursor-pointer select-none"
      style={{
        background: bg,
        fontFamily: 'var(--font-primary)',
        transition: 'background 200ms ease',
      }}
      onClick={handleClick}
      animate={
        isCorrectFlash
          ? { scale: [1, 1.1, 1] }
          : isErrorShake
            ? { x: [0, -3, 3, -2, 2, 0] }
            : undefined
      }
      transition={
        isCorrectFlash
          ? { duration: 0.3 }
          : isErrorShake
            ? { duration: 0.4 }
            : undefined
      }
      aria-label={`Cell ${cell.row + 1}, ${cell.col + 1}${cell.value ? `, value ${cell.value}` : ''}`}
    >
      {/* Correct flash glow */}
      {isCorrectFlash && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'rgba(123, 211, 137, 0.15)',
            borderRadius: '4px',
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Error flash */}
      {isErrorShake && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'rgba(255, 107, 107, 0.12)',
            borderRadius: '4px',
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Fog overlay */}
      {isFogged && (
        <div
          className="absolute inset-0"
          style={{ background: 'var(--bg-primary)', opacity: 0.85 }}
        />
      )}

      {/* Value */}
      {cell.value !== null && !isFogged && (
        <span
          className="relative z-10 text-base font-semibold tabular-nums"
          style={{
            color: textColor,
            fontFamily: 'var(--font-primary)',
            fontWeight: cell.isGiven ? 700 : 500,
            opacity: isLockedByOpponent ? 0.35 : 1,
          }}
        >
          {cell.value}
        </span>
      )}

      {/* Pencil marks */}
      {showPencil && !isFogged && (
        <div
          className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-px"
          style={{ gap: 0 }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span
              key={n}
              className="flex items-center justify-center text-[0.45rem] tabular-nums"
              style={{
                fontFamily: 'var(--font-primary)',
                color: cell.pencilMarks.has(n) ? 'var(--text-secondary)' : 'transparent',
                fontWeight: 500,
              }}
            >
              {n}
            </span>
          ))}
        </div>
      )}

      {/* Lock icon for opponent-locked cells */}
      {isLockedByOpponent && (
        <span className="absolute bottom-0.5 right-0.5 text-[0.4rem] opacity-30">
          🔒
        </span>
      )}

      {/* Selection ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid var(--accent-primary)',
            borderRadius: '4px',
            opacity: 0.6,
          }}
          layoutId="cell-selection"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </motion.button>
  );
}

export const Cell = memo(CellInner);
