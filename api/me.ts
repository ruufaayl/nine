// ──────────────────────────────────────────────
// NINE — /api/me (Vercel Serverless Function)
// GET /api/me — returns current user from session cookie
//
// PERF: single JOIN query (session + user) instead of 2 sequential SELECTs
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, gt, sql } from 'drizzle-orm';
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
    return res.status(200).json({ user: null });
  }

  // Cache-Control: private (user-specific), revalidate after 10s
  res.setHeader('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');

  try {
    // ── Single JOIN: session + user in one round-trip ──
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        rank: users.rank,
        xp: users.xp,
        isGuest: users.isGuest,
        createdAt: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.id, sessionId),
          gt(sessions.expiresAt, sql`now()`),
        ),
      )
      .limit(1);

    const user = rows[0] ?? null;

    return res.status(200).json({ user });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error.';
    return res.status(500).json({ user: null, error: msg });
  }
}
