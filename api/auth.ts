// ──────────────────────────────────────────────
// NINE — Auth API (Vercel Serverless Function)
// POST /api/auth
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createUser,
  createGuestUser,
  createSession,
  destroySession,
  destroyGuestData,
  verifyLogin,
  validateLogin,
  validateSignup,
  generatePasswordResetToken,
  serializeSessionCookie,
  clearSessionCookie,
  type AuthErrors,
} from '../src/lib/auth.server.js';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import { sessions, users } from '../src/db/schema.js';

const COOKIE_NAME = '__nine_session';

function parseSessionId(cookieHeader: string): string | null {
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return match ? match.slice(COOKIE_NAME.length + 1) || null : null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ errors: { form: 'Method not allowed.' } });
  }

  const { intent, email, password, username } = req.body as {
    intent?: string;
    email?: string;
    password?: string;
    username?: string;
  };

  // ── LOGIN ──────────────────────────────────
  if (intent === 'login') {
    const validationErrors = validateLogin(email ?? '', password ?? '');
    if (validationErrors) {
      return res.status(400).json({ errors: validationErrors });
    }

    try {
      const user = await verifyLogin(email ?? '', password ?? '');
      if (!user) {
        return res.status(400).json({
          errors: { form: 'Invalid credentials.' } satisfies AuthErrors,
        });
      }

      const sessionId = await createSession(user.id);

      res.setHeader('Set-Cookie', serializeSessionCookie(sessionId));
      return res.status(200).json({
        success: true,
        user: { id: user.id, username: user.username },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Login failed.';
      return res.status(500).json({ errors: { form: msg } });
    }
  }

  // ── SIGNUP ─────────────────────────────────
  if (intent === 'signup') {
    const validationErrors = validateSignup(
      username ?? '',
      email ?? '',
      password ?? '',
    );
    if (validationErrors) {
      return res.status(400).json({ errors: validationErrors });
    }

    try {
      const user = await createUser(
        username ?? '',
        email ?? '',
        password ?? '',
      );
      const sessionId = await createSession(user.id);

      res.setHeader('Set-Cookie', serializeSessionCookie(sessionId));
      return res.status(200).json({
        success: true,
        user: { id: user.id, username: user.username },
      });
    } catch (error: unknown) {
      const pgError = error as { code?: string; detail?: string };

      if (pgError.code === '23505') {
        const detail = pgError.detail?.toLowerCase() ?? '';
        if (detail.includes('email')) {
          return res.status(400).json({
            errors: { email: 'Email already in use.' } satisfies AuthErrors,
          });
        }
        if (detail.includes('username')) {
          return res.status(400).json({
            errors: { username: 'Username taken.' } satisfies AuthErrors,
          });
        }
        return res.status(400).json({
          errors: { form: 'Account already exists.' } satisfies AuthErrors,
        });
      }

      const msg = error instanceof Error ? error.message : 'Signup failed.';
      return res.status(500).json({ errors: { form: msg } });
    }
  }

  // ── GUEST ──────────────────────────────────
  if (intent === 'guest') {
    try {
      const guest = await createGuestUser();
      const sessionId = await createSession(guest.id);

      res.setHeader('Set-Cookie', serializeSessionCookie(sessionId));
      return res.status(200).json({
        success: true,
        user: { id: guest.id, username: guest.username },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Guest creation failed.';
      return res.status(500).json({
        errors: { form: msg },
      });
    }
  }

  // ── LOGOUT ───────────────────────────────────
  if (intent === 'logout') {
    const sessionId = parseSessionId(req.headers.cookie ?? '');

    try {
      if (sessionId) {
        // Single JOIN: session + user in one query
        const [row] = await db
          .select({
            userId: users.id,
            isGuest: users.isGuest,
          })
          .from(sessions)
          .innerJoin(users, eq(users.id, sessions.userId))
          .where(eq(sessions.id, sessionId))
          .limit(1);

        if (row?.isGuest) {
          await destroyGuestData(row.userId); // CASCADE deletes session too
        } else if (row) {
          await destroySession(sessionId);
        }
      }
    } catch {
      // Best-effort cleanup
    }

    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(200).json({ success: true });
  }

  // ── RESET PASSWORD ─────────────────────────
  if (intent === 'reset_password') {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        errors: { email: 'A valid email is required.' },
      });
    }

    try {
      const result = await generatePasswordResetToken(email);
      return res.status(200).json({ success: result.message });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Request failed.';
      return res.status(500).json({ errors: { form: msg } });
    }
  }

  // ── UNKNOWN INTENT ─────────────────────────
  return res.status(400).json({ errors: { form: 'Invalid request.' } });
}
