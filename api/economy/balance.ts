// ──────────────────────────────────────────────
// NINE — /api/economy/balance (Vercel Serverless)
// GET — returns user coins, trophies, rank, level
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, gt, sql } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { users, sessions } from '../../src/db/schema.js';
import { getRankForTrophies, levelFromXP, xpForLevel } from '../../src/lib/economy.js';

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionId = getSessionId(req);
  if (!sessionId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.setHeader('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');

  try {
    const [row] = await db
      .select({
        id: users.id,
        coins: users.coins,
        trophies: users.trophies,
        totalXp: users.totalXp,
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

    if (!row) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const rank = getRankForTrophies(row.trophies);
    const level = levelFromXP(row.totalXp);
    const nextLevelXp = xpForLevel(level + 1);
    const currentLevelXp = xpForLevel(level);

    return res.status(200).json({
      coins: row.coins,
      trophies: row.trophies,
      rank: rank.name,
      rankColor: rank.color,
      level,
      totalXp: row.totalXp,
      xpToNextLevel: nextLevelXp - row.totalXp,
      currentLevelXp,
      nextLevelXp,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error';
    return res.status(500).json({ error: msg });
  }
}
