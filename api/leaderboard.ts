// ──────────────────────────────────────────────
// NINE — /api/leaderboard (Vercel Serverless Function)
// GET /api/leaderboard — global rankings, registered users only
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, desc, count, sql } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import { users, scores } from '../src/db/schema.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ players: [], totalCount: 0 });
  }

  // Cache for 30s on Vercel edge — leaderboard doesn't need real-time updates
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  try {
    // ── Total registered count (fast, single aggregate) ──
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.isGuest, false));

    // ── Top 100 registered players ranked by XP ──
    //    Left-join scores to get gamesPlayed count per user.
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        xp: users.xp,
        rank: users.rank,
        gamesPlayed: count(scores.id),
      })
      .from(users)
      .leftJoin(scores, eq(scores.userId, users.id))
      .where(eq(users.isGuest, false))
      .groupBy(users.id)
      .orderBy(desc(users.xp))
      .limit(100);

    return res.status(200).json({
      players: rows,
      totalCount,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error.';
    console.error('[api/leaderboard] Error:', msg);
    return res.status(500).json({ players: [], totalCount: 0, error: msg });
  }
}
