// ──────────────────────────────────────────────
// NINE — Lexicon Weave (Crossword) UI Component
// ──────────────────────────────────────────────

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import clsx from 'clsx';
import { useLexiconWeave } from '../../hooks/useLexiconWeave';
import type { CrosswordClue } from '../../types/trivia_games';

// ─── Types ──────────────────────────────────

interface LexiconWeaveProps {
  onExit: () => void;
}

// ─── Animation Variants ─────────────────────

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

const letterPop: Variants = {
  initial: { opacity: 0, scale: 1.2 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.1, ease: 'easeOut' as const },
  },
};

// ─── Crossword Cell ─────────────────────────

interface CwCellProps {
  type: 'input' | 'void';
  letter: string | null;
  clueNumber: number | null;
  isActive: boolean;
  isActiveWord: boolean;
  isCorrect: boolean;
  isError: boolean;
  onClick: () => void;
}

function CwCell({
  type,
  letter,
  clueNumber,
  isActive,
  isActiveWord,
  isCorrect,
  isError,
  onClick,
}: CwCellProps) {
  if (type === 'void') {
    return (
      <div
        className="w-full aspect-square rounded-[2px]"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />
    );
  }

  let bg = 'rgba(255,255,255,0.03)';
  let borderColor = 'rgba(255,255,255,0.08)';

  if (isActive) {
    bg = 'rgba(255,255,255,0.08)';
    borderColor = 'var(--color-accent)';
  } else if (isActiveWord) {
    bg = 'rgba(255,255,255,0.04)';
    borderColor = 'rgba(255,255,255,0.12)';
  }

  return (
    <motion.button
      className={clsx(
        'relative w-full aspect-square flex items-center justify-center',
        'rounded-[2px] border outline-none select-none',
        'text-sm font-semibold uppercase',
      )}
      style={{
        background: bg,
        borderColor,
        color: isError
          ? 'var(--color-error)'
          : isCorrect
            ? 'var(--color-accent)'
            : 'var(--color-primary-text)',
      }}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
    >
      {/* Clue number */}
      {clueNumber !== null && (
        <span
          className="absolute top-[1px] left-[3px] text-[0.4rem] font-bold leading-none"
          style={{ color: 'var(--color-accent)', opacity: 0.5 }}
        >
          {clueNumber}
        </span>
      )}

      {/* Letter */}
      <AnimatePresence mode="wait">
        {letter && (
          <motion.span
            key={letter}
            variants={letterPop}
            initial="initial"
            animate="animate"
          >
            {letter}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Active ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 border-2 rounded-[2px] pointer-events-none"
          style={{ borderColor: 'var(--color-accent)' }}
          layoutId="cw-active-ring"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}

      {/* Active word tint */}
      {isActiveWord && !isActive && (
        <div
          className="absolute inset-0 rounded-[2px] pointer-events-none"
          style={{ background: 'var(--color-accent)', opacity: 0.06 }}
        />
      )}
    </motion.button>
  );
}

// ─── Clue List ──────────────────────────────

interface ClueListProps {
  title: string;
  clues: readonly CrosswordClue[];
  activeClue: CrosswordClue | null;
  onClueClick: (clue: CrosswordClue) => void;
}

function ClueList({ title, clues, activeClue, onClueClick }: ClueListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active clue
  useEffect(() => {
    if (!activeClue || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-clue="${activeClue.number}-${activeClue.direction}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeClue]);

  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-[0.55rem] uppercase tracking-[0.2em] font-bold"
        style={{ color: 'var(--color-accent)', opacity: 0.5 }}
      >
        {title}
      </span>
      <div
        ref={listRef}
        className="flex flex-col gap-0.5 max-h-[30vh] overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
      >
        {clues.map((clue) => {
          const isActive =
            activeClue?.number === clue.number &&
            activeClue?.direction === clue.direction;

          return (
            <button
              key={`${clue.number}-${clue.direction}`}
              data-clue={`${clue.number}-${clue.direction}`}
              className={clsx(
                'flex gap-2 text-left py-1.5 px-2 rounded-md transition-colors',
                'outline-none select-none',
              )}
              style={{
                background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
              }}
              onClick={() => onClueClick(clue)}
            >
              <span
                className="text-xs font-bold tabular-nums shrink-0 w-5"
                style={{
                  color: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)',
                }}
              >
                {clue.number}
              </span>
              <span
                className="text-xs leading-snug"
                style={{
                  color: isActive ? 'var(--color-primary-text)' : 'rgba(255,255,255,0.4)',
                }}
              >
                {clue.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────

export function LexiconWeave({ onExit }: LexiconWeaveProps) {
  const {
    grid,
    width,
    height,
    focusRow,
    focusCol,
    focusDirection,
    correctCells,
    errorCells,
    isComplete,
    score,
    activeClue,
    activeWordCells,
    acrossClues,
    downClues,
    selectCell,
    typeLetter,
    deleteLetter,
    toggleDirection,
    checkErrors,
    resetGame,
  } = useLexiconWeave();

  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === ' ') {
        e.preventDefault();
        toggleDirection();
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const delta: Record<string, [number, number]> = {
          ArrowUp: [-1, 0],
          ArrowDown: [1, 0],
          ArrowLeft: [0, -1],
          ArrowRight: [0, 1],
        };
        const [dr, dc] = delta[e.key];
        const nr = Math.max(0, Math.min(height - 1, focusRow + dr));
        const nc = Math.max(0, Math.min(width - 1, focusCol + dc));
        selectCell(nr, nc);
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        typeLetter(e.key);
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteLetter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusRow, focusCol, width, height, selectCell, typeLetter, deleteLetter, toggleDirection]);

  const handleClueClick = useCallback(
    (clue: CrosswordClue) => {
      selectCell(clue.startRow, clue.startCol);
    },
    [selectCell],
  );

  return (
    <div
      className="relative flex flex-col min-h-screen overflow-hidden"
      style={{ background: 'var(--color-background)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
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
          Lexicon Weave
        </h1>
        <div className="flex gap-2 items-center">
          <span className="text-xs tabular-nums text-white/30">{score} pts</span>
          <span
            className="text-[0.5rem] uppercase tracking-widest px-2 py-1 rounded border border-white/10 text-white/40 cursor-pointer select-none"
            onClick={toggleDirection}
          >
            {focusDirection}
          </span>
        </div>
      </header>

      {/* Content: Grid + Clues */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 px-4 pb-4">
        {/* Grid */}
        <div className="flex items-start justify-center lg:flex-1" ref={containerRef}>
          <div
            className="grid gap-[1px] rounded-sm overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${width}, 1fr)`,
              gridTemplateRows: `repeat(${height}, 1fr)`,
              background: 'rgba(255,255,255,0.03)',
              width: `min(90vw, ${width * 36}px)`,
              aspectRatio: `${width} / ${height}`,
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r},${c}`;
                const isActive = r === focusRow && c === focusCol;
                const isActiveWord = activeWordCells.has(key);
                const isCorrect = correctCells.has(key);
                const isError = errorCells.has(key);

                return (
                  <CwCell
                    key={key}
                    type={cell.type}
                    letter={cell.playerValue}
                    clueNumber={cell.clueNumber}
                    isActive={isActive}
                    isActiveWord={isActiveWord}
                    isCorrect={isCorrect}
                    isError={isError}
                    onClick={() => selectCell(r, c)}
                  />
                );
              }),
            )}
          </div>
        </div>

        {/* Clue Panel */}
        <div className="lg:w-64 flex flex-col gap-4 px-1">
          <ClueList
            title="Across"
            clues={acrossClues}
            activeClue={activeClue?.direction === 'across' ? activeClue : null}
            onClueClick={handleClueClick}
          />
          <ClueList
            title="Down"
            clues={downClues}
            activeClue={activeClue?.direction === 'down' ? activeClue : null}
            onClueClick={handleClueClick}
          />

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            <motion.button
              className="px-3 py-2 rounded-lg text-[0.55rem] font-bold uppercase tracking-widest border border-white/8 text-white/30"
              whileTap={{ scale: 0.95 }}
              onClick={checkErrors}
            >
              Check
            </motion.button>
            <motion.button
              className="px-3 py-2 rounded-lg text-[0.55rem] font-bold uppercase tracking-widest border border-white/8 text-white/30"
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
            >
              Reset
            </motion.button>
          </div>
        </div>
      </div>

      {/* Completion Overlay */}
      <AnimatePresence>
        {isComplete && (
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
                LEXICON COMPLETE
              </span>
              <motion.span
                className="text-4xl font-black tabular-nums"
                style={{ color: 'var(--color-accent)' }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
              >
                {score}
              </motion.span>
              <span className="text-xs text-white/30 uppercase tracking-widest">Points</span>
              <motion.button
                className="w-full py-3 rounded-lg border border-white/10 text-sm font-bold text-white/60"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onExit}
              >
                Back to Lobby
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
