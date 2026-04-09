// ──────────────────────────────────────────────
// NINE — /api/dashboard/live
// GET — returns currently ongoing matches
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { matches, matchPlayers, users } from '../../src/db/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Fetch ongoing matches (limit 6)
    const ongoing = await db
      .select({
        id: matches.id,
        modeId: matches.modeId,
        startedAt: matches.startedAt,
      })
      .from(matches)
      .where(eq(matches.status, 'ongoing'))
      .orderBy(matches.startedAt)
      .limit(6);

    if (ongoing.length === 0) {
      res.setHeader('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
      return res.status(200).json({ matches: [] });
    }

    const matchIds = ongoing.map((m) => m.id);

    // Fetch players for those matches
    const players = await db
      .select({
        matchId: matchPlayers.matchId,
        username: users.username,
      })
      .from(matchPlayers)
      .innerJoin(users, eq(users.id, matchPlayers.userId))
      .where(sql`${matchPlayers.matchId} = ANY(${matchIds})`);

    // Group players by match
    const playersByMatch: Record<string, string[]> = {};
    for (const p of players) {
      if (!playersByMatch[p.matchId]) playersByMatch[p.matchId] = [];
      playersByMatch[p.matchId].push(p.username);
    }

    const now = Date.now();
    const result = ongoing.map((m) => {
      const ps = playersByMatch[m.id] ?? [];
      const elapsedMs = now - (m.startedAt?.getTime() ?? now);
      const totalSec = Math.floor(elapsedMs / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      return {
        id: m.id,
        mode: m.modeId,
        p1: ps[0] ?? '???',
        p2: ps[1] ?? '???',
        time: `${mins}:${String(secs).padStart(2, '0')}`,
      };
    });

    res.setHeader('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');
    return res.status(200).json({ matches: result });
  } catch (err) {
    console.error('Live matches error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
