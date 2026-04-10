// ──────────────────────────────────────────────
// NINE — App Layout (Premium Nav)
// Frosted header · currency chips · fluid bottom nav
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

// ─── Theme Toggle ───────────────────────────

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-8 h-8 flex items-center justify-center outline-none cursor-pointer"
      style={{
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="text-xs"
          >
            ☀️
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="text-xs"
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
  { label: 'Home',    path: '/',         glyph: '⌂' },
  { label: 'Play',    path: '/play',     glyph: '▶' },
  { label: 'Social',  path: '/social',   glyph: '●●' },
  { label: 'Ranks',   path: '/rankings', glyph: '◆' },
  { label: 'Profile', path: '/me',       glyph: '○' },
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
      {/* ── Top Header ── */}
      <motion.header
        className="flex items-center justify-between h-13 px-5"
        style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--nav-border)',
        }}
        initial={{ y: -52, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="outline-none cursor-pointer"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          <span
            className="text-[1.05rem] font-black tracking-[-0.04em]"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            NINE
          </span>
        </button>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user && (
            <>
              {/* Coins chip */}
              <div
                className="flex items-center gap-1 px-2.5 py-1"
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <span className="text-[0.6rem]">🪙</span>
                <span
                  className="text-[0.65rem] font-bold tabular-nums"
                  style={{ color: '#B45309', fontFamily: 'var(--font-numeric)' }}
                >
                  {(user.coins ?? 5000).toLocaleString()}
                </span>
              </div>

              {/* Trophies chip */}
              <div
                className="flex items-center gap-1 px-2.5 py-1"
                style={{
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <span className="text-[0.6rem]">🏆</span>
                <span
                  className="text-[0.65rem] font-bold tabular-nums"
                  style={{ color: '#7C3AED', fontFamily: 'var(--font-numeric)' }}
                >
                  {(user.trophies ?? 0).toLocaleString()}
                </span>
              </div>
            </>
          )}

          {/* Avatar or Sign In */}
          {user ? (
            <button
              onClick={() => navigate('/me')}
              className="outline-none cursor-pointer ml-0.5"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
            </button>
          ) : (
            <motion.button
              onClick={() => navigate('/auth')}
              className="text-[0.65rem] font-bold px-4 py-1.5 cursor-pointer"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'var(--accent-primary)',
                color: '#fff',
                borderRadius: 'var(--radius-full)',
                border: 'none',
              }}
              whileHover={{ scale: 1.03 }}
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

      {/* ── Bottom Nav ── */}
      <nav
        className="relative z-50"
        style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--nav-border)',
        }}
      >
        <div className="flex items-center justify-around h-14 px-2 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item === activeTab;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={clsx(
                  'relative flex flex-col items-center justify-center gap-0.5',
                  'w-14 py-1.5 outline-none cursor-pointer',
                  'transition-all duration-200',
                )}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: 'none',
                  border: 'none',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0"
                    style={{
                      background: 'rgba(108, 99, 255, 0.08)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <span
                  className="relative text-[0.85rem] leading-none transition-colors duration-200"
                  style={{
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  {item.glyph}
                </span>
                <span
                  className="relative text-[0.55rem] font-semibold tracking-[0.06em] transition-colors duration-200"
                  style={{
                    fontFamily: 'var(--font-body)',
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
