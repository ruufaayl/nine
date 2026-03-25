// ──────────────────────────────────────────────
// NINE — NumberPad Component
// ──────────────────────────────────────────────

import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Grid } from '../../types/game';

// ─── Types ───────────────────────────────────

interface NumberPadProps {
  grid: Grid | null;
  isPencilMode: boolean;
  onFillCell: (value: number) => void;
  onErase: () => void;
  onTogglePencil: () => void;
}

// ─── Helpers ─────────────────────────────────

/** Count how many times `value` appears in the grid. */
function countValue(grid: Grid, value: number): number {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c].value === value) count++;
    }
  }
  return count;
}

// ─── Sub-components ──────────────────────────

interface DigitButtonProps {
  value: number;
  isExhausted: boolean;
  onPress: (value: number) => void;
}

function DigitButton({ value, isExhausted, onPress }: DigitButtonProps) {
  return (
    <motion.button
      className={clsx(
        'relative flex items-center justify-center',
        'rounded-lg text-2xl font-bold tabular-nums',
        'w-full aspect-square',
        'transition-opacity duration-150',
        isExhausted ? 'opacity-20 cursor-default' : 'cursor-pointer',
      )}
      style={{
        background: 'var(--color-grid-lines)',
        color: isExhausted ? 'var(--color-primary-text)' : 'var(--color-accent)',
        border: '1px solid transparent',
      }}
      whileHover={
        isExhausted
          ? {}
          : {
              scale: 1.08,
              borderColor: 'var(--color-accent)',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-background)',
            }
      }
      whileTap={isExhausted ? {} : { scale: 0.94 }}
      onClick={() => !isExhausted && onPress(value)}
      aria-label={`Place ${value}`}
      aria-disabled={isExhausted}
      tabIndex={isExhausted ? -1 : 0}
    >
      {value}
    </motion.button>
  );
}

// ─── Main Component ──────────────────────────

export function NumberPad({
  grid,
  isPencilMode,
  onFillCell,
  onErase,
  onTogglePencil,
}: NumberPadProps) {
  // Pre-compute which digits are fully placed (9 instances = exhausted)
  const exhausted = new Set<number>();
  if (grid) {
    for (let v = 1; v <= 9; v++) {
      if (countValue(grid, v) >= 9) exhausted.add(v);
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 'min(90vw, 540px)' }}>
      {/* Digit grid: 3 columns × 3 rows */}
      <div className="grid grid-cols-9 gap-1.5">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <DigitButton
            key={n}
            value={n}
            isExhausted={exhausted.has(n)}
            onPress={onFillCell}
          />
        ))}
      </div>

      {/* Controls row: Erase + Pencil toggle */}
      <div className="grid grid-cols-2 gap-2">
        {/* Erase */}
        <motion.button
          className={clsx(
            'flex items-center justify-center gap-2',
            'rounded-lg px-4 py-3',
            'text-sm font-semibold uppercase tracking-widest',
          )}
          style={{
            background: 'var(--color-grid-lines)',
            color: 'var(--color-primary-text)',
            border: '1px solid transparent',
          }}
          whileHover={{
            borderColor: 'var(--color-error)',
            color: 'var(--color-error)',
          }}
          whileTap={{ scale: 0.96 }}
          onClick={onErase}
          aria-label="Erase selected cell"
        >
          <EraserIcon />
          Erase
        </motion.button>

        {/* Pencil toggle */}
        <motion.button
          className={clsx(
            'flex items-center justify-center gap-2',
            'rounded-lg px-4 py-3',
            'text-sm font-semibold uppercase tracking-widest',
          )}
          style={{
            background: isPencilMode
              ? 'var(--color-accent)'
              : 'var(--color-grid-lines)',
            color: isPencilMode
              ? 'var(--color-background)'
              : 'var(--color-primary-text)',
            border: '1px solid transparent',
          }}
          whileHover={
            isPencilMode
              ? { opacity: 0.85 }
              : { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }
          }
          whileTap={{ scale: 0.96 }}
          onClick={onTogglePencil}
          aria-label={isPencilMode ? 'Disable pencil mode' : 'Enable pencil mode'}
          aria-pressed={isPencilMode}
        >
          <PencilIcon />
          Pencil
          {isPencilMode && (
            <motion.span
              className="ml-1 text-xs rounded-full px-1.5 py-0.5"
              style={{ background: 'var(--color-background)', color: 'var(--color-accent)' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              ON
            </motion.span>
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────

function EraserIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
