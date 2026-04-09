// ──────────────────────────────────────────────
// NINE — /api/dashboard/daily
// GET — returns today's daily challenge + user's streak
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, gt, sql, desc } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import {
  users, sessions, dailyChallenges, dailyChallengeScores,
} from '../../src/db/schema.js';

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
    // Auth (optional — streak requires auth)
    const sessionId = getSessionId(req);
    let userId: string | null = null;

    if (sessionId) {
      const [session] = await db
        .select({ userId: sessions.userId })
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, sql`NOW()`)))
        .limit(1);
      if (session) userId = session.userId;
    }

    // Get today's challenge
    const [today] = await db
      .select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.activeDate, sql`CURRENT_DATE`))
      .limit(1);

    if (!today) {
      res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
      return res.status(200).json({ challenge: null, streak: 0, completed: false });
    }

    // Check if user completed today's challenge
    let completed = false;
    let streak = 0;

    if (userId) {
      const [score] = await db
        .select()
        .from(dailyChallengeScores)
        .where(
          and(
            eq(dailyChallengeScores.challengeId, today.id),
            eq(dailyChallengeScores.userId, userId)
          )
        )
        .limit(1);
      completed = !!score;

      // Calculate streak: count consecutive days backwards from today
      const streakRows = await db
        .select({
          activeDate: dailyChallenges.activeDate,
        })
        .from(dailyChallengeScores)
        .innerJoin(dailyChallenges, eq(dailyChallenges.id, dailyChallengeScores.challengeId))
        .where(eq(dailyChallengeScores.userId, userId))
        .orderBy(desc(dailyChallenges.activeDate))
        .limit(60);

      // Walk backwards from today counting consecutive days
      const today_date = new Date();
      today_date.setHours(0, 0, 0, 0);
      const completedDates = new Set(
        streakRows.map((r) => {
          const d = new Date(r.activeDate as unknown as string);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      );

      for (let i = 0; i < 60; i++) {
        const checkDate = new Date(today_date);
        checkDate.setDate(checkDate.getDate() - i);
        if (completedDates.has(checkDate.getTime())) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Count total completions for this challenge
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(dailyChallengeScores)
      .where(eq(dailyChallengeScores.challengeId, today.id));

    res.setHeader('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');
    return res.status(200).json({
      challenge: {
        id: today.id,
        modeId: today.modeId,
        activeDate: today.activeDate,
      },
      streak,
      completed,
      totalCompletions: Number(count),
    });
  } catch (err) {
    console.error('Daily challenge error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
