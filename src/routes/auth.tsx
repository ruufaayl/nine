// ──────────────────────────────────────────────
// NINE — Auth Route (server-backed action)
// ──────────────────────────────────────────────

import {
  redirect,
  useNavigate,
  useRouteError,
  isRouteErrorResponse,
  type ActionFunctionArgs,
} from 'react-router';
import { motion } from 'framer-motion';
import { AuthScreen } from '../components/Auth/AuthScreen';
import {
  createUser,
  createGuestUser,
  createSession,
  verifyLogin,
  validateLogin,
  validateSignup,
  generatePasswordResetToken,
  serializeSessionCookie,
  type AuthErrors,
} from '../lib/auth.server';

// ─── Action ─────────────────────────────────
// Handles intent = login | signup | guest | reset_password

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  // ── LOGIN ──
  if (intent === 'login') {
    const email = (formData.get('email') as string) ?? '';
    const password = (formData.get('password') as string) ?? '';

    const validationErrors = validateLogin(email, password);
    if (validationErrors) {
      return Response.json({ errors: validationErrors }, { status: 400 });
    }

    const user = await verifyLogin(email, password);
    if (!user) {
      return Response.json(
        { errors: { form: 'Invalid credentials.' } satisfies AuthErrors },
        { status: 400 },
      );
    }

    const sessionId = await createSession(user.id);

    return redirect('/', {
      headers: { 'Set-Cookie': serializeSessionCookie(sessionId) },
    });
  }

  // ── SIGNUP ──
  if (intent === 'signup') {
    const username = (formData.get('username') as string) ?? '';
    const email = (formData.get('email') as string) ?? '';
    const password = (formData.get('password') as string) ?? '';

    const validationErrors = validateSignup(username, email, password);
    if (validationErrors) {
      return Response.json({ errors: validationErrors }, { status: 400 });
    }

    try {
      const user = await createUser(username, email, password);
      const sessionId = await createSession(user.id);

      return redirect('/', {
        headers: { 'Set-Cookie': serializeSessionCookie(sessionId) },
      });
    } catch (error: unknown) {
      const pgError = error as { code?: string; detail?: string };

      if (pgError.code === '23505') {
        const detail = pgError.detail?.toLowerCase() ?? '';
        if (detail.includes('email')) {
          return Response.json(
            { errors: { email: 'Email already in use.' } satisfies AuthErrors },
            { status: 400 },
          );
        }
        if (detail.includes('username')) {
          return Response.json(
            { errors: { username: 'Username taken.' } satisfies AuthErrors },
            { status: 400 },
          );
        }
        return Response.json(
          { errors: { form: 'Account already exists.' } satisfies AuthErrors },
          { status: 400 },
        );
      }

      throw error;
    }
  }

  // ── GUEST ──
  if (intent === 'guest') {
    try {
      const guest = await createGuestUser();
      const sessionId = await createSession(guest.id);

      return redirect('/', {
        headers: { 'Set-Cookie': serializeSessionCookie(sessionId) },
      });
    } catch {
      return Response.json(
        { errors: { form: 'Failed to create guest session. Please try again.' } },
        { status: 500 },
      );
    }
  }

  // ── RESET PASSWORD ──
  if (intent === 'reset_password') {
    const email = (formData.get('email') as string) ?? '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return Response.json(
        { errors: { email: 'A valid email is required.' } },
        { status: 400 },
      );
    }

    const result = await generatePasswordResetToken(email);

    return Response.json({ success: result.message });
  }

  // ── UNKNOWN INTENT ──
  return Response.json(
    { errors: { form: 'Invalid request.' } },
    { status: 400 },
  );
};

// ─── Error Boundary ─────────────────────────

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error('[auth] Route error:', error);

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
  return <AuthScreen />;
}
