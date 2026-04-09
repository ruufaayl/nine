// ──────────────────────────────────────────────
// NINE — /api/score (Vercel Serverless Function)
// POST — record offline game results, award XP
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, gt, sql } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import { users, sessions } from '../src/db/schema.js';
import { processOfflineGame, processGameResult } from '../src/lib/progression.server.js';

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

async function getUser(req: VercelRequest) {
  const sessionId = getSessionId(req);
  if (!sessionId) return null;

  const [row] = await db
    .select({ id: users.id })
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const body = req.body ?? {};
  const intent = (body.intent as string) ?? 'legacy';

  // ── Offline Game Completion ────────────────
  if (intent === 'offline_complete') {
    const { modeId, difficulty, score, mistakes, timeMs, outcome } = body;

    if (!modeId || typeof modeId !== 'string') {
      return res.status(400).json({ error: 'modeId is required.' });
    }
    if (!difficulty || typeof difficulty !== 'string') {
      return res.status(400).json({ error: 'difficulty is required.' });
    }
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'score must be non-negative.' });
    }
    if (typeof mistakes !== 'number' || mistakes < 0) {
      return res.status(400).json({ error: 'mistakes must be non-negative.' });
    }
    if (typeof timeMs !== 'number' || timeMs < 0) {
      return res.status(400).json({ error: 'timeMs must be non-negative.' });
    }
    if (!outcome || !['win', 'game_over', 'timeout'].includes(outcome)) {
      return res.status(400).json({ error: 'outcome must be win, game_over, or timeout.' });
    }

    try {
      const result = await processOfflineGame({
        userId: user.id,
        modeId,
        difficulty,
        score: Math.floor(score),
        mistakes: Math.floor(mistakes),
        timeMs: Math.floor(timeMs),
        outcome,
      });

      return res.status(200).json({
        success: true,
        earnedXp: result.earnedXp,
        totalXp: result.totalXp,
        level: result.newLevel,
        levelUp: result.newLevel > result.previousLevel,
        rank: result.rankName,
      });
    } catch (error) {
      console.error('[api/score] processOfflineGame failed:', error);
      return res.status(500).json({ error: 'Failed to process game result.' });
    }
  }

  // ── Legacy score submission (backward compat) ──
  const { modeId, score, timeMs, difficultyMultiplier } = body;

  if (!modeId || typeof modeId !== 'string') {
    return res.status(400).json({ error: 'modeId is required.' });
  }
  if (typeof score !== 'number' || score < 0) {
    return res.status(400).json({ error: 'score must be non-negative.' });
  }
  if (typeof timeMs !== 'number' || timeMs < 0) {
    return res.status(400).json({ error: 'timeMs must be non-negative.' });
  }

  try {
    const result = await processGameResult(
      user.id,
      modeId,
      Math.floor(score),
      Math.floor(timeMs),
      typeof difficultyMultiplier === 'number' ? difficultyMultiplier : 1.0,
    );

    return res.status(200).json({
      success: true,
      earnedXp: result.earnedXp,
      totalXp: result.totalXp,
      newRank: result.newRank,
      didRankUp: result.didRankUp,
    });
  } catch (error) {
    console.error('[api/score] processGameResult failed:', error);
    return res.status(500).json({ error: 'Failed to process game result.' });
  }
}
