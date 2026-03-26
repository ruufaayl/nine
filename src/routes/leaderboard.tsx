// ──────────────────────────────────────────────
// NINE — Leaderboard Route (Global Rankings)
// ──────────────────────────────────────────────

import {
  useLoaderData,
  type LoaderFunctionArgs,
} from 'react-router';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ─── Types ──────────────────────────────────

interface LeaderboardPlayer {
  id: string;
  username: string;
  xp: number;
  rank: string;
  gamesPlayed: number;
}

interface LeaderboardData {
  players: LeaderboardPlayer[];
  totalCount: number;
}

// ─── Loader ─────────────────────────────────

export const loader = async (_args: LoaderFunctionArgs): Promise<Response> => {
  try {
    const res = await fetch('/api/leaderboard', { credentials: 'include' });

    if (!res.ok) {
      return Response.json({ players: [], totalCount: 0 } satisfies LeaderboardData);
    }

    const data = await res.json();
    return Response.json({
      players: data.players ?? [],
      totalCount: data.totalCount ?? 0,
    } satisfies LeaderboardData);
  } catch {
    return Response.json({ players: [], totalCount: 0 } satisfies LeaderboardData);
  }
};

// ─── Rank Colors ────────────────────────────

const RANK_COLORS: Record<string, { color: string; glow: string }> = {
  Stone:    { color: '#6b7280', glow: 'none' },
  Bronze:   { color: '#cd7f32', glow: 'none' },
  Silver:   { color: '#c0c0c0', glow: 'none' },
  Gold:     { color: '#fbbf24', glow: '0 0 8px rgba(251,191,36,0.5)' },
  Platinum: { color: '#a5b4fc', glow: '0 0 8px rgba(165,180,252,0.5)' },
  Diamond:  { color: '#22d3ee', glow: '0 0 10px rgba(34,211,238,0.6)' },
  Legend:   { color: '#f472b6', glow: '0 0 12px rgba(244,114,182,0.6)' },
};

const RANK_THRESHOLDS = [
  { name: 'Stone',    minXp: 0 },
  { name: 'Bronze',   minXp: 500 },
  { name: 'Silver',   minXp: 2000 },
  { name: 'Gold',     minXp: 5000 },
  { name: 'Platinum', minXp: 12000 },
  { name: 'Diamond',  minXp: 25000 },
  { name: 'Legend',   minXp: 50000 },
];

// ─── Podium glow configs for top 3 ─────────

const PODIUM_GLOW: Record<number, { border: string; shadow: string; label: string }> = {
  1: {
    border: 'rgba(251,191,36,0.35)',
    shadow: '0 0 20px rgba(251,191,36,0.15), inset 0 0 20px rgba(251,191,36,0.04)',
    label: '1ST',
  },
  2: {
    border: 'rgba(192,192,192,0.3)',
    shadow: '0 0 16px rgba(192,192,192,0.12), inset 0 0 16px rgba(192,192,192,0.03)',
    label: '2ND',
  },
  3: {
    border: 'rgba(205,127,50,0.3)',
    shadow: '0 0 14px rgba(205,127,50,0.12), inset 0 0 14px rgba(205,127,50,0.03)',
    label: '3RD',
  },
};

const POSITION_COLORS: Record<number, string> = {
  1: '#fbbf24',
  2: '#c0c0c0',
  3: '#cd7f32',
};

// ─── Rank Badge ─────────────────────────────

function RankBadge({ rank }: { rank: string }) {
  const def = RANK_COLORS[rank] ?? RANK_COLORS.Stone;

  return (
    <span
      className="text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{
        color: def.color,
        background: `${def.color}15`,
        border: `1px solid ${def.color}30`,
        boxShadow: def.glow,
      }}
    >
      {rank}
    </span>
  );
}

// ─── Position Indicator ─────────────────────

function Position({ index }: { index: number }) {
  const pos = index + 1;
  const isTop3 = pos <= 3;

  return (
    <span
      className={clsx(
        'text-sm font-black tabular-nums w-8 text-center',
        isTop3 && 'drop-shadow-sm',
      )}
      style={{ color: isTop3 ? POSITION_COLORS[pos] : 'rgba(255,255,255,0.25)' }}
    >
      {pos}
    </span>
  );
}

// ─── Row Variants ───────────────────────────

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

// ─── Main Component ─────────────────────────

export default function LeaderboardRoute() {
  const { players, totalCount } = useLoaderData<LeaderboardData>();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Background grid */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-0" aria-hidden="true">
        <defs>
          <pattern id="lb-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lb-grid)" />
      </svg>

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-16">
        {/* Header */}
        <motion.header
          className="flex flex-col items-center gap-3 mb-10 select-none"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
          <div className="w-12 h-px bg-white/10" />
        </motion.header>

        {/* Total Registered Counter */}
        <motion.div
          className="flex justify-center mb-10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div
            className={clsx(
              'flex items-center gap-4 px-6 py-3 rounded-xl',
              'border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm',
            )}
          >
            <span className="text-[0.55rem] uppercase tracking-[0.3em] text-white/25">
              Total Registered
            </span>
            <span
              className="text-xl font-black tabular-nums tracking-tight"
              style={{ fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace' }}
            >
              {totalCount.toLocaleString()}
            </span>
          </div>
        </motion.div>

        {/* Empty State */}
        {players.length === 0 ? (
          <motion.div
            className="flex flex-col items-center gap-4 py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-2xl opacity-20">◈</span>
            <span
              className="text-[0.65rem] uppercase tracking-[0.3em] text-white/20"
              style={{ fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace' }}
            >
              No Registered Sectors Found
            </span>
            <span className="text-[0.55rem] text-white/10 max-w-xs text-center leading-relaxed">
              Be the first to register an account and claim your place on the global leaderboard.
            </span>
          </motion.div>
        ) : (
          <>
            {/* Table Header */}
            <div className="flex items-center gap-3 px-4 pb-3 border-b border-white/[0.06]">
              <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 w-8 text-center">
                #
              </span>
              <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 flex-1">
                Player
              </span>
              <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 w-16 text-center">
                Rank
              </span>
              <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 w-20 text-right">
                XP
              </span>
              <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 w-14 text-right">
                Games
              </span>
            </div>

            {/* Rows */}
            <div className="flex flex-col">
              {players.map((player, i) => {
                const pos = i + 1;
                const isTop3 = pos <= 3;
                const podium = PODIUM_GLOW[pos];

                return (
                  <motion.div
                    key={player.id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3',
                      'transition-colors duration-150',
                      'hover:bg-white/[0.02]',
                      !isTop3 && 'border-b border-white/[0.03]',
                    )}
                    style={
                      isTop3 && podium
                        ? {
                            border: `1px solid ${podium.border}`,
                            borderRadius: '0.75rem',
                            marginTop: i === 0 ? 0 : '0.375rem',
                            marginBottom: '0.375rem',
                            boxShadow: podium.shadow,
                            background: 'rgba(255,255,255,0.015)',
                          }
                        : undefined
                    }
                  >
                    <Position index={i} />

                    <span
                      className={clsx(
                        'flex-1 text-sm font-semibold truncate',
                        isTop3 ? 'text-white/90' : 'text-white/60',
                      )}
                    >
                      {player.username}
                    </span>

                    <div className="w-16 flex justify-center">
                      <RankBadge rank={player.rank} />
                    </div>

                    <span
                      className={clsx(
                        'w-20 text-right text-sm font-bold tabular-nums',
                        isTop3 ? 'text-white/80' : 'text-white/40',
                      )}
                      style={{ fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace' }}
                    >
                      {player.xp.toLocaleString()}
                    </span>

                    <span
                      className="w-14 text-right text-xs tabular-nums text-white/25"
                      style={{ fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace' }}
                    >
                      {player.gamesPlayed}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Rank Legend */}
            <motion.div
              className="mt-12 flex flex-wrap justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {RANK_THRESHOLDS.map((r) => {
                const def = RANK_COLORS[r.name] ?? RANK_COLORS.Stone;
                return (
                  <span
                    key={r.name}
                    className="text-[0.5rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      color: def.color,
                      background: `${def.color}10`,
                      border: `1px solid ${def.color}20`,
                    }}
                  >
                    {r.name} · {r.minXp.toLocaleString()}+
                  </span>
                );
              })}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
