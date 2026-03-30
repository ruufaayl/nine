// ──────────────────────────────────────────────
// NINE — /api/profile/stats (Vercel Serverless Function)
// GET /api/profile/stats — match history from matchPlayers + matches
//
// Returns both aggregate stats and recent match records
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, gt, desc, sql, count } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { users, sessions, matches, matchPlayers } from '../../src/db/schema.js';

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
    return res.status(405).json({ matches: [], stats: null });
  }

  const sessionId = getSessionId(req);
  if (!sessionId) {
    return res.status(401).json({ matches: [], stats: null });
  }

  res.setHeader('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');

  try {
    // ── Auth: single JOIN ──
    const [authRow] = await db
      .select({
        userId: users.id,
        gamesPlayed: users.gamesPlayed,
        wins: users.wins,
        losses: users.losses,
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

    if (!authRow) {
      return res.status(401).json({ matches: [], stats: null });
    }

    // ── Match history: matchPlayers JOIN matches, find opponent ──
    const matchHistory = await db
      .select({
        matchId: matches.id,
        modeId: matches.modeId,
        difficulty: matches.difficulty,
        matchStatus: matches.status,
        startedAt: matches.startedAt,
        endedAt: matches.endedAt,
        score: matchPlayers.score,
        result: matchPlayers.result,
        xpEarned: matchPlayers.xpEarned,
        timeTakenMs: matchPlayers.timeTakenMs,
      })
      .from(matchPlayers)
      .innerJoin(matches, eq(matches.id, matchPlayers.matchId))
      .where(eq(matchPlayers.userId, authRow.userId))
      .orderBy(desc(matches.startedAt))
      .limit(50);

    // ── For each match, find opponent name ──
    const matchIds = matchHistory.map((m) => m.matchId);
    let opponentMap: Record<string, string> = {};

    if (matchIds.length > 0) {
      const opponentRows = await db
        .select({
          matchId: matchPlayers.matchId,
          username: users.username,
        })
        .from(matchPlayers)
        .innerJoin(users, eq(users.id, matchPlayers.userId))
        .where(
          and(
            sql`${matchPlayers.matchId} = ANY(${matchIds})`,
            sql`${matchPlayers.userId} != ${authRow.userId}`,
          ),
        );

      for (const row of opponentRows) {
        opponentMap[row.matchId] = row.username;
      }
    }

    // ── Aggregate stats from user table ──
    const stats = {
      gamesPlayed: authRow.gamesPlayed,
      wins: authRow.wins,
      losses: authRow.losses,
      draws: authRow.gamesPlayed - authRow.wins - authRow.losses,
      totalXp: authRow.totalXp,
      winRate: authRow.gamesPlayed > 0
        ? Math.round((authRow.wins / authRow.gamesPlayed) * 100)
        : 0,
    };

    // ── Format response ──
    const formattedMatches = matchHistory.map((m) => ({
      id: m.matchId,
      modeId: m.modeId,
      difficulty: m.difficulty,
      result: m.result,
      score: m.score,
      xpEarned: m.xpEarned,
      timeTakenMs: m.timeTakenMs,
      opponent: opponentMap[m.matchId] ?? 'Unknown',
      startedAt: m.startedAt,
      endedAt: m.endedAt,
    }));

    return res.status(200).json({
      matches: formattedMatches,
      stats,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error.';
    console.error('[api/profile/stats] Error:', msg);
    return res.status(500).json({ matches: [], stats: null, error: msg });
  }
}
