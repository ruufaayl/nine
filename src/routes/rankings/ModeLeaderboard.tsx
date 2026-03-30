// ──────────────────────────────────────────────
// S-24 — Mode Leaderboard (top scores by mode)
// ──────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { GAME_MODES, CATEGORY_ACCENTS } from '../../lib/gameModesData';

const RANK_GOLD = '#c9a84c';

interface ModeScore {
  username: string;
  score: number;
  time: string;
  date: string;
}

const MOCK_SCORES: Record<string, ModeScore[]> = {
  'prime-grid': [
    { username: 'VECTOR_7', score: 2450, time: '3:12', date: '2026-03-27' },
    { username: 'CIPHER_X', score: 2280, time: '3:48', date: '2026-03-26' },
    { username: 'SHADOW_9', score: 1980, time: '4:22', date: '2026-03-27' },
    { username: 'SPECTRAL_07', score: 1820, time: '5:01', date: '2026-03-25' },
    { username: 'PHANTOM_X', score: 1420, time: '6:32', date: '2026-03-28' },
    { username: 'ZERO_1', score: 1350, time: '6:55', date: '2026-03-24' },
    { username: 'NOVA_PRIME', score: 1200, time: '7:10', date: '2026-03-26' },
    { username: 'AXIOM_4', score: 980, time: '8:22', date: '2026-03-23' },
  ],
};

const PODIUM = ['#c9a84c', '#c0c0c0', '#cd7f32'];

export default function ModeLeaderboard() {
  const { modeId } = useParams<{ modeId: string }>();
  const navigate = useNavigate();
  const [selectedModeId, setSelectedModeId] = useState(modeId ?? 'prime-grid');

  const mode = useMemo(
    () => GAME_MODES.find((m) => m.id === selectedModeId),
    [selectedModeId],
  );
  const accent = mode ? CATEGORY_ACCENTS[mode.category] : RANK_GOLD;
  const scores = MOCK_SCORES[selectedModeId] ?? MOCK_SCORES['prime-grid'] ?? [];

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a160a 0%, #0a0a0f 50%, #060609 100%)' }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.button
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors mb-6 cursor-pointer"
          onClick={() => navigate('/rankings')}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.96 }}
        >
          ← Leaderboard
        </motion.button>

        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-2xl font-black uppercase tracking-[0.15em] mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Mode Rankings
          </h1>
        </motion.div>

        {/* Mode selector */}
        <motion.div
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {GAME_MODES.map((m) => {
            const active = selectedModeId === m.id;
            const mAccent = CATEGORY_ACCENTS[m.category];
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModeId(m.id)}
                className="shrink-0 text-[0.5rem] font-bold uppercase tracking-[0.1em] px-3 py-1.5 cursor-pointer transition-all"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: active ? mAccent : 'transparent',
                  color: active ? '#0a0a0f' : 'rgba(255,255,255,0.25)',
                  border: `1px solid ${active ? mAccent : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {m.name}
              </button>
            );
          })}
        </motion.div>

        {/* Selected mode header */}
        <motion.div
          className="flex items-center gap-3 mb-4 px-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
          <span
            className="text-[0.55rem] font-bold uppercase tracking-[0.2em]"
            style={{ fontFamily: 'var(--font-display)', color: accent }}
          >
            {mode?.name ?? selectedModeId} — Top Scores
          </span>
        </motion.div>

        {/* Table header */}
        <div
          className="grid items-center gap-2 px-5 py-2 text-[0.4rem] uppercase tracking-[0.25em] text-white/20"
          style={{ gridTemplateColumns: '1.5rem 1fr 3.5rem 3rem 4rem' }}
        >
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Score</span>
          <span className="text-right">Time</span>
          <span className="text-right">Date</span>
        </div>

        {/* Scores */}
        <div className="flex flex-col gap-1">
          {scores.map((s, i) => {
            const isSelf = s.username === 'PHANTOM_X';
            const podiumColor = i < 3 ? PODIUM[i] : undefined;
            return (
              <motion.div
                key={`${s.username}-${i}`}
                className="grid items-center gap-2 px-5 py-3"
                style={{
                  gridTemplateColumns: '1.5rem 1fr 3.5rem 3rem 4rem',
                  background: isSelf ? `${accent}08` : '#0c0c14',
                  border: isSelf
                    ? `2px solid ${accent}`
                    : `1px solid ${podiumColor ? `${podiumColor}20` : 'rgba(255,255,255,0.03)'}`,
                  boxShadow: isSelf ? `4px 4px 0px ${accent}` : 'none',
                }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
              >
                <span
                  className="text-xs font-black tabular-nums"
                  style={{ fontFamily: 'var(--font-display)', color: podiumColor ?? 'rgba(255,255,255,0.2)' }}
                >
                  {i + 1}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-xs font-bold uppercase tracking-[0.08em] truncate"
                    style={{ fontFamily: 'var(--font-display)', color: isSelf ? accent : 'rgba(255,255,255,0.6)' }}
                  >
                    {s.username}
                  </span>
                  {isSelf && (
                    <span className="text-[0.35rem] uppercase px-1 py-0.5" style={{ color: accent, border: `1px solid ${accent}40` }}>
                      You
                    </span>
                  )}
                </div>
                <span
                  className="text-[0.6rem] font-bold tabular-nums text-right"
                  style={{ fontFamily: 'var(--font-display)', color: podiumColor ?? accent }}
                >
                  {s.score.toLocaleString()}
                </span>
                <span className="text-[0.5rem] tabular-nums text-right text-white/25">{s.time}</span>
                <span className="text-[0.4rem] tabular-nums text-right text-white/15">{s.date}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
