// ──────────────────────────────────────────────
// NINE — Auth API (server-side resource route)
// ──────────────────────────────────────────────

import type { ActionFunctionArgs } from 'react-router';
import {
  createUser,
  createSession,
  verifyLogin,
  serializeSessionCookie,
  validateLogin,
  validateSignup,
  type AuthErrors,
} from '../lib/auth.server';

// POST /api/auth
// Body: { intent: 'login'|'signup', email, password, username? }

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json() as {
    intent?: string;
    email?: string;
    password?: string;
    username?: string;
  };

  const { intent, email = '', password = '', username = '' } = body;

  // ── LOGIN ──
  if (intent === 'login') {
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

    return Response.json(
      { success: true, user: { id: user.id, username: user.username } },
      {
        status: 200,
        headers: { 'Set-Cookie': serializeSessionCookie(sessionId) },
      },
    );
  }

  // ── SIGNUP ──
  if (intent === 'signup') {
    const validationErrors = validateSignup(username, email, password);
    if (validationErrors) {
      return Response.json({ errors: validationErrors }, { status: 400 });
    }

    try {
      const user = await createUser(username, email, password);
      const sessionId = await createSession(user.id);

      return Response.json(
        { success: true, user: { id: user.id, username: user.username } },
        {
          status: 200,
          headers: { 'Set-Cookie': serializeSessionCookie(sessionId) },
        },
      );
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

  return Response.json({ errors: { form: 'Invalid request.' } }, { status: 400 });
}
