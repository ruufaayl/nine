// ──────────────────────────────────────────────
// NINE — Global Header
// ──────────────────────────────────────────────

import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ─── Types ──────────────────────────────────

export interface HeaderUser {
  id: string;
  username: string;
  rank: string;
  xp: number;
}

interface HeaderProps {
  user: HeaderUser | null;
}

// ─── Rank Colors ────────────────────────────

const RANK_COLORS: Record<string, string> = {
  Stone:    '#6b7280',
  Bronze:   '#cd7f32',
  Silver:   '#c0c0c0',
  Gold:     '#fbbf24',
  Platinum: '#a5b4fc',
  Diamond:  '#22d3ee',
  Legend:   '#f472b6',
};

// ─── Component ──────────────────────────────

export function Header({ user }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <motion.header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50',
        'flex items-center justify-between',
        'h-12 px-5',
        'border-b border-white/[0.06]',
        'bg-[#0a0a0f]/80 backdrop-blur-md',
      )}
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 outline-none group"
      >
        <span className="text-base font-black tracking-tighter text-white group-hover:text-white/80 transition-colors">
          NINE
        </span>
        <span className="text-[0.45rem] uppercase tracking-[0.3em] text-white/15 hidden sm:inline">
          Protocol
        </span>
      </button>

      {/* Nav */}
      <div className="flex items-center gap-4">
        {/* Leaderboard link */}
        <button
          onClick={() => navigate('/leaderboard')}
          className="text-[0.55rem] uppercase tracking-[0.2em] text-white/20 hover:text-white/50 transition-colors"
        >
          Leaderboard
        </button>

        {user ? (
          /* ── Authenticated ── */
          <div className="flex items-center gap-3">
            {/* XP */}
            <span className="text-[0.6rem] font-bold tabular-nums text-white/30">
              {user.xp.toLocaleString()}
              <span className="text-[0.45rem] uppercase tracking-widest ml-0.5 opacity-50">
                xp
              </span>
            </span>

            {/* Rank badge */}
            <span
              className="text-[0.5rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                color: RANK_COLORS[user.rank] ?? '#6b7280',
                background: `${RANK_COLORS[user.rank] ?? '#6b7280'}15`,
                border: `1px solid ${RANK_COLORS[user.rank] ?? '#6b7280'}30`,
              }}
            >
              {user.rank}
            </span>

            {/* Username */}
            <span className="text-xs font-semibold text-white/70 max-w-[100px] truncate">
              {user.username}
            </span>
          </div>
        ) : (
          /* ── Guest ── */
          <motion.button
            onClick={() => navigate('/auth')}
            className={clsx(
              'text-[0.6rem] font-bold uppercase tracking-[0.15em]',
              'px-4 py-1.5 rounded-lg',
              'border border-white/10',
              'text-white/50 hover:text-white/80',
              'hover:border-white/25',
              'transition-colors duration-150',
            )}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Log In / Sign Up
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}
