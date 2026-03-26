// ──────────────────────────────────────────────
// NINE — Auth Route (self-contained action)
// ──────────────────────────────────────────────

import {
  redirect,
  useNavigate,
  useRouteError,
  isRouteErrorResponse,
  type ActionFunctionArgs,
} from 'react-router';
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
    return Response.json({ errors }, { status: 400 });
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
    return Response.json(
      { errors: { form: 'Something went wrong. Please try again.' } },
      { status: 500 },
    );
  }
};

// ─── Error Boundary ─────────────────────────

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error('[auth] Route error:', error);

  // Extract a human-readable message
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
        {/* Pulsing icon */}
        <motion.span
          style={{ fontSize: '3rem', opacity: 0.4 }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ◈
        </motion.span>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 900,
            letterSpacing: '0.05em',
            color: 'rgba(255,255,255,0.8)',
            margin: 0,
          }}
        >
          Authentication Service Offline
        </h2>

        <p
          style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.3)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          The identity protocol encountered an error. This is likely a temporary
          issue with the server connection.
        </p>

        {/* Error detail (collapsed) */}
        <details style={{ width: '100%', textAlign: 'left' }}>
          <summary
            style={{
              fontSize: '0.55rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.15)',
              cursor: 'pointer',
            }}
          >
            Technical Details
          </summary>
          <pre
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.25)',
              overflow: 'auto',
              maxHeight: '8rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {detail}
          </pre>
        </details>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
          <motion.button
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.25)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
          >
            Return to Lobby
          </motion.button>
          <motion.button
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'rgba(74,144,226,0.2)',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#4a90e2',
              cursor: 'pointer',
            }}
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
