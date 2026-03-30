// ──────────────────────────────────────────────
// S-06 — Dashboard (Home)
// Activity feed, live matches, daily challenge
// ──────────────────────────────────────────────

import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useUser } from '../../layouts/AppLayout';

// ─── Mock Data ──────────────────────────────

const ACTIVITY_FEED = [
  { id: 1, text: 'You defeated SPECTRAL_07 in Prime Grid', time: '2m ago', accent: 'var(--electric-lime)', icon: '⚡' },
  { id: 2, text: 'Ranked up to Operative II', time: '15m ago', accent: 'var(--neon-magenta)', icon: '↑' },
  { id: 3, text: 'Completed Daily Challenge #47', time: '1h ago', accent: 'var(--cyber-cyan)', icon: '✓' },
  { id: 4, text: 'New personal best in Vault Breaker', time: '3h ago', accent: 'var(--laser-orange)', icon: '★' },
  { id: 5, text: 'CIPHER_X sent you a challenge', time: '5h ago', accent: 'var(--neon-magenta)', icon: '◈' },
] as const;

const LIVE_MATCHES = [
  { id: 1, mode: 'Prime Grid', p1: 'SHADOW_9', p2: 'AXIOM_4', time: '3:24' },
  { id: 2, mode: 'Vault Breaker', p1: 'NOVA_X', p2: 'GHOST_12', time: '1:52' },
  { id: 3, mode: 'Canvas Fracture', p1: 'VECTOR_7', p2: 'ZERO_1', time: '5:10' },
] as const;

// ─── Section Card ───────────────────────────

function SectionCard({
  title, accent, delay, children,
}: {
  title: string; accent: string; delay: number; children: React.ReactNode;
}) {
  return (
    <motion.div
      className="relative overflow-hidden"
      style={{
        background: '#0c0c14',
        border: `1px solid rgba(255,255,255,0.06)`,
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04]">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        <h3
          className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white/40"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h3>
      </div>
      {/* Body */}
      <div className="px-5 py-4">
        {children}
      </div>
    </motion.div>
  );
}

// ─── Dashboard ──────────────────────────────

export default function Dashboard() {
  const user = useUser();
  const navigate = useNavigate();

  const profile = useMemo(() => {
    try {
      const raw = localStorage.getItem('nine_profile');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const displayName = user?.username ?? profile?.username ?? 'OPERATIVE';

  return (
    <div className="relative min-h-screen text-white">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #12091f 0%, #0a0a0f 50%, #060609 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome banner */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-2xl sm:text-3xl font-black uppercase tracking-[0.1em] mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Welcome back,{' '}
            <span style={{ color: 'var(--cyber-cyan)' }}>{displayName}</span>
          </h1>
          <p className="text-[0.55rem] uppercase tracking-[0.3em] text-white/20">
            NINE Protocol · Command Center
          </p>
        </motion.div>

        {/* Quick action bar */}
        <motion.div
          className="flex gap-3 mb-8 overflow-x-auto pb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {[
            { label: 'Quick Play', path: '/play', accent: 'var(--electric-lime)' },
            { label: 'Daily Challenge', path: '/play/daily', accent: 'var(--cyber-cyan)' },
            { label: 'Leaderboard', path: '/rankings', accent: 'var(--laser-orange)' },
          ].map((action) => (
            <motion.button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="shrink-0 px-5 py-2.5 text-[0.55rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'transparent',
                color: action.accent,
                border: `2px solid ${action.accent}`,
                boxShadow: `3px 3px 0px ${action.accent}`,
              }}
              whileHover={{ boxShadow: `5px 5px 0px ${action.accent}`, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              {action.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Grid layout */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Daily Challenge Card */}
          <SectionCard title="Daily Challenge" accent="var(--cyber-cyan)" delay={0.2}>
            <motion.button
              onClick={() => navigate('/play/daily')}
              className="w-full text-left cursor-pointer"
              whileHover={{ x: 2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-lg font-black"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--cyber-cyan)' }}
                >
                  #048
                </span>
                <span
                  className="text-[0.45rem] font-bold uppercase tracking-[0.2em] px-2 py-0.5"
                  style={{
                    color: 'var(--cyber-cyan)',
                    border: '1px solid rgba(0,255,255,0.2)',
                    background: 'rgba(0,255,255,0.05)',
                  }}
                >
                  Prime Grid
                </span>
              </div>
              <p className="text-xs text-white/30 mb-3">
                Complete today's puzzle to earn bonus XP and maintain your streak.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-[0.5rem] uppercase tracking-widest text-white/15">
                  🔥 12-day streak
                </span>
                <span className="text-[0.5rem] uppercase tracking-widest text-white/15">
                  +150 XP
                </span>
              </div>
            </motion.button>
          </SectionCard>

          {/* Live Matches */}
          <SectionCard title="Live Matches" accent="var(--electric-lime)" delay={0.3}>
            <div className="flex flex-col gap-2.5">
              {LIVE_MATCHES.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[0.55rem] font-bold text-white/50">{match.p1}</span>
                    <span className="text-[0.45rem] text-white/15">vs</span>
                    <span className="text-[0.55rem] font-bold text-white/50">{match.p2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.45rem] text-white/20">{match.mode}</span>
                    <span
                      className="text-[0.5rem] tabular-nums font-bold"
                      style={{ color: 'var(--electric-lime)', fontFamily: 'var(--font-display)' }}
                    >
                      {match.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Activity Feed — full width */}
          <div className="sm:col-span-2">
            <SectionCard title="Activity Feed" accent="var(--neon-magenta)" delay={0.4}>
              <div className="flex flex-col gap-2">
                {ACTIVITY_FEED.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                  >
                    <span
                      className="w-6 h-6 flex items-center justify-center shrink-0 text-xs"
                      style={{
                        color: item.accent,
                        background: `color-mix(in srgb, ${item.accent} 8%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${item.accent} 15%, transparent)`,
                      }}
                    >
                      {item.icon}
                    </span>
                    <span className="text-xs text-white/45 flex-1">{item.text}</span>
                    <span className="text-[0.45rem] text-white/15 shrink-0">{item.time}</span>
                  </motion.div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          className="mt-6 grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { label: 'Matches', value: String(user?.gamesPlayed ?? 0), accent: 'var(--electric-lime)' },
            { label: 'Win Rate', value: user && user.gamesPlayed > 0 ? `${Math.round((user.wins / user.gamesPlayed) * 100)}%` : '0%', accent: 'var(--cyber-cyan)' },
            { label: 'Rank', value: user?.rankTier ?? profile?.rank ?? 'Recruit', accent: 'var(--neon-magenta)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 py-4"
              style={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <span
                className="text-lg font-black tabular-nums"
                style={{ fontFamily: 'var(--font-display)', color: stat.accent }}
              >
                {stat.value}
              </span>
              <span className="text-[0.45rem] uppercase tracking-[0.25em] text-white/20">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
