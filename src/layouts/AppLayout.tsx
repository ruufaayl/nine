// ──────────────────────────────────────────────
// NINE — App Layout (Liquid Nav + Theme Toggle)
// ──────────────────────────────────────────────

import { Outlet, useNavigate, useLocation, useLoaderData, useOutletContext } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useTheme } from '../hooks/useTheme';
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
  coins: number;
  trophies: number;
  level: number;
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

// ─── Theme Toggle Button ────────────────────

function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-9 h-9 flex items-center justify-center outline-none cursor-pointer"
      style={{
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
      whileHover={{ scale: 1.08, borderColor: 'var(--border-default)' }}
      whileTap={{ scale: 0.92 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="text-sm"
          >
            ☀️
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="text-sm"
          >
            🌙
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Nav Items ──────────────────────────────

const NAV_ITEMS = [
  { label: 'Home',     path: '/',         icon: '⌂' },
  { label: 'Play',     path: '/play',     icon: '▶' },
  { label: 'Social',   path: '/social',   icon: '●●' },
  { label: 'Ranks',    path: '/rankings', icon: '◆' },
  { label: 'Profile',  path: '/me',       icon: '○' },
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
    <div className="mobile-shell">
      {/* ── Top Header Bar ── */}
      <motion.header
        className={clsx(
          'flex items-center justify-between',
          'h-14 px-5',
        )}
        style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--nav-border)',
        }}
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 outline-none group"
        >
          <span
            className="text-lg font-extrabold tracking-tight group-hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            NINE
          </span>
        </button>

        {/* Right: Theme toggle + Coins + Trophies + User */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {user && (
            <>
              {/* Coins */}
              <div className="pill pill-gold gap-1.5">
                <span style={{ fontSize: '0.7rem' }}>🪙</span>
                <span className="tabular-nums">{(user.coins ?? 5000).toLocaleString()}</span>
              </div>
              {/* Trophies */}
              <div className="pill pill-trophy gap-1.5">
                <span style={{ fontSize: '0.7rem' }}>🏆</span>
                <span className="tabular-nums">{(user.trophies ?? 0).toLocaleString()}</span>
              </div>
            </>
          )}

          {user ? (
            <button
              onClick={() => navigate('/me')}
              className="flex items-center gap-2.5 outline-none group ml-0.5"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'var(--accent-primary)',
                  color: '#fff',
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
            </button>
          ) : (
            <motion.button
              onClick={() => navigate('/auth')}
              className={clsx(
                'text-xs font-semibold',
                'px-5 py-2',
                'transition-all duration-200',
              )}
              style={{
                fontFamily: 'var(--font-primary)',
                background: 'var(--accent-primary)',
                color: '#fff',
                borderRadius: 'var(--radius-full)',
                border: 'none',
              }}
              whileHover={{ scale: 1.03, opacity: 0.9 }}
              whileTap={{ scale: 0.97 }}
            >
              Sign In
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* ── Main Content ── */}
      <main>
        <Outlet context={{ user } satisfies AppContext} />
      </main>

      {/* ── Bottom Nav Bar ── */}
      <nav
        className="relative z-50"
        style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--nav-border)',
        }}
      >
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item === activeTab;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={clsx(
                  'relative flex flex-col items-center justify-center gap-1',
                  'w-16 py-1.5 outline-none',
                  'transition-all duration-200',
                )}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0"
                    style={{
                      background: 'rgba(108, 99, 255, 0.1)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <span
                  className="relative text-sm leading-none transition-colors duration-200"
                  style={{
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  {item.icon}
                </span>
                <span
                  className="relative text-[0.6rem] font-semibold tracking-wide transition-colors duration-200"
                  style={{
                    fontFamily: 'var(--font-primary)',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
