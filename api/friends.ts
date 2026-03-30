// ──────────────────────────────────────────────
// NINE — /api/friends (Vercel Serverless Function)
// GET /api/friends — accepted friends + pending requests
// POST /api/friends — send/accept/deny/block friend request
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, gt, or, sql, ne } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import { users, sessions, friendships } from '../src/db/schema.js';

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

async function getAuthUser(sessionId: string) {
  const [row] = await db
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
  return row ?? null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const sessionId = getSessionId(req);
  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const auth = await getAuthUser(sessionId);
  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = auth.userId;

  // ──────────── GET ────────────
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');

    try {
      // ── All friendship rows involving this user ──
      const rows = await db
        .select({
          userId1: friendships.userId1,
          userId2: friendships.userId2,
          status: friendships.status,
          createdAt: friendships.createdAt,
        })
        .from(friendships)
        .where(
          or(
            eq(friendships.userId1, userId),
            eq(friendships.userId2, userId),
          ),
        );

      // Collect all friend user IDs
      const friendUserIds = new Set<string>();
      for (const row of rows) {
        const otherId = row.userId1 === userId ? row.userId2 : row.userId1;
        friendUserIds.add(otherId);
      }

      // Fetch user data for all friends
      let userMap: Record<string, { username: string; rank: string; xp: number }> = {};
      if (friendUserIds.size > 0) {
        const friendIdsArr = [...friendUserIds];
        const userRows = await db
          .select({
            id: users.id,
            username: users.username,
            rank: users.rankTier,
            xp: users.totalXp,
          })
          .from(users)
          .where(sql`${users.id} = ANY(${friendIdsArr})`);

        for (const u of userRows) {
          userMap[u.id] = { username: u.username, rank: u.rank, xp: u.xp };
        }
      }

      // Split into accepted friends and pending requests
      const friends = [];
      const pending = [];

      for (const row of rows) {
        if (row.status === 'blocked') continue;

        const otherId = row.userId1 === userId ? row.userId2 : row.userId1;
        const friendData = userMap[otherId];
        if (!friendData) continue;

        if (row.status === 'accepted') {
          friends.push({
            id: otherId,
            username: friendData.username,
            rank: friendData.rank,
            xp: friendData.xp,
            status: 'offline' as const, // real-time status requires WebSocket
          });
        } else if (row.status === 'pending') {
          pending.push({
            id: otherId,
            username: friendData.username,
            rank: friendData.rank,
            xp: friendData.xp,
            direction: row.userId1 === userId ? 'outgoing' : 'incoming',
          });
        }
      }

      return res.status(200).json({ friends, pending });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Internal error.';
      console.error('[api/friends] GET Error:', msg);
      return res.status(500).json({ friends: [], pending: [], error: msg });
    }
  }

  // ──────────── POST ────────────
  if (req.method === 'POST') {
    const { intent, targetId } = req.body ?? {};

    if (!targetId || typeof targetId !== 'string') {
      return res.status(400).json({ error: 'targetId is required' });
    }

    try {
      if (intent === 'send') {
        // Send a friend request (userId1 = sender, userId2 = receiver)
        await db
          .insert(friendships)
          .values({ userId1: userId, userId2: targetId, status: 'pending' })
          .onConflictDoNothing();
        return res.status(200).json({ success: true });
      }

      if (intent === 'accept') {
        // Accept: the other user sent it (they are userId1, we are userId2)
        await db
          .update(friendships)
          .set({ status: 'accepted' })
          .where(
            and(
              eq(friendships.userId1, targetId),
              eq(friendships.userId2, userId),
              eq(friendships.status, 'pending'),
            ),
          );
        return res.status(200).json({ success: true });
      }

      if (intent === 'deny' || intent === 'remove') {
        // Remove friendship in either direction
        await db
          .delete(friendships)
          .where(
            or(
              and(eq(friendships.userId1, userId), eq(friendships.userId2, targetId)),
              and(eq(friendships.userId1, targetId), eq(friendships.userId2, userId)),
            ),
          );
        return res.status(200).json({ success: true });
      }

      if (intent === 'block') {
        // Block: upsert to blocked
        await db
          .delete(friendships)
          .where(
            or(
              and(eq(friendships.userId1, userId), eq(friendships.userId2, targetId)),
              and(eq(friendships.userId1, targetId), eq(friendships.userId2, userId)),
            ),
          );
        await db
          .insert(friendships)
          .values({ userId1: userId, userId2: targetId, status: 'blocked' });
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Unknown intent' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Internal error.';
      console.error('[api/friends] POST Error:', msg);
      return res.status(500).json({ success: false, error: msg });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
