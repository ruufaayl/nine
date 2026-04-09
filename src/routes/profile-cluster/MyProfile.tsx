// ──────────────────────────────────────────────
// S-25 — My Profile
// Avatar, rank badge, stats summary — real data
// ──────────────────────────────────────────────

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useUser } from '../../layouts/AppLayout';

// ─── Avatar Map ─────────────────────────────

const AVATAR_GLYPHS: Record<string, string> = {
  phantom: '◈', spectre: '⟁', cipher: '⧖',
  nexus: '⬡', vector: '◇', nova: '✦',
};

// ─── Rank Colors ────────────────────────────

const RANK_COLORS: Record<string, string> = {
  Recruit:    '#6b7280',
  Bronze:     '#cd7f32',
  Silver:     '#c0c0c0',
  Gold:       '#fbbf24',
  Platinum:   '#a5b4fc',
  Diamond:    '#22d3ee',
  Mastermind: '#f472b6',
  // Legacy rank names
  Stone:      '#6b7280',
  Legend:     '#f472b6',
  Operative:  '#00ffff',
};

// ─── Mode ID → Display Name ─────────────────

const MODE_NAMES: Record<string, string> = {
  'prime-grid': 'Prime Grid',
  'vault-breaker': 'Vault Breaker',
  'interrogation': 'Interrogation',
  'canvas-fracture': 'Canvas Fracture',
  'glyph-grid': 'Glyph Grid',
  'sequence-recall': 'Sequence Recall',
  'pattern-lock': 'Pattern Lock',
  'cipher-wheel': 'Cipher Wheel',
};

// ─── Types ──────────────────────────────────

interface RecentScore {
  id: string;
  modeId: string;
  score: number;
  timeMs: number;
  createdAt: string;
}

// ─── Component ──────────────────────────────

export default function MyProfile() {
  const user = useUser();
  const navigate = useNavigate();
  const [recentScores, setRecentScores] = useState<RecentScore[]>([]);

  const profile = useMemo(() => {
    try {
      const raw = localStorage.getItem('nine_profile');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  // Fetch recent scores
  useEffect(() => {
    fetch('/api/profile/scores', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setRecentScores(data.scores ?? []))
      .catch(() => {});
  }, []);

  const displayName = user?.username ?? profile?.username ?? 'OPERATIVE';
  const rank = user?.rankTier ?? user?.rank ?? profile?.rank ?? 'Recruit';
  const xp = user?.totalXp ?? user?.xp ?? profile?.xp ?? 0;
  const avatarId = profile?.avatar ?? 'phantom';
  const avatarGlyph = AVATAR_GLYPHS[avatarId] ?? '◈';
  const rankColor = RANK_COLORS[rank] ?? '#6b7280';
  const isGuest = user?.isGuest ?? false;

  // Stats from real user data
  const gamesPlayed = user?.gamesPlayed ?? 0;
  const wins = user?.wins ?? 0;
  const losses = user?.losses ?? 0;
  const winRate = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : '0';

  const STATS = [
    { label: 'Total Matches', value: String(gamesPlayed) },
    { label: 'Wins', value: String(wins) },
    { label: 'Win Rate', value: `${winRate}%` },
    { label: 'Losses', value: String(losses) },
    { label: 'Total XP', value: xp.toLocaleString() },
    { label: 'Rank', value: rank },
  ] as const;

  const handleLogout = useCallback(() => {
    localStorage.removeItem('nine_session');
    localStorage.removeItem('nine_profile');
    navigate('/splash', { replace: true });
  }, [navigate]);

  // Format time for recent scores
  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'var(--bg-primary)',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Card */}
        <motion.div
          className="relative overflow-hidden mb-6"
          style={{
            background: 'var(--bg-surface)',
            border: `2px solid ${rankColor}`,
            boxShadow: 'var(--shadow-lg)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, ${rankColor}08, transparent)`,
            }}
          />

          <div className="relative flex flex-col items-center px-6 pt-8 pb-6">
            <motion.div
              className="w-20 h-20 flex items-center justify-center mb-4"
              style={{
                border: `2px solid ${rankColor}`,
                boxShadow: `0 0 30px ${rankColor}20`,
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
            >
              <span className="text-3xl" style={{ color: rankColor }}>{avatarGlyph}</span>
            </motion.div>

            <h1
              className="text-xl font-black uppercase tracking-[0.12em] mb-1"
              style={{ fontFamily: 'var(--font-primary)' }}
            >
              {displayName}
            </h1>

            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-[0.5rem] font-bold uppercase tracking-[0.2em] px-3 py-1"
                style={{
                  color: rankColor,
                  background: `${rankColor}15`,
                  border: `1px solid ${rankColor}30`,
                }}
              >
                {rank}
              </span>

              {isGuest && (
                <span
                  className="text-[0.45rem] font-bold uppercase tracking-wider px-2 py-0.5"
                  style={{
                    color: '#fbbf24',
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.2)',
                  }}
                >
                  Guest
                </span>
              )}
            </div>

            {/* XP bar */}
            <div className="w-full max-w-xs mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-[0.45rem] uppercase tracking-widest text-white/20">
                  Experience
                </span>
                <span
                  className="text-[0.5rem] font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-primary)', color: rankColor }}
                >
                  {xp.toLocaleString()} XP
                </span>
              </div>
              <div className="w-full h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full"
                  style={{ background: rankColor }}
                  initial={{ scaleX: 0, transformOrigin: 'left' }}
                  animate={{ scaleX: Math.min(xp / 5000, 1) }}
                  transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[0.4rem] text-white/10 mt-0.5 text-right">
                {Math.max(5000 - xp, 0).toLocaleString()} XP to next rank
              </p>
            </div>

            {isGuest && (
              <motion.div
                className="mt-3 px-4 py-2 text-[0.55rem] text-center"
                style={{
                  color: '#fbbf24',
                  background: 'rgba(251,191,36,0.06)',
                  border: '1px solid rgba(251,191,36,0.15)',
                }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Guest Session: Data will be deleted on logout.
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-3 gap-3 mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center gap-1 py-4"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.04 }}
            >
              <span
                className="text-base font-black tabular-nums"
                style={{ fontFamily: 'var(--font-primary)', color: 'var(--accent-secondary)' }}
              >
                {stat.value}
              </span>
              <span className="text-[0.4rem] uppercase tracking-[0.2em] text-white/20 text-center px-1">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Games */}
        <motion.div
          className="relative overflow-hidden mb-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04]">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-warning)' }} />
            <h3
              className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white/40"
              style={{ fontFamily: 'var(--font-primary)' }}
            >
              Recent Games
            </h3>
          </div>
          <div className="px-5 py-3">
            {recentScores.length === 0 && (
              <p className="text-[0.5rem] text-white/15 text-center py-4 uppercase tracking-widest">
                No games played yet
              </p>
            )}
            {recentScores.map((g, i) => (
              <motion.div
                key={g.id}
                className="flex items-center gap-3 py-2.5 border-b border-white/[0.03] last:border-0"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.05 }}
              >
                <span
                  className="w-6 h-6 flex items-center justify-center text-[0.55rem] font-black shrink-0"
                  style={{
                    fontFamily: 'var(--font-primary)',
                    color: 'var(--accent-success)',
                    background: 'rgba(170,255,0,0.06)',
                    border: '1px solid rgba(170,255,0,0.15)',
                  }}
                >
                  ◈
                </span>
                <span className="text-xs text-white/50 flex-1">
                  {MODE_NAMES[g.modeId] ?? g.modeId}
                </span>
                <span className="text-[0.5rem] tabular-nums text-white/25" style={{ fontFamily: 'var(--font-primary)' }}>
                  {g.score.toLocaleString()}
                </span>
                <span className="text-[0.45rem] text-white/15">{formatTime(g.timeMs)}</span>
                <span className="text-[0.4rem] text-white/10">{formatAgo(g.createdAt)}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <motion.button
            className="flex-1 py-3 text-[0.6rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
            style={{
              fontFamily: 'var(--font-primary)',
              color: 'rgba(255,255,255,0.4)',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: 'var(--shadow-sm)',
            }}
            whileHover={{ borderColor: 'rgba(255,255,255,0.25)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/me/edit')}
          >
            Edit Profile
          </motion.button>

          <motion.button
            className="flex-1 py-3 text-[0.6rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
            style={{
              fontFamily: 'var(--font-primary)',
              color: 'rgba(255,255,255,0.4)',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: 'var(--shadow-sm)',
            }}
            whileHover={{ borderColor: 'rgba(255,255,255,0.25)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/me/stats')}
          >
            Full Stats
          </motion.button>

          <motion.button
            className="flex-1 py-3 text-[0.6rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
            style={{
              fontFamily: 'var(--font-primary)',
              color: '#ff6b6b',
              border: '2px solid rgba(255,107,107,0.15)',
              boxShadow: 'var(--shadow-sm)',
            }}
            whileHover={{ borderColor: 'rgba(255,107,107,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
          >
            Log Out
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
