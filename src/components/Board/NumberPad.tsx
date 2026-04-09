// ──────────────────────────────────────────────
// NINE — NumberPad (Liquid Design)
// ──────────────────────────────────────────────

import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Grid } from '../../types/game';

interface NumberPadProps {
  grid: Grid;
  isPencilMode: boolean;
  onFillCell: (value: number) => void;
  onErase: () => void;
  onTogglePencil: () => void;
}

export function NumberPad({
  grid,
  isPencilMode,
  onFillCell,
  onErase,
  onTogglePencil,
}: NumberPadProps) {
  // Count remaining instances of each digit
  const counts = new Map<number, number>();
  for (let d = 1; d <= 9; d++) {
    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value === d && grid[r][c].isValid) count++;
      }
    }
    counts.set(d, count);
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full" style={{ maxWidth: 'min(88vw, 480px)' }}>
      {/* Number buttons */}
      <div className="grid grid-cols-9 gap-1.5 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
          const filled = counts.get(n) ?? 0;
          const isComplete = filled >= 9;

          return (
            <motion.button
              key={n}
              className={clsx(
                'relative flex flex-col items-center justify-center',
                'aspect-square outline-none cursor-pointer select-none',
                'transition-all duration-200',
                isComplete && 'opacity-25 pointer-events-none',
              )}
              style={{
                fontFamily: 'var(--font-primary)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
              }}
              whileHover={{
                background: 'var(--bg-card-hover)',
                borderColor: 'var(--border-default)',
                scale: 1.05,
              }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onFillCell(n)}
            >
              <span className="text-lg font-semibold tabular-nums leading-none">
                {n}
              </span>
              <span
                className="text-[0.45rem] tabular-nums mt-0.5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {9 - filled}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 w-full">
        {/* Erase */}
        <motion.button
          className={clsx(
            'flex-1 flex items-center justify-center gap-2',
            'py-3 outline-none cursor-pointer select-none',
            'text-xs font-semibold',
          )}
          style={{
            fontFamily: 'var(--font-primary)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
          }}
          whileHover={{ background: 'var(--bg-card-hover)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onErase}
        >
          <span>⌫</span>
          <span>Erase</span>
        </motion.button>

        {/* Pencil Mode */}
        <motion.button
          className={clsx(
            'flex-1 flex items-center justify-center gap-2',
            'py-3 outline-none cursor-pointer select-none',
            'text-xs font-semibold',
          )}
          style={{
            fontFamily: 'var(--font-primary)',
            background: isPencilMode
              ? 'rgba(108, 99, 255, 0.12)'
              : 'var(--bg-card)',
            border: isPencilMode
              ? '1px solid rgba(108, 99, 255, 0.3)'
              : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: isPencilMode ? 'var(--accent-primary)' : 'var(--text-secondary)',
          }}
          whileHover={{ background: isPencilMode ? 'rgba(108, 99, 255, 0.18)' : 'var(--bg-card-hover)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onTogglePencil}
        >
          <span>✏️</span>
          <span>Notes {isPencilMode ? 'ON' : 'OFF'}</span>
        </motion.button>
      </div>
    </div>
  );
}
