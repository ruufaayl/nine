// ──────────────────────────────────────────────
// NINE — Global Leaderboard Route
// ──────────────────────────────────────────────

import type { LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { db } from '../db';
import { users, scores } from '../db/schema';
import { desc, eq, sql, count } from 'drizzle-orm';
import {
  RANKS,
  getRankDefinition,
  type RankDefinition,
} from '../lib/progression.server';

// ─── Types ──────────────────────────────────

interface LeaderboardEntry {
  id: string;
  username: string;
  xp: number;
  rank: string;
  gamesPlayed: number;
}

// ─── Loader ─────────────────────────────────

export async function loader(_args: LoaderFunctionArgs) {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      xp: users.xp,
      rank: users.rank,
      gamesPlayed: count(scores.id),
    })
    .from(users)
    .leftJoin(scores, eq(users.id, scores.userId))
    .groupBy(users.id)
    .orderBy(desc(users.xp))
    .limit(50);

  return { entries: rows as LeaderboardEntry[] };
}

// ─── Rank Badge ─────────────────────────────

function RankBadge({ rank }: { rank: string }) {
  const def = getRankDefinition(rank);

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

  const colors: Record<number, string> = {
    1: '#fbbf24', // gold
    2: '#c0c0c0', // silver
    3: '#cd7f32', // bronze
  };

  return (
    <span
      className={clsx(
        'text-sm font-black tabular-nums w-8 text-center',
        isTop3 ? 'drop-shadow-sm' : '',
      )}
      style={{
        color: isTop3 ? colors[pos] : 'rgba(255,255,255,0.25)',
      }}
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
      delay: i * 0.05,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

// ─── Main Component ─────────────────────────

export default function LeaderboardRoute() {
  const { entries } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Background grid */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        aria-hidden="true"
      >
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
          className="flex flex-col items-center gap-3 mb-12 select-none"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-white/25">
            Top 50 · Global Rankings
          </p>
          <div className="w-12 h-px bg-white/10 mt-1" />
        </motion.header>

        {/* Table Header */}
        <div className="flex items-center gap-3 px-4 pb-3 border-b border-white/[0.06]">
          <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 w-8 text-center">#</span>
          <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 flex-1">Player</span>
          <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 w-16 text-center">Rank</span>
          <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 w-20 text-right">XP</span>
          <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 w-14 text-right">Games</span>
        </div>

        {/* Rows */}
        <div className="flex flex-col">
          {entries.length === 0 && (
            <div className="py-16 text-center text-white/20 text-sm">
              No players yet. Be the first.
            </div>
          )}
          {entries.map((entry, i) => {
            const isTop3 = i < 3;

            return (
              <motion.div
                key={entry.id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                className={clsx(
                  'flex items-center gap-3 px-4 py-3',
                  'border-b border-white/[0.03]',
                  'transition-colors duration-150',
                  'hover:bg-white/[0.02]',
                  isTop3 && 'bg-white/[0.01]',
                )}
              >
                <Position index={i} />

                {/* Username */}
                <span
                  className={clsx(
                    'flex-1 text-sm font-semibold truncate',
                    isTop3 ? 'text-white/90' : 'text-white/60',
                  )}
                >
                  {entry.username}
                </span>

                {/* Rank Badge */}
                <div className="w-16 flex justify-center">
                  <RankBadge rank={entry.rank} />
                </div>

                {/* XP */}
                <span
                  className={clsx(
                    'w-20 text-right text-sm font-bold tabular-nums',
                    isTop3 ? 'text-white/80' : 'text-white/40',
                  )}
                >
                  {entry.xp.toLocaleString()}
                </span>

                {/* Games Played */}
                <span className="w-14 text-right text-xs tabular-nums text-white/25">
                  {entry.gamesPlayed}
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
          {RANKS.map((r) => (
            <span
              key={r.name}
              className="text-[0.5rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                color: r.color,
                background: `${r.color}10`,
                border: `1px solid ${r.color}20`,
              }}
            >
              {r.name} · {r.minXp.toLocaleString()}+
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
