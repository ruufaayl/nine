// ──────────────────────────────────────────────
// NINE — App Layout (persistent nav)
// Wraps Home, Play, Social, Rankings, Profile
// ──────────────────────────────────────────────

import { Outlet, useNavigate, useLocation, useLoaderData, useOutletContext } from 'react-router';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { LoaderFunctionArgs } from 'react-router';

// ─── Types ──────────────────────────────────

export interface AppUser {
  id: string;
  username: string;
  email: string;
  rank: string;
  xp: number;
  rankTier: string;
  totalXp: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  avatarUrl: string | null;
  bio: string | null;
  isGuest?: boolean;
  createdAt: string;
}

export interface AppContext {
  user: AppUser | null;
}

interface AppLoaderData {
  user: AppUser | null;
}

// ─── Loader ─────────────────────────────────

export const loader = async (_args: LoaderFunctionArgs): Promise<Response> => {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) return Response.json({ user: null } satisfies AppLoaderData);
    const data = await res.json();
    return Response.json({ user: data?.user ?? null } satisfies AppLoaderData);
  } catch {
    return Response.json({ user: null } satisfies AppLoaderData);
  }
};

// ─── Hook for child routes ──────────────────

export function useUser(): AppUser | null {
  const ctx = useOutletContext<AppContext>();
  return ctx?.user ?? null;
}

// ─── Nav Items ──────────────────────────────

const NAV_ITEMS = [
  { label: 'Home',     path: '/',            icon: '⬡' },
  { label: 'Play',     path: '/play',        icon: '◈' },
  { label: 'Social',   path: '/social',      icon: '⟁' },
  { label: 'Rankings', path: '/rankings',    icon: '⧖' },
  { label: 'Profile',  path: '/me',          icon: '◇' },
] as const;

// ─── Component ──────────────────────────────

export default function AppLayout() {
  const { user } = useLoaderData<AppLoaderData>();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = NAV_ITEMS.find((n) =>
    n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path),
  );

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--bg-obsidian)' }}>
      {/* ── Top Header Bar ── */}
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
        <button onClick={() => navigate('/')} className="flex items-center gap-2 outline-none group">
          <span className="text-base font-black tracking-tighter text-white group-hover:text-white/80 transition-colors">
            NINE
          </span>
          <span className="text-[0.45rem] uppercase tracking-[0.3em] text-white/15 hidden sm:inline">
            Protocol
          </span>
        </button>

        {/* User info / Auth CTA */}
        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={() => navigate('/me')} className="flex items-center gap-2 outline-none group">
              <span className="text-[0.6rem] font-bold tabular-nums text-white/30 group-hover:text-white/50 transition-colors">
                {user.xp.toLocaleString()}
                <span className="text-[0.45rem] uppercase tracking-widest ml-0.5 opacity-50">xp</span>
              </span>
              <span className="text-xs font-semibold text-white/70 max-w-[100px] truncate group-hover:text-white/90 transition-colors">
                {user.username}
              </span>
            </button>
          ) : (
            <motion.button
              onClick={() => navigate('/auth')}
              className={clsx(
                'text-[0.6rem] font-bold uppercase tracking-[0.15em]',
                'px-4 py-1.5 rounded-lg',
                'border border-white/10 text-white/50 hover:text-white/80 hover:border-white/25',
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

      {/* ── Main Content ── */}
      <div className="pt-12">
        <Outlet context={{ user } satisfies AppContext} />
      </div>

      {/* ── Bottom Nav Bar ── */}
      <nav
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-50',
          'flex items-center justify-around',
          'h-14 px-2',
          'border-t border-white/[0.06]',
          'bg-[#0a0a0f]/90 backdrop-blur-lg',
        )}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item === activeTab;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5',
                'w-16 py-1 rounded-lg outline-none',
                'transition-colors duration-150',
                isActive ? 'text-white' : 'text-white/25 hover:text-white/50',
              )}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span
                className="text-[0.5rem] font-bold uppercase tracking-[0.15em]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {item.label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="w-1 h-1 rounded-full mt-0.5"
                  style={{ background: 'var(--cyber-cyan)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
