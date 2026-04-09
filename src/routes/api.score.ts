// ──────────────────────────────────────────────
// NINE — Score Submission API (Resource Route)
// Handles offline game completion and PvP results
// ──────────────────────────────────────────────

import type { ActionFunctionArgs } from 'react-router';
import { getUserFromRequest } from '../lib/auth.server';
import { processGameResult, processOfflineGame } from '../lib/progression.server';

// ─── Action ─────────────────────────────────
// POST /api/score
// Body: { intent, modeId, difficulty, score, timeMs, mistakes, outcome, ... }

export async function action({ request }: ActionFunctionArgs) {
  // Auth gate
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json(
      { error: 'Unauthorized. Please log in.' },
      { status: 401 },
    );
  }

  // Parse payload
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid JSON payload.' },
      { status: 400 },
    );
  }

  const intent = (body.intent as string) ?? 'legacy';

  // ── New: Offline Game Completion ────────────
  if (intent === 'offline_complete') {
    const { modeId, difficulty, score, mistakes, timeMs, outcome } = body as {
      modeId?: string;
      difficulty?: string;
      score?: number;
      mistakes?: number;
      timeMs?: number;
      outcome?: string;
    };

    if (!modeId || typeof modeId !== 'string') {
      return Response.json({ error: 'modeId is required.' }, { status: 400 });
    }
    if (!difficulty || typeof difficulty !== 'string') {
      return Response.json({ error: 'difficulty is required.' }, { status: 400 });
    }
    if (typeof score !== 'number' || score < 0) {
      return Response.json({ error: 'score must be non-negative.' }, { status: 400 });
    }
    if (typeof mistakes !== 'number' || mistakes < 0) {
      return Response.json({ error: 'mistakes must be non-negative.' }, { status: 400 });
    }
    if (typeof timeMs !== 'number' || timeMs < 0) {
      return Response.json({ error: 'timeMs must be non-negative.' }, { status: 400 });
    }
    if (!outcome || !['win', 'game_over', 'timeout'].includes(outcome)) {
      return Response.json({ error: 'outcome must be win, game_over, or timeout.' }, { status: 400 });
    }

    try {
      const result = await processOfflineGame({
        userId: user.id,
        modeId,
        difficulty,
        score: Math.floor(score),
        mistakes: Math.floor(mistakes),
        timeMs: Math.floor(timeMs),
        outcome: outcome as 'win' | 'game_over' | 'timeout',
      });

      return Response.json({
        success: true,
        earnedXp: result.earnedXp,
        totalXp: result.totalXp,
        level: result.newLevel,
        levelUp: result.newLevel > result.previousLevel,
        rank: result.rankName,
      });
    } catch (error) {
      console.error('[api.score] processOfflineGame failed:', error);
      return Response.json(
        { error: 'Failed to process game result.' },
        { status: 500 },
      );
    }
  }

  // ── Legacy score submission (backward compat) ──
  const { modeId, score, timeMs, difficultyMultiplier } = body as {
    modeId?: string;
    score?: number;
    timeMs?: number;
    difficultyMultiplier?: number;
  };

  if (!modeId || typeof modeId !== 'string') {
    return Response.json({ error: 'modeId is required.' }, { status: 400 });
  }
  if (typeof score !== 'number' || score < 0) {
    return Response.json({ error: 'score must be a non-negative number.' }, { status: 400 });
  }
  if (typeof timeMs !== 'number' || timeMs < 0) {
    return Response.json({ error: 'timeMs must be a non-negative number.' }, { status: 400 });
  }

  try {
    const result = await processGameResult(
      user.id,
      modeId,
      Math.floor(score),
      Math.floor(timeMs),
      typeof difficultyMultiplier === 'number' ? difficultyMultiplier : 1.0,
    );

    return Response.json({
      success: true,
      earnedXp: result.earnedXp,
      totalXp: result.totalXp,
      newRank: result.newRank,
      didRankUp: result.didRankUp,
    });
  } catch (error) {
    console.error('[api.score] processGameResult failed:', error);
    return Response.json(
      { error: 'Failed to process game result.' },
      { status: 500 },
    );
  }
}
