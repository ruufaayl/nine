// ──────────────────────────────────────────────
// NINE — /api/dashboard/activity
// GET — returns recent activity for the authenticated user
// Sources: match results + notifications
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, gt, desc, sql } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { users, sessions, matches, matchPlayers, notifications } from '../../src/db/schema.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sessionId = getSessionId(req);
    if (!sessionId) return res.status(401).json({ error: 'Not authenticated' });

    const [session] = await db
      .select({ userId: sessions.userId })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, sql`NOW()`)))
      .limit(1);

    if (!session) return res.status(401).json({ error: 'Session expired' });
    const userId = session.userId;

    // Fetch recent match results (last 10)
    const recentMatches = await db
      .select({
        matchId: matches.id,
        modeId: matches.modeId,
        result: matchPlayers.result,
        xpEarned: matchPlayers.xpEarned,
        endedAt: matches.endedAt,
      })
      .from(matchPlayers)
      .innerJoin(matches, eq(matches.id, matchPlayers.matchId))
      .where(and(eq(matchPlayers.userId, userId), eq(matches.status, 'completed')))
      .orderBy(desc(matches.endedAt))
      .limit(10);

    // Fetch opponent usernames for those matches
    const matchIds = recentMatches.map((m) => m.matchId);
    let opponents: Record<string, string> = {};
    if (matchIds.length > 0) {
      const oppRows = await db
        .select({
          matchId: matchPlayers.matchId,
          username: users.username,
        })
        .from(matchPlayers)
        .innerJoin(users, eq(users.id, matchPlayers.userId))
        .where(
          and(
            sql`${matchPlayers.matchId} = ANY(${matchIds})`,
            sql`${matchPlayers.userId} != ${userId}`
          )
        );
      for (const row of oppRows) {
        opponents[row.matchId] = row.username;
      }
    }

    // Fetch recent notifications (last 10)
    const recentNotifs = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        content: notifications.content,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    // Build unified activity feed
    const activity = [
      ...recentMatches.map((m) => ({
        id: `match-${m.matchId}`,
        type: 'match' as const,
        text:
          m.result === 'win'
            ? `You defeated ${opponents[m.matchId] ?? 'an opponent'} in ${m.modeId}`
            : m.result === 'loss'
              ? `You lost to ${opponents[m.matchId] ?? 'an opponent'} in ${m.modeId}`
              : `Draw with ${opponents[m.matchId] ?? 'an opponent'} in ${m.modeId}`,
        icon: m.result === 'win' ? '⚡' : m.result === 'loss' ? '✗' : '≈',
        accent:
          m.result === 'win'
            ? 'var(--electric-lime)'
            : m.result === 'loss'
              ? 'var(--neon-magenta)'
              : 'var(--cyber-cyan)',
        xp: m.xpEarned,
        time: m.endedAt?.toISOString() ?? null,
      })),
      ...recentNotifs.map((n) => ({
        id: `notif-${n.id}`,
        type: 'notification' as const,
        text: n.content,
        icon: n.type === 'friend_request' ? '◈' : n.type === 'game_invite' ? '⚔' : '●',
        accent:
          n.type === 'friend_request'
            ? 'var(--cyber-cyan)'
            : n.type === 'game_invite'
              ? 'var(--neon-magenta)'
              : 'var(--laser-orange)',
        xp: 0,
        time: n.createdAt?.toISOString() ?? null,
      })),
    ]
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      })
      .slice(0, 10);

    res.setHeader('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');
    return res.status(200).json({ activity });
  } catch (err) {
    console.error('Activity feed error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
