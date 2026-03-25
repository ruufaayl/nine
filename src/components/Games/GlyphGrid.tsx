// ──────────────────────────────────────────────
// NINE — Glyph Grid (Wordoku) UI Component
// ──────────────────────────────────────────────

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import clsx from 'clsx';
import { useGlyphGrid } from '../../hooks/useGlyphGrid';

// ─── Types ──────────────────────────────────

interface GlyphGridProps {
  onExit: () => void;
}

// ─── Animation Variants ─────────────────────

const digitVariants: Variants = {
  initial: { opacity: 0, scale: 1.3 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'tween', duration: 0.12, ease: 'easeOut' as const },
  },
  exit: { opacity: 0, scale: 0.7, transition: { duration: 0.08 } },
};

const shakeVariants: Variants = {
  shake: {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.2, ease: 'easeInOut' as const },
  },
  idle: { x: 0 },
};

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

// ─── Helpers ────────────────────────────────

const SIZE = 9;

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function getBoxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

function getPeerKeys(row: number, col: number): Set<string> {
  const keys = new Set<string>();
  for (let c = 0; c < SIZE; c++) if (c !== col) keys.add(cellKey(row, c));
  for (let r = 0; r < SIZE; r++) if (r !== row) keys.add(cellKey(r, col));
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (r !== row || c !== col) keys.add(cellKey(r, c));
    }
  }
  return keys;
}

// ─── Glyph Cell ─────────────────────────────

interface GlyphCellProps {
  value: string | null;
  isGiven: boolean;
  isSelected: boolean;
  isPeer: boolean;
  isMatchingValue: boolean;
  isError: boolean;
  isDiagonal: boolean;
  pencilMarks: Set<string>;
  charMap: readonly string[];
  onClick: () => void;
}

function GlyphCell({
  value,
  isGiven,
  isSelected,
  isPeer,
  isMatchingValue,
  isError,
  isDiagonal,
  pencilMarks,
  charMap,
  onClick,
}: GlyphCellProps) {
  const hasPencilMarks = value === null && pencilMarks.size > 0;

  let bgClass = 'bg-transparent';
  if (isSelected) bgClass = 'bg-[var(--color-accent)]/25';
  else if (isMatchingValue && !isError) bgClass = 'bg-[var(--color-accent)]/15';
  else if (isPeer) bgClass = 'bg-[var(--color-grid-lines)]/30';
  else if (isDiagonal) bgClass = 'bg-white/[0.02]';

  return (
    <motion.button
      className={clsx(
        'relative flex items-center justify-center',
        'w-full h-full outline-none select-none',
        'transition-colors duration-100',
        bgClass,
      )}
      style={{
        color: isError
          ? 'var(--color-error)'
          : isGiven
            ? 'var(--color-primary-text)'
            : 'var(--color-accent)',
      }}
      onClick={onClick}
      variants={shakeVariants}
      animate={isError ? 'shake' : 'idle'}
    >
      <AnimatePresence mode="wait">
        {value !== null && (
          <motion.span
            key={value}
            className={clsx(
              'absolute inset-0 flex items-center justify-center',
              'text-lg font-bold leading-none uppercase',
              isGiven ? 'font-extrabold' : 'font-semibold',
            )}
            variants={digitVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {value}
          </motion.span>
        )}
      </AnimatePresence>

      {hasPencilMarks && (
        <div className="absolute inset-0 flex flex-wrap items-start justify-start p-0.5 gap-0">
          {charMap.map((char) =>
            pencilMarks.has(char) ? (
              <span
                key={char}
                className="text-[0.35rem] leading-none font-medium w-1/3 text-center uppercase"
                style={{ color: 'var(--color-primary-text)', opacity: 0.5 }}
              >
                {char}
              </span>
            ) : (
              <span key={char} className="w-1/3" />
            ),
          )}
        </div>
      )}

      {isSelected && (
        <motion.div
          className="absolute inset-0 border-2 pointer-events-none z-30"
          style={{ borderColor: 'var(--color-accent)' }}
          layoutId="glyph-selection-ring"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </motion.button>
  );
}

// ─── Letter Pad ─────────────────────────────

interface LetterPadProps {
  charMap: readonly string[];
  isPencilMode: boolean;
  onFill: (char: string) => void;
  onClear: () => void;
  onTogglePencil: () => void;
}

function LetterPad({ charMap, isPencilMode, onFill, onClear, onTogglePencil }: LetterPadProps) {
  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-md">
      <div className="grid grid-cols-9 gap-1 w-full">
        {charMap.map((char) => (
          <motion.button
            key={char}
            className={clsx(
              'flex items-center justify-center',
              'aspect-square rounded-lg text-sm font-bold uppercase',
              'border select-none',
            )}
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.08)',
              color: 'var(--color-primary-text)',
            }}
            whileHover={{ scale: 1.08, borderColor: 'rgba(255,255,255,0.25)' }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onFill(char)}
          >
            {char}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <motion.button
          className={clsx(
            'px-4 py-2 rounded-lg text-[0.6rem] font-bold uppercase tracking-widest',
            'border select-none',
          )}
          style={{
            background: isPencilMode ? 'var(--color-accent)' : 'transparent',
            color: isPencilMode ? 'var(--color-background)' : 'rgba(255,255,255,0.4)',
            borderColor: isPencilMode ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)',
          }}
          whileTap={{ scale: 0.95 }}
          onClick={onTogglePencil}
        >
          Pencil
        </motion.button>
        <motion.button
          className="px-4 py-2 rounded-lg text-[0.6rem] font-bold uppercase tracking-widest border border-white/8 text-white/40 select-none"
          whileTap={{ scale: 0.95 }}
          onClick={onClear}
        >
          Clear
        </motion.button>
      </div>
    </div>
  );
}

// ─── Completion Overlay ─────────────────────

function CompletionOverlay({ heterogram, onExit }: { heterogram: string; onExit: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <motion.div
        className="flex flex-col items-center gap-5 px-8 py-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md max-w-xs w-full text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <span
          className="text-2xl font-black tracking-wide"
          style={{ color: 'var(--color-accent)' }}
        >
          GLYPHS ALIGNED
        </span>
        <div className="flex gap-1">
          {heterogram.split('').map((ch, i) => (
            <motion.div
              key={i}
              className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold uppercase"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-background)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.06, type: 'spring', stiffness: 400 }}
            >
              {ch}
            </motion.div>
          ))}
        </div>
        <span className="text-xs text-white/30 uppercase tracking-widest">
          Diagonal Word
        </span>
        <motion.button
          className="w-full py-3 rounded-lg border border-white/10 text-sm font-bold text-white/60"
          whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.3)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onExit}
        >
          Back to Lobby
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────

export function GlyphGrid({ onExit }: GlyphGridProps) {
  const {
    currentGrid,
    selectedCell,
    isPencilMode,
    errors,
    isComplete,
    charMap,
    heterogram,
    selectCell,
    fillCell,
    clearCell,
    togglePencil,
    resetGame,
  } = useGlyphGrid();

  const containerRef = useRef<HTMLDivElement>(null);

  // Derived
  const peerKeys = selectedCell
    ? getPeerKeys(selectedCell.row, selectedCell.col)
    : new Set<string>();

  const selectedValue = selectedCell
    ? currentGrid[selectedCell.row][selectedCell.col].value
    : null;

  // Keyboard handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta: Record<string, [number, number]> = {
          ArrowUp: [-1, 0],
          ArrowDown: [1, 0],
          ArrowLeft: [0, -1],
          ArrowRight: [0, 1],
        };
        const [dr, dc] = delta[e.key];
        selectCell(
          Math.max(0, Math.min(8, selectedCell.row + dr)),
          Math.max(0, Math.min(8, selectedCell.col + dc)),
        );
        return;
      }

      const upper = e.key.toUpperCase();
      if (charMap.includes(upper)) {
        e.preventDefault();
        fillCell(upper);
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        clearCell();
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePencil();
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, charMap, selectCell, fillCell, clearCell, togglePencil]);

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
          Glyph Grid
        </h1>
        <span
          className="text-[0.55rem] uppercase tracking-widest"
          style={{ color: 'var(--color-accent)', opacity: 0.5 }}
        >
          {heterogram}
        </span>
      </header>

      {/* Grid */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 pb-4">
        <div
          ref={containerRef}
          tabIndex={0}
          className="grid grid-cols-9 grid-rows-9 border-2 rounded-sm outline-none"
          style={{
            borderColor: 'var(--color-grid-lines)',
            width: 'min(90vw, 90vh, 450px)',
            height: 'min(90vw, 90vh, 450px)',
          }}
        >
          {currentGrid.map((rowCells, r) =>
            rowCells.map((cell, c) => {
              const key = cellKey(r, c);
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const isPeer = !isSelected && peerKeys.has(key);
              const isMatchingValue = !isSelected && selectedValue !== null && cell.value === selectedValue;
              const isError = errors.has(key);
              const isDiagonal = r === c;
              const isBoxRight = c === 2 || c === 5;
              const isBoxBottom = r === 2 || r === 5;
              const isLastCol = c === 8;
              const isLastRow = r === 8;

              return (
                <div
                  key={key}
                  className={clsx(
                    'relative',
                    !isLastCol && isBoxRight && 'border-r-[3px]',
                    !isLastCol && !isBoxRight && 'border-r',
                    !isLastRow && isBoxBottom && 'border-b-[3px]',
                    !isLastRow && !isBoxBottom && 'border-b',
                  )}
                  style={{ borderColor: 'var(--color-grid-lines)' }}
                >
                  <GlyphCell
                    value={cell.value}
                    isGiven={cell.isGiven}
                    isSelected={isSelected}
                    isPeer={isPeer}
                    isMatchingValue={isMatchingValue}
                    isError={isError}
                    isDiagonal={isDiagonal}
                    pencilMarks={cell.pencilMarks}
                    charMap={charMap as unknown as readonly string[]}
                    onClick={() => selectCell(r, c)}
                  />
                </div>
              );
            }),
          )}
        </div>

        {/* Letter Pad */}
        <LetterPad
          charMap={charMap}
          isPencilMode={isPencilMode}
          onFill={fillCell}
          onClear={clearCell}
          onTogglePencil={togglePencil}
        />
      </div>

      {/* Completion */}
      <AnimatePresence>
        {isComplete && <CompletionOverlay heterogram={heterogram} onExit={onExit} />}
      </AnimatePresence>
    </div>
  );
}
