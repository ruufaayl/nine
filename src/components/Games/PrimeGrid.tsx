// ──────────────────────────────────────────────
// NINE — Prime Grid (Mode Entry)
// Offline + PvP flow with difficulty + entry fee
// ──────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { GameScreen } from '../Game/GameScreen';
import { PrimeGridPvP } from '../Game/PrimeGridPvP';
import { ENTRY_FEES } from '../../lib/economy';
import type { Difficulty } from '../../types/game';

// ─── Types ──────────────────────────────────

type Phase = 'select' | 'offline' | 'pvp-search' | 'pvp-game';

interface PrimeGridProps {
  onExit: () => void;
}

const DIFFICULTIES: { key: Difficulty; label: string; desc: string }[] = [
  { key: 'easy',   label: 'Easy',   desc: '36-40 empty cells' },
  { key: 'medium', label: 'Medium', desc: '41-48 empty cells' },
  { key: 'hard',   label: 'Hard',   desc: '49-53 empty cells' },
  { key: 'expert', label: 'Expert', desc: '54-58 empty cells' },
];

// ─── Main Component ─────────────────────────

export function PrimeGrid({ onExit }: PrimeGridProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const goToSelect = useCallback(() => setPhase('select'), []);

  // ── Offline Game ──
  if (phase === 'offline') {
    return <GameScreen difficulty={difficulty} onExit={goToSelect} />;
  }

  // ── PvP Game (handles full lifecycle: search → found → ready → countdown → play → result) ──
  if (phase === 'pvp-game') {
    return <PrimeGridPvP difficulty={difficulty} onExit={goToSelect} />;
  }

  // ── Selection Screen ──
  return (
    <div
      className="relative flex flex-col items-center min-h-screen px-5 py-8"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Header */}
      <motion.header
        className="flex flex-col items-center gap-2 mb-10 select-none"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1
          className="text-4xl font-black tracking-[-0.02em]"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
        >
          Prime Grid
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Classic 9×9 Sudoku
        </p>
      </motion.header>

      {/* Difficulty Selector */}
      <motion.div
        className="w-full max-w-md mb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <p
          className="text-xs font-semibold mb-3"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}
        >
          Difficulty
        </p>
        <div className="grid grid-cols-4 gap-2">
          {DIFFICULTIES.map((d) => {
            const isActive = difficulty === d.key;
            return (
              <motion.button
                key={d.key}
                className={clsx(
                  'flex flex-col items-center gap-1 py-3 px-2',
                  'outline-none cursor-pointer select-none',
                  'transition-all duration-200',
                )}
                style={{
                  fontFamily: 'var(--font-primary)',
                  background: isActive ? 'rgba(108, 99, 255, 0.12)' : 'var(--bg-card)',
                  border: isActive
                    ? '1px solid rgba(108, 99, 255, 0.3)'
                    : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDifficulty(d.key)}
              >
                <span className="text-sm font-semibold">{d.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Mode Selection Cards */}
      <motion.div
        className="flex flex-col gap-3 w-full max-w-md"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {/* Play Offline */}
        <motion.button
          className={clsx(
            'group relative flex items-center gap-4',
            'w-full p-5 text-left',
            'outline-none cursor-pointer',
          )}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            fontFamily: 'var(--font-primary)',
          }}
          whileHover={{
            background: 'var(--bg-card-hover)',
            borderColor: 'var(--border-default)',
            y: -1,
          }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setPhase('offline')}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(78, 205, 196, 0.1)',
              border: '1px solid rgba(78, 205, 196, 0.2)',
            }}
          >
            <span className="text-xl">🧩</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Play Offline
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Solo mode — solve at your own pace. No entry fee.
            </span>
          </div>
          <span className="ml-auto text-lg opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
            →
          </span>
        </motion.button>

        {/* Play PvP */}
        <motion.button
          className={clsx(
            'group relative flex items-center gap-4',
            'w-full p-5 text-left',
            'outline-none cursor-pointer',
          )}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            fontFamily: 'var(--font-primary)',
          }}
          whileHover={{
            background: 'var(--bg-card-hover)',
            borderColor: 'var(--border-default)',
            y: -1,
          }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setPhase('pvp-search')}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(108, 99, 255, 0.1)',
              border: '1px solid rgba(108, 99, 255, 0.2)',
            }}
          >
            <span className="text-xl">⚡</span>
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Play PvP
              </span>
              <span className="pill pill-accent" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>
                1v1
              </span>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Search for an opponent. Entry: {ENTRY_FEES[difficulty]} coins
            </span>
          </div>
          <span className="ml-auto text-lg opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
            →
          </span>
        </motion.button>
      </motion.div>

      {/* Back */}
      <motion.button
        className="mt-8 text-sm font-medium cursor-pointer"
        style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}
        whileHover={{ color: 'var(--text-secondary)' }}
        whileTap={{ scale: 0.95 }}
        onClick={onExit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        ← Back
      </motion.button>
    </div>
  );
}
