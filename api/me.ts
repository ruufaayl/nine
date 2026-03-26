// ──────────────────────────────────────────────
// NINE — /api/me (Vercel Serverless Function)
// GET /api/me — returns current user from session cookie
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import { users, sessions } from '../src/db/schema.js';

const COOKIE_NAME = '__nine_session';

function getSessionId(req: VercelRequest): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (!match) return null;
  const value = match.slice(COOKIE_NAME.length + 1);
  return value || null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ user: null });
  }

  const sessionId = getSessionId(req);
  if (!sessionId) {
    return res.status(401).json({ user: null });
  }

  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ user: null });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ user: null });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        rank: user.rank,
        xp: user.xp,
        isGuest: user.isGuest,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error.';
    return res.status(500).json({ user: null, error: msg });
  }
}
