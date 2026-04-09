// ──────────────────────────────────────────────
// S-17 — Daily Challenge
// Streak counter, today's puzzle, daily leaderboard
// ──────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Accents ─────────────────────────────────

const LIME = 'var(--accent-success)';
const LIME_HEX = '#aaff00';

// ─── Mock Data ───────────────────────────────

const TODAY = {
  number: '#048',
  mode: 'Prime Grid',
  modeId: 'prime-grid',
  difficulty: 'Operative',
  description: 'Identify all prime numbers in a 6×6 grid before the timer expires.',
  timeLimit: '5:00',
  bestToday: '2:14',
  participants: 312,
};

const STREAK = {
  current: 12,
  best: 18,
  lastPlayed: '2026-03-27',
};

const DAILY_LEADERBOARD = [
  { rank: 1, username: 'VECTOR_7', time: '2:14', score: 2840 },
  { rank: 2, username: 'CIPHER_X', time: '2:31', score: 2650 },
  { rank: 3, username: 'NOVA_PRIME', time: '2:48', score: 2420 },
  { rank: 4, username: 'SHADOW_9', time: '3:05', score: 2180 },
  { rank: 5, username: 'ZERO_1', time: '3:22', score: 1950 },
  { rank: 6, username: 'SPECTRAL_07', time: '3:41', score: 1780 },
  { rank: 7, username: 'PHANTOM_X', time: '4:12', score: 1520, isSelf: true },
  { rank: 8, username: 'AXIOM_4', time: '4:38', score: 1320 },
];

const PODIUM = ['#c9a84c', '#c0c0c0', '#cd7f32'];

// ─── Component ───────────────────────────────

export default function DailyChallenge() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);

  const handleStart = useCallback(() => {
    setStarted(true);
    setTimeout(() => {
      navigate(`/play/matchmaking?mode=${TODAY.modeId}&daily=true`);
    }, 800);
  }, [navigate]);

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'var(--bg-primary)',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <motion.button
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors mb-6 cursor-pointer"
          onClick={() => navigate('/play')}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.96 }}
        >
          ← Play Hub
        </motion.button>

        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[0.45rem] uppercase tracking-[0.3em] text-white/20 mb-1">
            Daily Challenge
          </p>
          <h1
            className="text-3xl font-black uppercase tracking-[0.15em] mb-1"
            style={{ fontFamily: 'var(--font-primary)', color: LIME_HEX }}
          >
            {TODAY.number}
          </h1>
          <p className="text-[0.5rem] uppercase tracking-[0.25em] text-white/25">
            {TODAY.mode} · {TODAY.difficulty}
          </p>
        </motion.div>

        {/* Streak Card */}
        <motion.div
          className="relative overflow-hidden mb-6"
          style={{
            background: 'var(--bg-surface)',
            border: `2px solid ${LIME_HEX}`,
            boxShadow: 'var(--shadow-lg)',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(135deg, ${LIME_HEX}06, transparent 60%)` }}
          />
          <div className="relative flex items-center justify-between px-6 py-5">
            <div className="flex flex-col items-center">
              <motion.span
                className="text-4xl font-black tabular-nums"
                style={{ fontFamily: 'var(--font-primary)', color: LIME_HEX }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              >
                {STREAK.current}
              </motion.span>
              <span className="text-[0.45rem] uppercase tracking-[0.25em] text-white/25">
                Day Streak
              </span>
            </div>

            {/* Streak dots */}
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => {
                const active = i < Math.min(STREAK.current, 7);
                return (
                  <motion.div
                    key={i}
                    className="w-3 h-3"
                    style={{
                      background: active ? LIME_HEX : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${active ? LIME_HEX : 'rgba(255,255,255,0.08)'}`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  />
                );
              })}
            </div>

            <div className="flex flex-col items-center">
              <span
                className="text-lg font-black tabular-nums"
                style={{ fontFamily: 'var(--font-primary)', color: 'rgba(255,255,255,0.25)' }}
              >
                {STREAK.best}
              </span>
              <span className="text-[0.4rem] uppercase tracking-[0.2em] text-white/15">
                Best
              </span>
            </div>
          </div>
        </motion.div>

        {/* Today's Challenge Info */}
        <motion.div
          className="mb-6 px-5 py-4"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-white/40 mb-3 leading-relaxed">
            {TODAY.description}
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-[0.4rem] uppercase tracking-[0.2em] text-white/15 block mb-0.5">
                Time Limit
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-primary)', color: LIME_HEX }}
              >
                {TODAY.timeLimit}
              </span>
            </div>
            <div>
              <span className="text-[0.4rem] uppercase tracking-[0.2em] text-white/15 block mb-0.5">
                Best Today
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-primary)', color: '#c9a84c' }}
              >
                {TODAY.bestToday}
              </span>
            </div>
            <div>
              <span className="text-[0.4rem] uppercase tracking-[0.2em] text-white/15 block mb-0.5">
                Players
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-primary)', color: 'rgba(255,255,255,0.4)' }}
              >
                {TODAY.participants}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Start Button */}
        <AnimatePresence mode="wait">
          {!started ? (
            <motion.button
              key="start"
              onClick={handleStart}
              className="w-full py-4 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer mb-8"
              style={{
                fontFamily: 'var(--font-primary)',
                background: LIME_HEX,
                color: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-md)',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.3 }}
              whileHover={{ boxShadow: 'var(--shadow-lg)', y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Today's Challenge
            </motion.button>
          ) : (
            <motion.div
              key="launching"
              className="w-full py-4 text-center text-sm font-bold uppercase tracking-[0.15em] mb-8"
              style={{
                fontFamily: 'var(--font-primary)',
                color: LIME_HEX,
                border: `2px solid ${LIME_HEX}`,
                boxShadow: 'var(--shadow-md)',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              Launching…
            </motion.div>
          )}
        </AnimatePresence>

        {/* Daily Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c9a84c' }} />
            <h2
              className="text-[0.55rem] font-bold uppercase tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-primary)', color: '#c9a84c99' }}
            >
              Today's Leaderboard
            </h2>
          </div>

          {/* Table header */}
          <div
            className="grid items-center gap-2 px-5 py-2 text-[0.4rem] uppercase tracking-[0.25em] text-white/20"
            style={{ gridTemplateColumns: '1.5rem 1fr 3.5rem 3.5rem' }}
          >
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Time</span>
            <span className="text-right">Score</span>
          </div>

          <div className="flex flex-col gap-1">
            {DAILY_LEADERBOARD.map((entry, i) => {
              const podiumColor = entry.rank <= 3 ? PODIUM[entry.rank - 1] : undefined;
              return (
                <motion.div
                  key={entry.username}
                  className="grid items-center gap-2 px-5 py-3"
                  style={{
                    gridTemplateColumns: '1.5rem 1fr 3.5rem 3.5rem',
                    background: entry.isSelf ? `${LIME_HEX}08` : 'var(--bg-surface)',
                    border: entry.isSelf
                      ? `2px solid ${LIME_HEX}`
                      : `1px solid ${podiumColor ? `${podiumColor}20` : 'rgba(255,255,255,0.03)'}`,
                    boxShadow: entry.isSelf ? 'var(--shadow-md)' : 'none',
                  }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.04 }}
                >
                  <span
                    className="text-xs font-black tabular-nums"
                    style={{ fontFamily: 'var(--font-primary)', color: podiumColor ?? 'rgba(255,255,255,0.2)' }}
                  >
                    {entry.rank}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-xs font-bold uppercase tracking-[0.08em] truncate"
                      style={{
                        fontFamily: 'var(--font-primary)',
                        color: entry.isSelf ? LIME_HEX : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {entry.username}
                    </span>
                    {entry.isSelf && (
                      <span
                        className="text-[0.35rem] uppercase px-1 py-0.5"
                        style={{ color: LIME_HEX, border: `1px solid ${LIME_HEX}40` }}
                      >
                        You
                      </span>
                    )}
                  </div>
                  <span className="text-[0.5rem] tabular-nums text-right text-white/25">
                    {entry.time}
                  </span>
                  <span
                    className="text-[0.6rem] font-bold tabular-nums text-right"
                    style={{ fontFamily: 'var(--font-primary)', color: podiumColor ?? LIME_HEX }}
                  >
                    {entry.score.toLocaleString()}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
