// ──────────────────────────────────────────────
// NINE — /api/profile/scores (Vercel Serverless Function)
// GET /api/profile/scores — returns recent scores for current user
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db';
import { users, sessions, scores } from '../../src/db/schema';

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
    return res.status(405).json({ scores: [] });
  }

  const sessionId = getSessionId(req);
  if (!sessionId) {
    return res.status(401).json({ scores: [] });
  }

  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ scores: [] });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ scores: [] });
    }

    const rows = await db
      .select({
        id: scores.id,
        modeId: scores.modeId,
        score: scores.score,
        timeMs: scores.timeMs,
        createdAt: scores.createdAt,
      })
      .from(scores)
      .where(eq(scores.userId, user.id))
      .orderBy(scores.createdAt)
      .limit(10);

    return res.status(200).json({ scores: rows });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error.';
    return res.status(500).json({ scores: [], error: msg });
  }
}
