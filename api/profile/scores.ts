// ──────────────────────────────────────────────
// NINE — /api/profile/scores (Vercel Serverless Function)
// GET /api/profile/scores — returns recent scores for current user
//
// PERF: single JOIN for auth, single query for scores = 2 total (was 3)
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, gt, desc, sql } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { users, sessions, scores } from '../../src/db/schema.js';

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
    return res.status(200).json({ scores: [] });
  }

  try {
    // ── Auth: single JOIN (session + user) ──
    const [authRow] = await db
      .select({ userId: users.id })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.id, sessionId),
          gt(sessions.expiresAt, sql`now()`),
        ),
      )
      .limit(1);

    if (!authRow) {
      return res.status(200).json({ scores: [] });
    }

    // ── Scores: single query with index on (user_id, created_at) ──
    const rows = await db
      .select({
        id: scores.id,
        modeId: scores.modeId,
        score: scores.score,
        timeMs: scores.timeMs,
        createdAt: scores.createdAt,
      })
      .from(scores)
      .where(eq(scores.userId, authRow.userId))
      .orderBy(desc(scores.createdAt))
      .limit(10);

    return res.status(200).json({ scores: rows });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error.';
    return res.status(500).json({ scores: [], error: msg });
  }
}
