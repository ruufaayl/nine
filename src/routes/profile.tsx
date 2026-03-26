// ──────────────────────────────────────────────
// NINE — Profile Dashboard Route (client-side)
// ──────────────────────────────────────────────

import {
  redirect,
  useLoaderData,
  useNavigate,
  useRouteError,
  isRouteErrorResponse,
  Form,
  useNavigation,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from 'react-router';
import { motion } from 'framer-motion';
import clsx from 'clsx';

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

// ─── Loader (fetch-based) ───────────────────

export const loader = async (_args: LoaderFunctionArgs) => {
  const res = await fetch('/api/me', { credentials: 'include' });

  if (!res.ok) {
    return redirect('/auth');
  }

  const data = await res.json();

  if (!data.user) {
    return redirect('/auth');
  }

  // Fetch recent scores
  let recentScores: Array<{
    id: string;
    modeId: string;
    score: number;
    timeMs: number;
    createdAt: string;
  }> = [];

  try {
    const scoresRes = await fetch('/api/profile/scores', { credentials: 'include' });
    if (scoresRes.ok) {
      const scoresData = await scoresRes.json();
      recentScores = scoresData.scores ?? [];
    }
  } catch {
    // Scores unavailable — continue without them
  }

  return Response.json({
    user: data.user,
    recentScores,
  });
};

// ─── Action (Logout — fetch-based) ──────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  if (intent === 'logout') {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ intent: 'logout' }),
    });

    // Even if server fails, redirect to auth
    return redirect('/auth');
  }

  return Response.json({ error: 'Invalid action.' }, { status: 400 });
};

// ─── Error Boundary ─────────────────────────

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let detail = 'An unknown error occurred.';
  if (isRouteErrorResponse(error)) {
    detail = `${error.status} — ${error.statusText || 'Unexpected response'}`;
  } else if (error instanceof Error) {
    detail = error.message;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0a0a0f',
        color: '#fff',
        padding: '1.5rem',
      }}
    >
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          maxWidth: '22rem',
          textAlign: 'center',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
          Profile Unavailable
        </h2>
        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          {detail}
        </p>
        <motion.button
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            cursor: 'pointer',
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
        >
          Return to Lobby
        </motion.button>
      </motion.div>
    </div>
  );
}

// ─── Types ──────────────────────────────────

interface ProfileData {
  user: {
    id: string;
    username: string;
    email: string;
    rank: string;
    xp: number;
    isGuest: boolean;
    createdAt: string;
  };
  recentScores: Array<{
    id: string;
    modeId: string;
    score: number;
    timeMs: number;
    createdAt: string;
  }>;
}

// ─── Component ──────────────────────────────

export default function ProfileRoute() {
  const { user, recentScores } = useLoaderData<ProfileData>();
  const navigation = useNavigation();
  const isLoggingOut = navigation.state === 'submitting';

  const rankDef = RANK_COLORS[user.rank] ?? RANK_COLORS.Stone;
  const joined = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Background grid */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-0" aria-hidden="true">
        <defs>
          <pattern id="profile-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#profile-grid)" />
      </svg>

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-16">
        {/* Header */}
        <motion.header
          className="flex flex-col items-center gap-4 mb-12 select-none"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-black tracking-tight">Profile</h1>
          <div className="w-12 h-px bg-white/10" />
        </motion.header>

        {/* Identity Card */}
        <motion.div
          className={clsx(
            'rounded-2xl p-8 mb-8',
            'border border-white/[0.08]',
            'bg-white/[0.03] backdrop-blur-xl',
          )}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar circle */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black"
                style={{
                  background: `${rankDef.color}15`,
                  border: `2px solid ${rankDef.color}40`,
                  color: rankDef.color,
                  boxShadow: rankDef.glow,
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white/90">{user.username}</span>
                  {user.isGuest && (
                    <span className="text-[0.5rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/80">
                      Guest
                    </span>
                  )}
                </div>
                <span className="text-[0.65rem] text-white/25">{user.email}</span>
              </div>
            </div>

            {/* Rank badge */}
            <span
              className="text-[0.65rem] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
              style={{
                color: rankDef.color,
                background: `${rankDef.color}15`,
                border: `1px solid ${rankDef.color}30`,
                boxShadow: rankDef.glow,
              }}
            >
              {user.rank}
            </span>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <StatBlock label="Total XP" value={user.xp.toLocaleString()} />
            <StatBlock label="Games Played" value={String(recentScores.length)} />
            <StatBlock label="Joined" value={joined} />
          </div>
        </motion.div>

        {/* Guest Warning */}
        {user.isGuest && (
          <motion.div
            className="flex items-start gap-3 px-5 py-4 mb-8 rounded-xl border border-amber-500/15 bg-amber-500/[0.04]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-amber-400 text-lg mt-0.5">⚠</span>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-amber-400/80">Temporary Account</span>
              <span className="text-[0.65rem] text-white/30 leading-relaxed">
                Logging out will permanently delete your account, scores, and all
                associated data from the leaderboard. This cannot be undone.
              </span>
            </div>
          </motion.div>
        )}

        {/* Recent Scores */}
        <motion.div
          className={clsx(
            'rounded-2xl p-6 mb-8',
            'border border-white/[0.08]',
            'bg-white/[0.03] backdrop-blur-xl',
          )}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-white/50 mb-5">
            Recent Games
          </h2>

          {recentScores.length === 0 ? (
            <p className="text-sm text-white/20 text-center py-8">
              No games played yet. Hit the lobby.
            </p>
          ) : (
            <div className="flex flex-col">
              {/* Table header */}
              <div className="flex items-center gap-3 px-3 pb-3 border-b border-white/[0.06]">
                <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 flex-1">Mode</span>
                <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 w-16 text-right">Score</span>
                <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 w-16 text-right">Time</span>
                <span className="text-[0.5rem] uppercase tracking-[0.2em] text-white/20 w-20 text-right">Date</span>
              </div>

              {recentScores.map((s, i) => (
                <motion.div
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                >
                  <span className="flex-1 text-sm font-semibold text-white/60 truncate">
                    {formatModeId(s.modeId)}
                  </span>
                  <span className="w-16 text-right text-sm font-bold tabular-nums text-white/50">
                    {s.score.toLocaleString()}
                  </span>
                  <span className="w-16 text-right text-xs tabular-nums text-white/30">
                    {formatTime(s.timeMs)}
                  </span>
                  <span className="w-20 text-right text-[0.65rem] tabular-nums text-white/20">
                    {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Logout */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Form method="post" action="/profile">
            <input type="hidden" name="intent" value="logout" />
            <motion.button
              id="logout-btn"
              type="submit"
              disabled={isLoggingOut}
              className={clsx(
                'px-8 py-3 rounded-xl text-[0.7rem] font-bold uppercase tracking-[0.15em]',
                'border border-red-500/20 bg-red-500/[0.06]',
                'text-red-400/70 hover:text-red-400',
                'transition-colors duration-150 outline-none',
                isLoggingOut && 'opacity-50 cursor-wait',
              )}
              whileHover={!isLoggingOut ? { scale: 1.03, borderColor: 'rgba(239,68,68,0.35)' } : undefined}
              whileTap={!isLoggingOut ? { scale: 0.97 } : undefined}
            >
              {isLoggingOut
                ? 'Logging out…'
                : user.isGuest
                  ? 'Log Out & Delete All Data'
                  : 'Log Out'}
            </motion.button>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <span className="text-lg font-black tabular-nums text-white/80">{value}</span>
      <span className="text-[0.5rem] uppercase tracking-[0.15em] text-white/25">{label}</span>
    </div>
  );
}

function formatModeId(modeId: string): string {
  return modeId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}
