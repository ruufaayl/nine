// ──────────────────────────────────────────────
// S-20 — Player Profile (public view)
// Stats, win rate by mode, Add Friend / Challenge
// ──────────────────────────────────────────────

import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';

// ─── Social Accent ──────────────────────────

const SOCIAL = '#3eb8cf';

// ─── Mock Player DB ─────────────────────────

const PLAYERS: Record<string, {
  username: string; rank: string; xp: number; online: boolean;
  wins: number; losses: number; joinedDate: string;
  modeStats: { mode: string; played: number; winRate: number }[];
}> = {
  u1: {
    username: 'SPECTRAL_07', rank: 'Operative', xp: 3200, online: true,
    wins: 67, losses: 34, joinedDate: '2025-09',
    modeStats: [
      { mode: 'Prime Grid', played: 42, winRate: 71 },
      { mode: 'Vault Breaker', played: 28, winRate: 64 },
      { mode: 'Interrogation', played: 18, winRate: 55 },
      { mode: 'Canvas Fracture', played: 13, winRate: 69 },
    ],
  },
  u2: {
    username: 'CIPHER_X', rank: 'Diamond', xp: 8400, online: true,
    wins: 156, losses: 44, joinedDate: '2025-06',
    modeStats: [
      { mode: 'Prime Grid', played: 80, winRate: 82 },
      { mode: 'Glyph Grid', played: 55, winRate: 76 },
      { mode: 'Data Sift', played: 40, winRate: 72 },
      { mode: 'Vault Breaker', played: 25, winRate: 68 },
    ],
  },
  u6: {
    username: 'VECTOR_7', rank: 'Legend', xp: 12000, online: true,
    wins: 312, losses: 58, joinedDate: '2025-03',
    modeStats: [
      { mode: 'Prime Grid', played: 150, winRate: 88 },
      { mode: 'Canvas Fracture', played: 90, winRate: 84 },
      { mode: 'Shattered Grid', played: 70, winRate: 80 },
      { mode: 'Chronos Shift', played: 60, winRate: 75 },
    ],
  },
};

const FALLBACK = {
  username: 'UNKNOWN', rank: 'Recruit', xp: 0, online: false,
  wins: 0, losses: 0, joinedDate: '—',
  modeStats: [],
};

// ─── Component ──────────────────────────────

export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();

  const player = useMemo(
    () => PLAYERS[playerId ?? ''] ?? FALLBACK,
    [playerId],
  );

  const totalGames = player.wins + player.losses;
  const winRate = totalGames > 0 ? Math.round((player.wins / totalGames) * 100) : 0;

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
          onClick={() => navigate(-1)}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.96 }}
        >
          ← Back
        </motion.button>

        {/* Profile Card */}
        <motion.div
          className="relative overflow-hidden mb-6"
          style={{
            background: 'var(--bg-surface)',
            border: `2px solid ${SOCIAL}`,
            boxShadow: 'var(--shadow-lg)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, ${SOCIAL}08, transparent)` }}
          />

          <div className="relative flex flex-col items-center px-6 pt-8 pb-6">
            {/* Avatar */}
            <motion.div
              className="w-16 h-16 flex items-center justify-center text-2xl mb-3"
              style={{ border: `2px solid ${SOCIAL}`, color: SOCIAL }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
            >
              ◈
            </motion.div>

            {/* Name + status */}
            <div className="flex items-center gap-2 mb-2">
              <h1
                className="text-xl font-black uppercase tracking-[0.12em]"
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                {player.username}
              </h1>
              {player.online && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-[0.4rem] uppercase tracking-widest text-green-400/60">Online</span>
                </div>
              )}
            </div>

            {/* Rank + meta */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-[0.5rem] font-bold uppercase tracking-[0.2em] px-3 py-1"
                style={{ color: SOCIAL, background: `${SOCIAL}15`, border: `1px solid ${SOCIAL}30` }}
              >
                {player.rank}
              </span>
              <span className="text-[0.45rem] text-white/20 tabular-nums">
                {player.xp.toLocaleString()} XP
              </span>
              <span className="text-[0.45rem] text-white/15">
                Since {player.joinedDate}
              </span>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 w-full max-w-xs">
              <motion.button
                className="flex-1 py-2.5 text-[0.55rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
                style={{
                  fontFamily: 'var(--font-primary)',
                  background: SOCIAL,
                  color: 'var(--bg-primary)',
                  boxShadow: 'var(--shadow-md)',
                }}
                whileHover={{ boxShadow: 'var(--shadow-lg)', y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/social/challenge/${playerId}`)}
              >
                Challenge
              </motion.button>

              <motion.button
                className="flex-1 py-2.5 text-[0.55rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
                style={{
                  fontFamily: 'var(--font-primary)',
                  color: SOCIAL,
                  border: `2px solid ${SOCIAL}`,
                  boxShadow: 'var(--shadow-sm)',
                }}
                whileHover={{ boxShadow: 'var(--shadow-md)', y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Add Friend
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          className="grid grid-cols-4 gap-3 mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {[
            { label: 'Games', value: totalGames.toString() },
            { label: 'Wins', value: player.wins.toString() },
            { label: 'Win Rate', value: `${winRate}%` },
            { label: 'Losses', value: player.losses.toString() },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 py-3"
              style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <span
                className="text-base font-black tabular-nums"
                style={{ fontFamily: 'var(--font-primary)', color: SOCIAL }}
              >
                {s.value}
              </span>
              <span className="text-[0.4rem] uppercase tracking-[0.2em] text-white/20">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Win Rate by Mode */}
        <motion.div
          className="overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04]">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: SOCIAL }} />
            <h3
              className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white/40"
              style={{ fontFamily: 'var(--font-primary)' }}
            >
              Win Rate by Mode
            </h3>
          </div>

          <div className="px-5 py-4 flex flex-col gap-3">
            {player.modeStats.map((ms, i) => (
              <motion.div
                key={ms.mode}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
              >
                <span className="text-xs text-white/40 w-28 shrink-0 truncate">{ms.mode}</span>
                <div className="flex-1 h-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <motion.div
                    className="h-full"
                    style={{ background: SOCIAL }}
                    initial={{ scaleX: 0, transformOrigin: 'left' }}
                    animate={{ scaleX: ms.winRate / 100 }}
                    transition={{ delay: 0.5 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <span
                  className="text-[0.55rem] font-bold tabular-nums w-10 text-right"
                  style={{ fontFamily: 'var(--font-primary)', color: SOCIAL }}
                >
                  {ms.winRate}%
                </span>
                <span className="text-[0.4rem] text-white/15 w-8 text-right">{ms.played}g</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
