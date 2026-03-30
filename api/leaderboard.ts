// ──────────────────────────────────────────────
// NINE — /api/leaderboard (Vercel Serverless Function)
// GET /api/leaderboard — global rankings, registered users only
//
// Query params:
//   ?tab=friends&userId=<uuid>  — friends leaderboard
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, desc, count, sql, or, and, inArray } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import { users, friendships } from '../src/db/schema.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ players: [], totalCount: 0 });
  }

  // Cache for 30s on Vercel edge
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  const tab = req.query.tab as string | undefined;
  const userId = req.query.userId as string | undefined;

  try {
    // ── Total registered count ──
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.isGuest, false));

    let friendIds: string[] = [];

    // ── If friends tab, get friend IDs first ──
    if (tab === 'friends' && userId) {
      const friendRows = await db
        .select({
          friendId: sql<string>`
            CASE
              WHEN ${friendships.userId1} = ${userId} THEN ${friendships.userId2}
              ELSE ${friendships.userId1}
            END
          `,
        })
        .from(friendships)
        .where(
          and(
            eq(friendships.status, 'accepted'),
            or(
              eq(friendships.userId1, userId),
              eq(friendships.userId2, userId),
            ),
          ),
        );

      friendIds = friendRows.map((r) => r.friendId);
      // Include self in friends leaderboard
      friendIds.push(userId);
    }

    // ── Top 100 players ranked by totalXp (fall back to xp for legacy) ──
    let query = db
      .select({
        id: users.id,
        username: users.username,
        xp: users.totalXp,
        rank: users.rankTier,
        gamesPlayed: users.gamesPlayed,
        wins: users.wins,
      })
      .from(users)
      .where(eq(users.isGuest, false))
      .orderBy(desc(users.totalXp))
      .limit(100);

    // Filter to friends if applicable
    if (tab === 'friends' && friendIds.length > 0) {
      query = db
        .select({
          id: users.id,
          username: users.username,
          xp: users.totalXp,
          rank: users.rankTier,
          gamesPlayed: users.gamesPlayed,
          wins: users.wins,
        })
        .from(users)
        .where(
          and(
            eq(users.isGuest, false),
            inArray(users.id, friendIds),
          ),
        )
        .orderBy(desc(users.totalXp))
        .limit(100);
    }

    const rows = await query;

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
