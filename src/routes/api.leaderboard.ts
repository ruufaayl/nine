// ──────────────────────────────────────────────
// NINE — Leaderboard API (server-side resource route)
// ──────────────────────────────────────────────

import type { LoaderFunctionArgs } from 'react-router';
import { db } from '../db';
import { users, scores } from '../db/schema';
import { desc, eq, count } from 'drizzle-orm';

// GET /api/leaderboard

export async function loader(_args: LoaderFunctionArgs) {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      xp: users.xp,
      rank: users.rank,
      gamesPlayed: count(scores.id),
    })
    .from(users)
    .leftJoin(scores, eq(users.id, scores.userId))
    .groupBy(users.id)
    .orderBy(desc(users.xp))
    .limit(50);

  return Response.json({ entries: rows });
}
