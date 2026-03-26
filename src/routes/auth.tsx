// ──────────────────────────────────────────────
// NINE — Auth Route (self-contained action)
// ──────────────────────────────────────────────

import { redirect, useNavigate, useRouteError, type ActionFunctionArgs } from 'react-router';
import { motion } from 'framer-motion';
import { AuthForm } from '../components/Auth/AuthForm';

// ─── Action ─────────────────────────────────
// Fired by <Form method="post" action="/auth">
// Runs entirely in the browser (client-side data router).
// No server fetch — validates + stores session locally.

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const email = (formData.get('email') as string) ?? '';
  const password = (formData.get('password') as string) ?? '';
  const username = (formData.get('username') as string) ?? '';

  // ── Validation ──
  const errors: Record<string, string> = {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'A valid email is required.';
  }
  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (intent === 'signup') {
    if (!username || username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    }
    if (username.trim().length > 32) {
      errors.username = 'Username must be 32 characters or fewer.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // ── Session ──
  // In SPA mode we store a lightweight session in localStorage.
  // When the server-side API is deployed, this block will be
  // replaced with a real fetch to /api/auth.
  try {
    const guestUser = {
      id: crypto.randomUUID(),
      username: intent === 'signup' ? username.trim() : email.split('@')[0],
      email: email.trim().toLowerCase(),
      rank: 'Stone',
      xp: 0,
      createdAt: Date.now(),
    };

    localStorage.setItem('nine_session', JSON.stringify(guestUser));

    return redirect('/');
  } catch {
    return {
      errors: { form: 'Something went wrong. Please try again.' },
    };
  }
};

// ─── Error Boundary ─────────────────────────

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error('[auth] Route error:', error);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] text-white px-6">
      <motion.div
        className="flex flex-col items-center gap-6 max-w-sm text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Icon */}
        <motion.span
          className="text-5xl opacity-40"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ◈
        </motion.span>

        <h2 className="text-xl font-black tracking-wide text-white/80">
          Authentication Service Offline
        </h2>

        <p className="text-xs text-white/30 leading-relaxed">
          The identity protocol encountered an error. This is likely a temporary
          issue with the server connection.
        </p>

        {/* Error detail (collapsed) */}
        <details className="w-full text-left">
          <summary className="text-[0.55rem] uppercase tracking-widest text-white/15 cursor-pointer hover:text-white/30 transition-colors">
            Technical Details
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[0.6rem] text-white/25 overflow-auto max-h-32">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </details>

        {/* Actions */}
        <div className="flex gap-3 w-full mt-2">
          <motion.button
            className="flex-1 py-3 rounded-lg border border-white/10 text-xs font-semibold uppercase tracking-widest text-white/40"
            whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.25)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
          >
            Return to Lobby
          </motion.button>
          <motion.button
            className="flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(74,144,226,0.2)', color: '#4a90e2' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(0)}
          >
            Retry
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Component ──────────────────────────────

export default function AuthRoute() {
  return <AuthForm />;
}
