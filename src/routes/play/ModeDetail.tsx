// ──────────────────────────────────────────────
// S-10 — Mode Detail (Premium — Difficulty Slider)
//
// Single screen: mode info + difficulty slider +
// play offline / play PvP. Difficulty chosen once
// via animated slider, then play.
// ──────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { getModeById } from '../../lib/gameModesData';
import { ENTRY_FEES, TIME_LIMITS, TROPHY_DELTAS } from '../../lib/economy';

// ─── Difficulty config ─────────────────────

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   color: '#34C759', desc: 'Relaxed pace, gentle puzzles' },
  { id: 'medium', label: 'Medium', color: '#F59E0B', desc: 'Balanced challenge' },
  { id: 'hard',   label: 'Hard',   color: '#EF4444', desc: 'Serious brain workout' },
  { id: 'expert', label: 'Expert', color: '#8B5CF6', desc: 'Only for the fearless' },
] as const;

type DifficultyId = typeof DIFFICULTIES[number]['id'];

// ─── Mode colors (shared with PlayHub) ─────

const MODE_COLORS: Record<string, { bg: string; ink: 'white' | 'black' }> = {
  'prime-grid':      { bg: '#4338CA', ink: 'white' },
  'glyph-grid':      { bg: '#0F766E', ink: 'white' },
  'shattered-grid':  { bg: '#B91C1C', ink: 'white' },
  'canvas-fracture': { bg: '#9333EA', ink: 'white' },
  'vault-breaker':   { bg: '#DB2777', ink: 'white' },
  'cipher-scramble': { bg: '#F59E0B', ink: 'black' },
  'lexicon-weave':   { bg: '#1E40AF', ink: 'white' },
  'enigma-weave':    { bg: '#7C2D12', ink: 'white' },
  'interrogation':   { bg: '#EA580C', ink: 'white' },
  'alias-protocol':  { bg: '#E11D48', ink: 'white' },
  'global-override': { bg: '#047857', ink: 'white' },
  'data-sift':       { bg: '#FACC15', ink: 'black' },
  'cinema-lattice':  { bg: '#0369A1', ink: 'white' },
  'chronos-shift':   { bg: '#78350F', ink: 'white' },
};

const CATEGORY_SYMBOL: Record<string, string> = {
  'Core Systems': '◈',
  'The Cyphers':  '⟁',
  'The Archives': '⧖',
  'The Matrices': '⬡',
};

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ─── Mode Detail ───────────────────────────

export default function ModeDetail() {
  const { modeId } = useParams<{ modeId: string }>();
  const navigate = useNavigate();
  const mode = getModeById(modeId ?? '');

  const [difficulty, setDifficulty] = useState<DifficultyId>('medium');

  const diff = useMemo(() => DIFFICULTIES.find((d) => d.id === difficulty)!, [difficulty]);
  const entryFee = ENTRY_FEES[difficulty] ?? 100;
  const timeLimit = TIME_LIMITS[difficulty] ?? 900;
  const trophyDelta = TROPHY_DELTAS[difficulty] ?? { win: 12, loss: 8 };

  if (!mode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span
          className="text-3xl"
          style={{ color: 'var(--text-tertiary)', opacity: 0.4 }}
        >
          ◈
        </span>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
          Mode not found
        </p>
        <button
          className="text-sm font-semibold cursor-pointer"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)', background: 'none', border: 'none' }}
          onClick={() => navigate('/play')}
        >
          ← Back to Play
        </button>
      </div>
    );
  }

  const { bg, ink } = MODE_COLORS[mode.id] ?? { bg: '#111', ink: 'white' as const };
  const fg = ink === 'white' ? '#fff' : '#0a0a0a';
  const fgSoft = ink === 'white' ? 'rgba(255,255,255,0.6)' : 'rgba(10,10,10,0.6)';
  const symbol = CATEGORY_SYMBOL[mode.category] ?? '◈';

  const handlePlay = (type: 'offline' | 'pvp') => {
    if (type === 'offline') {
      navigate(`/play/game/offline-${Date.now().toString(36)}?mode=${modeId}&difficulty=${difficulty}`);
    } else {
      navigate(`/play/matchmaking?mode=${modeId}&difficulty=${difficulty}`);
    }
  };

  return (
    <div className="relative min-h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-lg mx-auto">

        {/* ── Hero Banner ── */}
        <motion.div
          className="relative overflow-hidden"
          style={{ background: bg, padding: '28px 24px 24px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          {/* Watermark */}
          <div
            aria-hidden
            className="absolute -right-4 -top-6 pointer-events-none select-none"
            style={{
              fontSize: '180px',
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              lineHeight: 0.75,
              color: ink === 'white' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              letterSpacing: '-0.05em',
            }}
          >
            {symbol}
          </div>

          {/* Top sheen */}
          <div
            className="absolute top-0 left-6 right-6 h-px"
            style={{ background: ink === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
          />

          {/* Back button */}
          <motion.button
            className="relative z-10 flex items-center gap-2 mb-5 cursor-pointer"
            style={{ background: 'none', border: 'none', padding: 0, color: fgSoft, fontFamily: 'var(--font-body)' }}
            onClick={() => navigate('/play')}
            whileTap={{ scale: 0.96 }}
          >
            <span className="text-sm">←</span>
            <span className="text-[0.7rem] font-semibold">Play</span>
          </motion.button>

          {/* Category pill */}
          <div
            className="relative z-10 inline-flex items-center gap-2 px-3 py-1 mb-3"
            style={{
              border: `1px solid ${ink === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
              borderRadius: '999px',
            }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: fg }} />
            <span
              className="text-[0.55rem] font-semibold uppercase tracking-[0.15em]"
              style={{ color: fg, fontFamily: 'var(--font-body)' }}
            >
              {mode.category}
            </span>
          </div>

          {/* Title */}
          <h1
            className="relative z-10 font-black tracking-[-0.03em] leading-[0.9] mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: fg,
              fontSize: 'clamp(2rem, 7vw, 2.8rem)',
            }}
          >
            {mode.name}
          </h1>

          <p
            className="relative z-10 text-[0.8rem] leading-relaxed max-w-[85%]"
            style={{ color: fgSoft, fontFamily: 'var(--font-body)', fontWeight: 500 }}
          >
            {mode.description}
          </p>

          {/* Meta chips */}
          <div className="relative z-10 flex items-center gap-3 mt-4">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5"
              style={{
                background: ink === 'white' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                borderRadius: '999px',
              }}
            >
              <span className="text-[0.6rem] font-bold" style={{ color: fg, fontFamily: 'var(--font-numeric)' }}>
                {mode.playerCount}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5"
              style={{
                background: ink === 'white' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                borderRadius: '999px',
              }}
            >
              <span className="text-[0.6rem] font-bold" style={{ color: fg, fontFamily: 'var(--font-numeric)' }}>
                ~{mode.avgDuration}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Content ── */}
        <div className="px-5 py-6 flex flex-col gap-5">

          {/* ── Difficulty Slider ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
          >
            <h3
              className="text-[0.6rem] font-bold uppercase tracking-[0.18em] mb-4"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              Difficulty
            </h3>

            {/* Track */}
            <div
              className="relative flex w-full p-1"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {/* Sliding indicator */}
              <motion.div
                className="absolute top-1 bottom-1"
                style={{
                  width: `${100 / DIFFICULTIES.length}%`,
                  background: diff.color,
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: `0 4px 12px ${diff.color}30`,
                }}
                animate={{
                  left: `${(DIFFICULTIES.findIndex((d) => d.id === difficulty) / DIFFICULTIES.length) * 100 + 0.5}%`,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />

              {DIFFICULTIES.map((d) => {
                const isActive = d.id === difficulty;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className="relative z-10 flex-1 py-2.5 text-center cursor-pointer"
                    style={{
                      background: 'none',
                      border: 'none',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: isActive ? '#fff' : 'var(--text-tertiary)',
                      transition: 'color 0.2s',
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            {/* Difficulty info */}
            <AnimatePresence mode="wait">
              <motion.div
                key={difficulty}
                className="flex items-center justify-between mt-3 px-1"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <span
                  className="text-[0.7rem]"
                  style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
                >
                  {diff.desc}
                </span>
                <span
                  className="text-[0.6rem] font-bold tabular-nums"
                  style={{ color: diff.color, fontFamily: 'var(--font-numeric)' }}
                >
                  {Math.floor(timeLimit / 60)}:{String(timeLimit % 60).padStart(2, '0')}
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* ── Stakes Info ── */}
          <motion.div
            className="grid grid-cols-3 gap-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: EASE }}
          >
            <div
              className="flex flex-col items-center py-3"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-numeric)' }}
              >
                {entryFee}
              </span>
              <span
                className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] mt-0.5"
                style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
              >
                Entry Fee
              </span>
            </div>
            <div
              className="flex flex-col items-center py-3"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: '#34C759', fontFamily: 'var(--font-numeric)' }}
              >
                +{trophyDelta.win}
              </span>
              <span
                className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] mt-0.5"
                style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
              >
                Win
              </span>
            </div>
            <div
              className="flex flex-col items-center py-3"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: '#EF4444', fontFamily: 'var(--font-numeric)' }}
              >
                -{trophyDelta.loss}
              </span>
              <span
                className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] mt-0.5"
                style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
              >
                Loss
              </span>
            </div>
          </motion.div>

          {/* ── Rules ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: EASE }}
          >
            <h3
              className="text-[0.6rem] font-bold uppercase tracking-[0.18em] mb-3"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              How to Play
            </h3>
            <div
              className="flex flex-col gap-2.5"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
              }}
            >
              {mode.rules.map((rule, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                >
                  <span
                    className="shrink-0 w-5 h-5 flex items-center justify-center text-[0.6rem] font-bold tabular-nums"
                    style={{
                      background: `${diff.color}15`,
                      color: diff.color,
                      borderRadius: 'var(--radius-xs)',
                      fontFamily: 'var(--font-numeric)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="text-[0.75rem] leading-relaxed"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
                  >
                    {rule}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Play Buttons ── */}
          <motion.div
            className="flex flex-col gap-3 pb-16"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: EASE }}
          >
            {/* Solo */}
            <motion.button
              className="w-full py-4 cursor-pointer relative overflow-hidden"
              style={{
                background: diff.color,
                border: 'none',
                borderRadius: 'var(--radius-md)',
              }}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePlay('offline')}
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                <span className="text-lg" style={{ lineHeight: 1 }}>◈</span>
                <span
                  className="text-[0.8rem] font-black uppercase tracking-[0.08em]"
                  style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
                >
                  Play Solo
                </span>
              </div>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                }}
              />
            </motion.button>

            {/* PvP */}
            <motion.button
              className="w-full py-4 cursor-pointer"
              style={{
                background: 'none',
                border: '2px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
              }}
              whileHover={{ y: -2, borderColor: 'var(--accent-primary)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePlay('pvp')}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg" style={{ lineHeight: 1, color: 'var(--accent-primary)' }}>⚡</span>
                <span
                  className="text-[0.8rem] font-black uppercase tracking-[0.08em]"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                >
                  Play PvP
                </span>
                <span
                  className="text-[0.55rem] font-bold tabular-nums px-2 py-0.5"
                  style={{
                    background: 'rgba(108, 99, 255, 0.1)',
                    color: 'var(--accent-primary)',
                    borderRadius: 'var(--radius-full)',
                    fontFamily: 'var(--font-numeric)',
                  }}
                >
                  {entryFee} coins
                </span>
              </div>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
