// ──────────────────────────────────────────────
// NINE — /api/profile
// GET ?q=scores|stats
// Consolidated profile endpoint (Vercel Hobby limit)
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, gt, desc, sql } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import { users, sessions, scores, matches, matchPlayers } from '../src/db/schema.js';

const COOKIE_NAME = '__nine_session';

function getSessionId(req: VercelRequest): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  return match.slice(COOKIE_NAME.length + 1) || null;
}

async function getAuthUser(sessionId: string) {
  const [row] = await db
    .select({
      userId: users.id, gamesPlayed: users.gamesPlayed,
      wins: users.wins, losses: users.losses, totalXp: users.totalXp,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, sql`now()`)))
    .limit(1);
  return row ?? null;
}

// ─── Scores ────────────────────────────────

async function handleScores(req: VercelRequest, res: VercelResponse) {
  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(200).json({ scores: [] });

  const auth = await getAuthUser(sessionId);
  if (!auth) return res.status(200).json({ scores: [] });

  const rows = await db
    .select({ id: scores.id, modeId: scores.modeId, score: scores.score, timeMs: scores.timeMs, createdAt: scores.createdAt })
    .from(scores)
    .where(eq(scores.userId, auth.userId))
    .orderBy(desc(scores.createdAt))
    .limit(10);

  return res.status(200).json({ scores: rows });
}

// ─── Stats ─────────────────────────────────

async function handleStats(req: VercelRequest, res: VercelResponse) {
  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(401).json({ matches: [], stats: null });

  const auth = await getAuthUser(sessionId);
  if (!auth) return res.status(401).json({ matches: [], stats: null });

  res.setHeader('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');

  const matchHistory = await db
    .select({
      matchId: matches.id, modeId: matches.modeId, difficulty: matches.difficulty,
      matchStatus: matches.status, startedAt: matches.startedAt, endedAt: matches.endedAt,
      score: matchPlayers.score, result: matchPlayers.result,
      xpEarned: matchPlayers.xpEarned, timeTakenMs: matchPlayers.timeTakenMs,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matches.id, matchPlayers.matchId))
    .where(eq(matchPlayers.userId, auth.userId))
    .orderBy(desc(matches.startedAt))
    .limit(50);

  const matchIds = matchHistory.map((m) => m.matchId);
  let opponentMap: Record<string, string> = {};
  if (matchIds.length > 0) {
    const oppRows = await db
      .select({ matchId: matchPlayers.matchId, username: users.username })
      .from(matchPlayers)
      .innerJoin(users, eq(users.id, matchPlayers.userId))
      .where(and(sql`${matchPlayers.matchId} = ANY(${matchIds})`, sql`${matchPlayers.userId} != ${auth.userId}`));
    for (const row of oppRows) opponentMap[row.matchId] = row.username;
  }

  const stats = {
    gamesPlayed: auth.gamesPlayed, wins: auth.wins, losses: auth.losses,
    draws: auth.gamesPlayed - auth.wins - auth.losses, totalXp: auth.totalXp,
    winRate: auth.gamesPlayed > 0 ? Math.round((auth.wins / auth.gamesPlayed) * 100) : 0,
  };

  const formattedMatches = matchHistory.map((m) => ({
    id: m.matchId, modeId: m.modeId, difficulty: m.difficulty, result: m.result,
    score: m.score, xpEarned: m.xpEarned, timeTakenMs: m.timeTakenMs,
    opponent: opponentMap[m.matchId] ?? 'Unknown', startedAt: m.startedAt, endedAt: m.endedAt,
  }));

  return res.status(200).json({ matches: formattedMatches, stats });
}

// ─── Router ────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const q = (req.query.q as string) ?? 'scores';
    switch (q) {
      case 'scores': return handleScores(req, res);
      case 'stats': return handleStats(req, res);
      default: return res.status(400).json({ error: `Unknown query: ${q}` });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error';
    console.error('[api/profile] Error:', msg);
    return res.status(500).json({ error: msg });
  }
}
