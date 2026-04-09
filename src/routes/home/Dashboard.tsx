// ──────────────────────────────────────────────
// S-06 — Dashboard (Home — Liquid Design)
// Real data only — no simulated feeds
// ──────────────────────────────────────────────

import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useUser } from '../../layouts/AppLayout';
import { getRankForTrophies, levelFromXP, xpForLevel } from '../../lib/economy';

// ─── Dashboard ──────────────────────────────

export default function Dashboard() {
  const user = useUser();
  const navigate = useNavigate();

  const displayName = user?.username ?? 'Player';
  const trophies = user?.trophies ?? 0;
  const coins = user?.coins ?? 5000;
  const totalXp = user?.totalXp ?? 0;
  const gamesPlayed = user?.gamesPlayed ?? 0;
  const wins = user?.wins ?? 0;
  const losses = user?.losses ?? 0;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

  const rank = useMemo(() => getRankForTrophies(trophies), [trophies]);
  const level = useMemo(() => levelFromXP(totalXp), [totalXp]);
  const currentLevelXp = useMemo(() => xpForLevel(level), [level]);
  const nextLevelXp = useMemo(() => xpForLevel(level + 1), [level]);
  const xpProgress = nextLevelXp > currentLevelXp
    ? ((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 100;

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 sm:px-6 py-6">

        {/* Welcome */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1
            className="text-2xl font-extrabold tracking-tight mb-1"
            style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
          >
            Hey, <span style={{ color: 'var(--accent-primary)' }}>{displayName}</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Ready for your next puzzle?
          </p>
        </motion.div>

        {/* Level + XP Progress */}
        <motion.div
          className="liquid-card p-5 mb-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'var(--accent-primary)', color: '#fff' }}
              >
                {level}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Level {level}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {totalXp.toLocaleString()} XP total
                </p>
              </div>
            </div>
            <div className="pill" style={{
              background: `${rank.color}18`,
              color: rank.color,
              border: `1px solid ${rank.color}30`,
            }}>
              {rank.name}
            </div>
          </div>
          {/* XP bar */}
          <div
            className="w-full h-2 overflow-hidden"
            style={{
              background: 'var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <motion.div
              className="h-full"
              style={{
                background: 'var(--accent-primary)',
                borderRadius: 'var(--radius-full)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
            {(nextLevelXp - totalXp).toLocaleString()} XP to Level {level + 1}
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="flex gap-2.5 mb-6 overflow-x-auto pb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {[
            { label: 'Quick Play', path: '/play', emoji: '▶️', accent: 'var(--accent-primary)' },
            { label: 'Daily', path: '/play/daily', emoji: '📅', accent: 'var(--accent-secondary)' },
            { label: 'Leaderboard', path: '/rankings', emoji: '🏆', accent: 'var(--accent-gold)' },
          ].map((action) => (
            <motion.button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="shrink-0 flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
              style={{
                fontFamily: 'var(--font-primary)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
              whileHover={{
                background: 'var(--bg-card-hover)',
                borderColor: 'var(--border-default)',
                y: -1,
              }}
              whileTap={{ scale: 0.97 }}
            >
              <span>{action.emoji}</span>
              <span>{action.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {[
            { label: 'Games', value: gamesPlayed.toString(), icon: '🎮' },
            { label: 'Win Rate', value: `${winRate}%`, icon: '📊' },
            { label: 'Coins', value: coins.toLocaleString(), icon: '🪙' },
            { label: 'Trophies', value: trophies.toLocaleString(), icon: '🏆' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="liquid-card flex items-center gap-3 p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.06 }}
            >
              <span className="text-xl">{stat.icon}</span>
              <div>
                <p
                  className="text-lg font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
                >
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Activity placeholder — reads from server when available */}
        <motion.div
          className="liquid-card p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3
            className="text-xs font-semibold mb-4"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}
          >
            Recent Activity
          </h3>
          {gamesPlayed === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xl mb-2">🧩</p>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No games played yet
              </p>
              <motion.button
                className="mt-3 px-5 py-2 text-sm font-semibold cursor-pointer"
                style={{
                  fontFamily: 'var(--font-primary)',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                }}
                whileHover={{ opacity: 0.9, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/play')}
              >
                Play your first game
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🏆</span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {wins} win{wins !== 1 ? 's' : ''}, {losses} loss{losses !== 1 ? 'es' : ''}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {gamesPlayed} played
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
