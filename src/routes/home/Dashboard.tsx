// ──────────────────────────────────────────────
// S-06 — Dashboard (Home — Premium)
// Hero profile · Daily challenge · Quick play ·
// Stats · Live matches · Recent activity
// ──────────────────────────────────────────────

import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useUser } from '../../layouts/AppLayout';
import { getRankForTrophies, levelFromXP, xpForLevel, RANK_TIERS } from '../../lib/economy';

// ─── Types ─────────────────────────────────

interface DailyData {
  challenge: { id: string; modeId: string; activeDate: string } | null;
  streak: number;
  completed: boolean;
  totalCompletions: number;
}

interface LiveMatch {
  id: string;
  mode: string;
  p1: string;
  p2: string;
  time: string;
}

interface ActivityItem {
  id: string;
  type: 'match' | 'notification';
  text: string;
  icon: string;
  accent?: string;
  xp?: number;
  time: string;
}

// ─── Constants ─────────────────────────────

const RANK_GRADIENTS: Record<string, string> = {
  Recruit:    'linear-gradient(135deg, #6B7280, #9CA3AF)',
  Bronze:     'linear-gradient(135deg, #92400E, #CD7F32)',
  Silver:     'linear-gradient(135deg, #9CA3AF, #D1D5DB)',
  Gold:       'linear-gradient(135deg, #B45309, #F59E0B)',
  Platinum:   'linear-gradient(135deg, #6B7280, #E5E7EB)',
  Diamond:    'linear-gradient(135deg, #0891B2, #67E8F9)',
  Mastermind: 'linear-gradient(135deg, #DC2626, #F87171)',
};

const MODE_LABELS: Record<string, string> = {
  'prime-grid': 'Prime Grid',
  'glyph-grid': 'Glyph Grid',
  'shattered-grid': 'Shattered Grid',
  'vault-breaker': 'Vault Breaker',
  'cipher-scramble': 'Cipher Scramble',
  'hex-shift': 'Hex Shift',
  'echo-chain': 'Echo Chain',
  'pattern-lock': 'Pattern Lock',
  'spectrum-sort': 'Spectrum Sort',
  'canvas-fracture': 'Canvas Fracture',
  'number-forge': 'Number Forge',
  'mirror-maze': 'Mirror Maze',
  'signal-trace': 'Signal Trace',
  'quantum-flip': 'Quantum Flip',
};

// ─── Stagger helpers ───────────────────────

const EASE = [0.16, 1, 0.3, 1] as const;
const stagger = (i: number) => ({
  initial: { opacity: 0, y: 16 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay: 0.08 + i * 0.06, duration: 0.5, ease: EASE as unknown as [number, number, number, number] },
});

// ─── Dashboard ─────────────────────────────

export default function Dashboard() {
  const user = useUser();
  const navigate = useNavigate();

  // User data
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

  // Next rank info
  const nextRank = useMemo(() => {
    const idx = RANK_TIERS.findIndex((r) => r.name === rank.name);
    return idx < RANK_TIERS.length - 1 ? RANK_TIERS[idx + 1] : null;
  }, [rank]);

  // API data
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetch('/api/dashboard?q=daily', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setDaily(d))
      .catch(() => {});

    fetch('/api/dashboard?q=live')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setLiveMatches(d))
      .catch(() => {});

    if (user) {
      fetch('/api/dashboard?q=activity', { credentials: 'include' })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => d && setActivity(d))
        .catch(() => {});
    }
  }, [user]);

  return (
    <div className="relative min-h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="relative z-10 w-full max-w-lg mx-auto px-5 py-6 flex flex-col gap-5">

        {/* ── Hero: Profile Card ── */}
        <motion.div
          className="relative overflow-hidden"
          style={{
            background: RANK_GRADIENTS[rank.name] ?? RANK_GRADIENTS.Recruit,
            borderRadius: 'var(--radius-lg)',
            padding: '28px 24px 22px',
          }}
          {...stagger(0)}
        >
          {/* Oversized rank watermark */}
          <div
            className="absolute -right-6 -top-4 select-none pointer-events-none"
            style={{
              fontSize: '160px',
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              opacity: 0.08,
              color: '#fff',
              lineHeight: 1,
              letterSpacing: '-0.05em',
            }}
          >
            {rank.name.charAt(0)}
          </div>

          {/* Top sheen line */}
          <div
            className="absolute top-0 left-6 right-6 h-px"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          />

          <div className="relative z-10 flex items-start gap-4">
            {/* Avatar */}
            <div
              className="shrink-0 w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '2.5px solid rgba(255,255,255,0.4)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span
                  className="text-2xl font-black"
                  style={{ color: '#fff', fontFamily: 'var(--font-display)' }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1
                className="text-xl font-black tracking-[-0.02em] truncate"
                style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
              >
                {displayName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[0.65rem] font-bold uppercase tracking-[0.12em] px-2.5 py-0.5"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 'var(--radius-full)',
                    color: '#fff',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {rank.name}
                </span>
                <span
                  className="text-[0.65rem] font-bold uppercase tracking-[0.12em] px-2.5 py-0.5"
                  style={{
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: 'var(--radius-full)',
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  Lv. {level}
                </span>
              </div>

              {/* XP progress bar */}
              <div className="mt-3">
                <div
                  className="w-full h-1.5 overflow-hidden"
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  <motion.div
                    className="h-full"
                    style={{
                      background: '#fff',
                      borderRadius: 'var(--radius-full)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span
                    className="text-[0.6rem] font-semibold tabular-nums"
                    style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-numeric)' }}
                  >
                    {totalXp.toLocaleString()} XP
                  </span>
                  <span
                    className="text-[0.6rem] font-semibold tabular-nums"
                    style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-numeric)' }}
                  >
                    {(nextLevelXp - totalXp).toLocaleString()} to Lv. {level + 1}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom stat chips */}
          <div className="relative z-10 flex gap-2 mt-4">
            <StatChip label="Trophies" value={trophies.toLocaleString()} />
            <StatChip label="Coins" value={coins.toLocaleString()} />
            <StatChip label="Win Rate" value={gamesPlayed > 0 ? `${winRate}%` : '—'} />
          </div>

          {/* Next rank teaser */}
          {nextRank && (
            <div
              className="relative z-10 mt-3 flex items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <span
                className="text-[0.55rem] font-semibold uppercase tracking-[0.15em]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {nextRank.minTrophies - trophies} trophies to {nextRank.name}
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            </div>
          )}
        </motion.div>

        {/* ── Quick Play CTA ── */}
        <motion.button
          onClick={() => navigate('/play')}
          className="w-full py-4 cursor-pointer relative overflow-hidden"
          style={{
            background: 'var(--accent-primary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
          }}
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          {...stagger(1)}
        >
          <div className="relative z-10 flex items-center justify-center gap-3">
            <span
              className="text-lg"
              style={{ lineHeight: 1 }}
            >
              ▶
            </span>
            <span
              className="text-[0.9rem] font-black tracking-[-0.01em] uppercase"
              style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
            >
              Play Now
            </span>
          </div>
          {/* Subtle shimmer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
            }}
          />
        </motion.button>

        {/* ── Daily Challenge Card ── */}
        <motion.div
          className="relative overflow-hidden cursor-pointer"
          style={{
            background: '#0F766E',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
          }}
          onClick={() => navigate('/play/daily')}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          {...stagger(2)}
        >
          {/* Watermark */}
          <div
            className="absolute -right-3 -bottom-2 select-none pointer-events-none"
            style={{
              fontSize: '100px',
              fontWeight: 900,
              opacity: 0.08,
              color: '#fff',
              lineHeight: 1,
              fontFamily: 'var(--font-display)',
            }}
          >
            ◈
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[0.6rem] font-bold uppercase tracking-[0.18em]"
                style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)' }}
              >
                Daily Challenge
              </span>
              {daily && daily.streak > 0 && (
                <span
                  className="text-[0.65rem] font-bold px-2.5 py-0.5"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 'var(--radius-full)',
                    color: '#fff',
                    fontFamily: 'var(--font-numeric)',
                  }}
                >
                  {daily.streak} day streak
                </span>
              )}
            </div>

            <h3
              className="text-lg font-black tracking-[-0.02em] mb-1"
              style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
            >
              {daily?.completed ? 'Completed!' : daily?.challenge
                ? MODE_LABELS[daily.challenge.modeId] ?? 'Today\'s Puzzle'
                : 'Today\'s Puzzle'}
            </h3>

            <p
              className="text-[0.75rem]"
              style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)' }}
            >
              {daily?.completed
                ? `You've solved today's challenge. Come back tomorrow!`
                : 'Solve it to keep your streak alive'}
            </p>

            {!daily?.completed && (
              <div
                className="inline-flex items-center gap-2 mt-3 px-4 py-2"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-full)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <span className="text-[0.7rem] font-bold" style={{ color: '#fff', fontFamily: 'var(--font-display)' }}>
                  Play →
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Stats Strip ── */}
        <motion.div
          className="grid grid-cols-4 gap-2"
          {...stagger(3)}
        >
          {[
            { label: 'Games', value: gamesPlayed.toString() },
            { label: 'Wins', value: wins.toString() },
            { label: 'Losses', value: losses.toString() },
            { label: 'Trophies', value: trophies.toLocaleString() },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center py-3"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span
                className="text-lg tabular-nums leading-none"
                style={{
                  fontFamily: 'var(--font-numeric)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.03em',
                }}
              >
                {stat.value}
              </span>
              <span
                className="text-[0.55rem] font-semibold uppercase tracking-[0.12em] mt-1"
                style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* ── Quick Actions Row ── */}
        <motion.div
          className="flex gap-2.5"
          {...stagger(4)}
        >
          <QuickAction
            label="Leaderboard"
            glyph="◆"
            accent="#F59E0B"
            onClick={() => navigate('/rankings')}
          />
          <QuickAction
            label="Friends"
            glyph="●●"
            accent="#6C63FF"
            onClick={() => navigate('/social')}
          />
          <QuickAction
            label="Profile"
            glyph="○"
            accent="#0EA5E9"
            onClick={() => navigate('/me')}
          />
        </motion.div>

        {/* ── Live Matches ── */}
        {liveMatches.length > 0 && (
          <motion.div {...stagger(5)}>
            <SectionTitle>Live Now</SectionTitle>
            <div className="flex flex-col gap-2">
              {liveMatches.slice(0, 4).map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="shrink-0 w-2 h-2 rounded-full"
                      style={{ background: '#34C759', boxShadow: '0 0 6px rgba(52,199,89,0.5)' }}
                    />
                    <div className="min-w-0">
                      <p
                        className="text-[0.75rem] font-semibold truncate"
                        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
                      >
                        {match.p1} vs {match.p2}
                      </p>
                      <p
                        className="text-[0.6rem]"
                        style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
                      >
                        {MODE_LABELS[match.mode] ?? match.mode}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-[0.6rem] tabular-nums font-semibold shrink-0"
                    style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-numeric)' }}
                  >
                    {match.time}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Recent Activity ── */}
        <motion.div {...stagger(6)}>
          <SectionTitle>Recent Activity</SectionTitle>
          {activity.length === 0 && gamesPlayed === 0 ? (
            <div
              className="flex flex-col items-center py-10"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
              >
                <span className="text-2xl" style={{ opacity: 0.4 }}>◈</span>
              </div>
              <p
                className="text-[0.8rem] font-semibold mb-1"
                style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
              >
                No games yet
              </p>
              <p
                className="text-[0.7rem] mb-4"
                style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
              >
                Play your first match to see activity here
              </p>
              <motion.button
                onClick={() => navigate('/play')}
                className="px-5 py-2 text-[0.75rem] font-bold cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Start Playing
              </motion.button>
            </div>
          ) : activity.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {activity.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span className="text-sm shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[0.75rem] font-medium truncate"
                      style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
                    >
                      {item.text}
                    </p>
                    <p
                      className="text-[0.6rem]"
                      style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
                    >
                      {item.time}
                    </p>
                  </div>
                  {item.xp != null && item.xp > 0 && (
                    <span
                      className="text-[0.6rem] font-bold tabular-nums shrink-0"
                      style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-numeric)' }}
                    >
                      +{item.xp} XP
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Has games but API didn't return activity — show summary */
            <div
              className="flex items-center justify-between px-4 py-4"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm">📊</span>
                <span
                  className="text-[0.75rem] font-medium"
                  style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
                >
                  {wins}W – {losses}L across {gamesPlayed} games
                </span>
              </div>
              <span
                className="text-[0.65rem] font-bold tabular-nums"
                style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-numeric)' }}
              >
                {winRate}%
              </span>
            </div>
          )}
        </motion.div>

        {/* Bottom breathing room */}
        <div className="h-16" />
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex-1 flex flex-col items-center py-2 px-3"
      style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 'var(--radius-xs)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <span
        className="text-sm tabular-nums font-bold leading-none"
        style={{ color: '#fff', fontFamily: 'var(--font-numeric)' }}
      >
        {value}
      </span>
      <span
        className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] mt-1"
        style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </span>
    </div>
  );
}

function QuickAction({
  label,
  glyph,
  accent,
  onClick,
}: {
  label: string;
  glyph: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-2 py-4 cursor-pointer"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-body)',
      }}
      whileHover={{ y: -2, borderColor: 'var(--border-default)' }}
      whileTap={{ scale: 0.97 }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
        style={{ background: `${accent}18`, color: accent }}
      >
        {glyph}
      </div>
      <span
        className="text-[0.65rem] font-semibold"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
    </motion.button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-[0.6rem] font-bold uppercase tracking-[0.18em] mb-3"
      style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
    >
      {children}
    </h3>
  );
}
