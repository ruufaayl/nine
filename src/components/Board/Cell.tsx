// ──────────────────────────────────────────────
// NINE — Cell Component (Premium)
// Rich gradients, tactile press, glow states.
// Numbers use Styrene Bold (--font-numeric).
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

  // ── Background: layered gradients by state ──
  // Base (given) cells get a subtle inset tint. Player entries glow.
  // Selected is a radial bloom; peers get a gentle wash.
  let background = 'transparent';

  if (isSelected) {
    background = `
      radial-gradient(circle at 50% 50%, rgba(108, 99, 255, 0.30) 0%, rgba(108, 99, 255, 0.12) 55%, rgba(108, 99, 255, 0.04) 100%)
    `;
  } else if (isMatchingValue) {
    background = `
      linear-gradient(180deg, rgba(94, 229, 219, 0.12) 0%, rgba(94, 229, 219, 0.04) 100%)
    `;
  } else if (isPeer) {
    background = 'linear-gradient(180deg, rgba(108, 99, 255, 0.055) 0%, rgba(108, 99, 255, 0.018) 100%)';
  } else if (cell.isGiven) {
    background = 'linear-gradient(180deg, rgba(255,255,255,0.018) 0%, rgba(255,255,255,0) 100%)';
  }

  if (isLockedByOpponent) {
    background = 'rgba(255, 255, 255, 0.03)';
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

  // ── Text glow for entered values ──
  const valueTextShadow =
    !cell.isGiven && cell.value !== null && !isError && !isLockedByOpponent
      ? '0 0 14px rgba(124, 116, 255, 0.45)'
      : isError
        ? '0 0 12px rgba(255, 107, 107, 0.5)'
        : 'none';

  // ── Pencil marks ──
  const showPencil = cell.value === null && cell.pencilMarks.size > 0;

  return (
    <motion.button
      className="relative w-full h-full flex items-center justify-center outline-none cursor-pointer select-none overflow-hidden"
      style={{
        background,
        fontFamily: 'var(--font-numeric)',
        transition: 'background 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={handleClick}
      whileTap={{ scale: 0.94 }}
      animate={
        isCorrectFlash
          ? { scale: [1, 1.1, 1] }
          : isErrorShake
            ? { x: [0, -3, 3, -2, 2, 0] }
            : undefined
      }
      transition={
        isCorrectFlash
          ? { duration: 0.3, ease: 'easeOut' }
          : isErrorShake
            ? { duration: 0.4 }
            : { type: 'spring', stiffness: 600, damping: 20 }
      }
      aria-label={`Cell ${cell.row + 1}, ${cell.col + 1}${cell.value ? `, value ${cell.value}` : ''}`}
    >
      {/* Idle inner highlight — glass sheen on top edge */}
      {!isSelected && !isLockedByOpponent && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          }}
        />
      )}

      {/* Correct flash — green bloom */}
      {isCorrectFlash && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(123, 211, 137, 0.35) 0%, rgba(123, 211, 137, 0.1) 45%, transparent 80%)',
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}

      {/* Error flash — red pulse */}
      {isErrorShake && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(255, 107, 107, 0.25) 0%, rgba(255, 107, 107, 0.08) 60%, transparent 100%)',
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
        <motion.span
          className="relative z-10 text-lg tabular-nums"
          style={{
            color: textColor,
            fontFamily: 'var(--font-numeric)',
            fontWeight: cell.isGiven ? 800 : 700,
            opacity: isLockedByOpponent ? 0.35 : 1,
            textShadow: valueTextShadow,
            letterSpacing: '-0.02em',
          }}
          initial={false}
          animate={{ scale: cell.value !== null ? 1 : 0.6 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        >
          {cell.value}
        </motion.span>
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
              className="flex items-center justify-center text-[0.5rem] tabular-nums"
              style={{
                fontFamily: 'var(--font-numeric)',
                color: cell.pencilMarks.has(n) ? 'var(--text-secondary)' : 'transparent',
                fontWeight: 600,
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

      {/* Selection ring — layered spring-animated */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '1.5px solid var(--accent-primary)',
            borderRadius: '5px',
            boxShadow:
              '0 0 0 1px rgba(108, 99, 255, 0.15) inset, 0 0 18px rgba(108, 99, 255, 0.35)',
          }}
          layoutId="cell-selection"
          transition={{ type: 'spring', stiffness: 520, damping: 34 }}
        />
      )}
    </motion.button>
  );
}

export const Cell = memo(CellInner);
