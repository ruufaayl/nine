// ──────────────────────────────────────────────
// NINE — Vault Breaker (Wordle) UI Component
// ──────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import clsx from 'clsx';
import {
  useVaultBreaker,
  type KeyboardLetterState,
} from '../../hooks/useVaultBreaker';
import type { VaultGuessResult, VaultSlotState } from '../../types/expanded_games';

// ─── Types ──────────────────────────────────

interface VaultBreakerProps {
  onExit: () => void;
}

// ─── Constants ──────────────────────────────

const MAX_ROWS = 6;
const WORD_LENGTH = 5;

const KEYBOARD_ROWS: readonly string[][] = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

const FLIP_DURATION = 0.3;
const FLIP_STAGGER = 0.15;

// ─── Slot → Color Mapping ───────────────────

function slotBackground(slot: VaultSlotState): string {
  switch (slot) {
    case 'correct_placement':
      return 'var(--color-accent)';
    case 'wrong_placement':
      return '#b59f3b';
    case 'not_in_word':
      return 'rgba(255,255,255,0.08)';
  }
}

function slotTextColor(slot: VaultSlotState): string {
  switch (slot) {
    case 'correct_placement':
      return 'var(--color-background)';
    case 'wrong_placement':
      return '#1a1a1a';
    case 'not_in_word':
      return 'rgba(255,255,255,0.5)';
  }
}

function keyboardKeyBackground(state: KeyboardLetterState): string {
  switch (state) {
    case 'correct':
      return 'var(--color-accent)';
    case 'present':
      return '#b59f3b';
    case 'absent':
      return 'rgba(255,255,255,0.04)';
    case 'unused':
      return 'rgba(255,255,255,0.1)';
  }
}

function keyboardKeyColor(state: KeyboardLetterState): string {
  switch (state) {
    case 'correct':
      return 'var(--color-background)';
    case 'present':
      return '#1a1a1a';
    case 'absent':
      return 'rgba(255,255,255,0.2)';
    case 'unused':
      return 'rgba(255,255,255,0.8)';
  }
}

// ─── Animation Variants ─────────────────────

const popVariants: Variants = {
  idle: { scale: 1 },
  pop: {
    scale: [1.1, 1],
    transition: { duration: 0.1, ease: 'easeOut' as const },
  },
};

const shakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.2, ease: 'easeInOut' as const },
  },
};

// ─── Flip Cell ──────────────────────────────

interface FlipCellProps {
  letter: string;
  slot: VaultSlotState;
  delay: number;
  /** Whether the flip animation should play. */
  animate: boolean;
}

function FlipCell({ letter, slot, delay, animate }: FlipCellProps) {
  const [flipped, setFlipped] = useState(!animate);

  useEffect(() => {
    if (!animate) {
      setFlipped(true);
      return;
    }
    setFlipped(false);
    const timer = setTimeout(() => setFlipped(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [animate, delay]);

  return (
    <div
      className="relative w-14 h-14 sm:w-[3.75rem] sm:h-[3.75rem]"
      style={{ perspective: '600px' }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          rotateX: flipped ? 0 : 90,
        }}
        initial={{ rotateX: animate ? 0 : 0 }}
        transition={{
          duration: FLIP_DURATION,
          delay: animate && !flipped ? delay : 0,
          ease: [0.45, 0.05, 0.55, 0.95] as const,
        }}
      >
        {/* Front face (pre-flip: shows letter on neutral bg) */}
        <div
          className={clsx(
            'absolute inset-0 flex items-center justify-center',
            'rounded-lg text-xl font-bold uppercase',
            'border border-white/10',
            'backface-hidden',
          )}
          style={{
            background: flipped ? slotBackground(slot) : 'rgba(255,255,255,0.05)',
            color: flipped ? slotTextColor(slot) : 'var(--color-primary-text)',
            backfaceVisibility: 'hidden',
          }}
        >
          {letter}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Empty / Active Cell ────────────────────

interface ActiveCellProps {
  letter: string | null;
  hasBorder: boolean;
  pop: boolean;
}

function ActiveCell({ letter, hasBorder, pop }: ActiveCellProps) {
  return (
    <motion.div
      className={clsx(
        'flex items-center justify-center',
        'w-14 h-14 sm:w-[3.75rem] sm:h-[3.75rem]',
        'rounded-lg text-xl font-bold uppercase',
        'border',
      )}
      style={{
        background: letter ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        borderColor: letter
          ? 'rgba(255,255,255,0.25)'
          : hasBorder
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(255,255,255,0.04)',
        color: 'var(--color-primary-text)',
      }}
      variants={popVariants}
      animate={pop ? 'pop' : 'idle'}
    >
      {letter}
    </motion.div>
  );
}

// ─── Guess Row (Submitted) ──────────────────

interface SubmittedRowProps {
  guess: VaultGuessResult;
  animate: boolean;
}

function SubmittedRow({ guess, animate }: SubmittedRowProps) {
  return (
    <div className="flex gap-1.5 justify-center">
      {guess.guess.split('').map((letter, i) => (
        <FlipCell
          key={i}
          letter={letter}
          slot={guess.slots[i]}
          delay={i * FLIP_STAGGER}
          animate={animate}
        />
      ))}
    </div>
  );
}

// ─── Current Input Row ──────────────────────

interface CurrentRowProps {
  currentGuess: string;
  wordLength: number;
  shake: boolean;
  onShakeComplete: () => void;
}

function CurrentRow({ currentGuess, wordLength, shake, onShakeComplete }: CurrentRowProps) {
  return (
    <motion.div
      className="flex gap-1.5 justify-center"
      variants={shakeVariants}
      animate={shake ? 'shake' : 'idle'}
      onAnimationComplete={() => {
        if (shake) onShakeComplete();
      }}
    >
      {Array.from({ length: wordLength }, (_, i) => {
        const letter = currentGuess[i] ?? null;
        const isNew = i === currentGuess.length - 1 && letter !== null;
        return (
          <ActiveCell
            key={i}
            letter={letter}
            hasBorder={i < currentGuess.length}
            pop={isNew}
          />
        );
      })}
    </motion.div>
  );
}

// ─── Empty Row ──────────────────────────────

function EmptyRow({ wordLength }: { wordLength: number }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {Array.from({ length: wordLength }, (_, i) => (
        <div
          key={i}
          className={clsx(
            'w-14 h-14 sm:w-[3.75rem] sm:h-[3.75rem]',
            'rounded-lg border border-white/[0.04]',
            'bg-white/[0.02]',
          )}
        />
      ))}
    </div>
  );
}

// ─── Virtual Keyboard ───────────────────────

interface KeyboardProps {
  keyboardState: Map<string, KeyboardLetterState>;
  onKey: (key: string) => void;
}

function VaultKeyboard({ keyboardState, onKey }: KeyboardProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-lg mx-auto">
      {KEYBOARD_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1 justify-center w-full">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'BACK';
            const letterState = keyboardState.get(key) ?? 'unused';

            return (
              <motion.button
                key={key}
                className={clsx(
                  'flex items-center justify-center',
                  'rounded-md font-bold uppercase select-none',
                  'outline-none focus-visible:ring-1 focus-visible:ring-white/20',
                  isSpecial
                    ? 'px-3 sm:px-4 h-12 text-[0.65rem] tracking-wider min-w-[3.2rem]'
                    : 'w-8 sm:w-9 h-12 text-sm',
                )}
                style={{
                  background: isSpecial
                    ? 'rgba(255,255,255,0.1)'
                    : keyboardKeyBackground(letterState),
                  color: isSpecial
                    ? 'rgba(255,255,255,0.7)'
                    : keyboardKeyColor(letterState),
                }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                transition={{
                  type: 'spring' as const,
                  stiffness: 500,
                  damping: 30,
                }}
                onClick={() => onKey(key)}
                aria-label={
                  key === 'BACK'
                    ? 'Delete letter'
                    : key === 'ENTER'
                      ? 'Submit guess'
                      : key
                }
              >
                {key === 'BACK' ? (
                  <svg
                    width="20"
                    height="16"
                    viewBox="0 0 20 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 1L1 8L7 15H19V1H7Z" />
                    <path d="M11 5.5L15 10.5" />
                    <path d="M15 5.5L11 10.5" />
                  </svg>
                ) : (
                  key
                )}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Game Over Overlay ──────────────────────

interface OverlayProps {
  status: 'won' | 'lost';
  targetWord: string;
  guessCount: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

function GameOverOverlay({ status, targetWord, guessCount, onPlayAgain, onExit }: OverlayProps) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: status === 'won' ? WORD_LENGTH * FLIP_STAGGER + FLIP_DURATION + 0.3 : 0.5, duration: 0.4 }}
    >
      <motion.div
        className="flex flex-col items-center gap-5 px-8 py-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md max-w-xs w-full text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: status === 'won' ? WORD_LENGTH * FLIP_STAGGER + FLIP_DURATION + 0.4 : 0.6, duration: 0.3 }}
      >
        <div className="flex flex-col gap-1">
          <span
            className="text-2xl font-black tracking-wide"
            style={{
              color: status === 'won' ? 'var(--color-accent)' : 'var(--color-error)',
            }}
          >
            {status === 'won' ? 'VAULT CRACKED' : 'VAULT SEALED'}
          </span>
          <span className="text-xs text-white/40 uppercase tracking-widest">
            {status === 'won'
              ? `Solved in ${guessCount} ${guessCount === 1 ? 'attempt' : 'attempts'}`
              : 'Combination expired'}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[0.6rem] uppercase tracking-[0.2em] text-white/30">
            The code was
          </span>
          <div className="flex gap-1">
            {targetWord.split('').map((letter, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-md flex items-center justify-center text-lg font-bold"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-background)',
                }}
              >
                {letter}
              </div>
            ))}
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
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-background)',
            }}
            whileHover={{ scale: 1.03, opacity: 0.9 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPlayAgain}
          >
            Again
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────

export function VaultBreaker({ onExit }: VaultBreakerProps) {
  const {
    targetWord,
    guesses,
    currentGuess,
    gameStatus,
    maxGuesses,
    wordLength,
    shakeRow,
    lastSubmittedRow,
    keyboardState,
    addLetter,
    removeLetter,
    submitGuess,
    clearShake,
    resetGame,
  } = useVaultBreaker(WORD_LENGTH);

  // ── Physical keyboard handler ──
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        submitGuess();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        removeLetter();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        addLetter(e.key);
      }
    },
    [addLetter, removeLetter, submitGuess],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Virtual keyboard handler ──
  const handleVirtualKey = useCallback(
    (key: string) => {
      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACK') {
        removeLetter();
      } else {
        addLetter(key);
      }
    },
    [addLetter, removeLetter, submitGuess],
  );

  // ── Compute row layout ──
  const currentRowIndex = guesses.length;
  const emptyRowsAfterCurrent = maxGuesses - currentRowIndex - 1;

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-[var(--color-background)] overflow-hidden">
      {/* ── Header ── */}
      <header className="w-full max-w-lg flex items-center justify-between px-4 py-4">
        <motion.button
          className="text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
          whileTap={{ scale: 0.95 }}
          onClick={onExit}
          aria-label="Back to lobby"
        >
          ← Lobby
        </motion.button>
        <h1
          className="text-sm font-black uppercase tracking-[0.15em]"
          style={{ color: 'var(--color-primary-text)' }}
        >
          Vault Breaker
        </h1>
        <div className="w-12" /> {/* spacer for alignment */}
      </header>

      {/* ── Grid ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4 pb-4 pt-2">
        {/* Submitted rows */}
        {guesses.map((guess, i) => (
          <SubmittedRow
            key={i}
            guess={guess}
            animate={i === lastSubmittedRow}
          />
        ))}

        {/* Current input row */}
        {gameStatus === 'playing' && (
          <CurrentRow
            currentGuess={currentGuess}
            wordLength={wordLength}
            shake={shakeRow}
            onShakeComplete={clearShake}
          />
        )}

        {/* Empty future rows */}
        {emptyRowsAfterCurrent > 0 &&
          Array.from({ length: Math.max(0, emptyRowsAfterCurrent) }, (_, i) => (
            <EmptyRow key={`empty-${i}`} wordLength={wordLength} />
          ))}
      </div>

      {/* ── Keyboard ── */}
      <div className="w-full px-2 pb-6 pt-2">
        <VaultKeyboard
          keyboardState={keyboardState}
          onKey={handleVirtualKey}
        />
      </div>

      {/* ── Game Over ── */}
      <AnimatePresence>
        {gameStatus !== 'playing' && (
          <GameOverOverlay
            status={gameStatus}
            targetWord={targetWord}
            guessCount={guesses.length}
            onPlayAgain={() => resetGame(WORD_LENGTH)}
            onExit={onExit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
