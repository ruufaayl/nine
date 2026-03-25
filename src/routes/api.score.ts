// ──────────────────────────────────────────────
// NINE — Score Submission API (Resource Route)
// ──────────────────────────────────────────────

import type { ActionFunctionArgs } from 'react-router';
import { getUserFromRequest } from '../lib/auth.server';
import { processGameResult } from '../lib/progression.server';

// ─── Action ─────────────────────────────────
// POST /api/score
// Body: { modeId: string, score: number, timeMs: number, difficultyMultiplier?: number }

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
  let body: {
    modeId?: string;
    score?: number;
    timeMs?: number;
    difficultyMultiplier?: number;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid JSON payload.' },
      { status: 400 },
    );
  }

  const { modeId, score, timeMs, difficultyMultiplier } = body;

  // Validation
  if (!modeId || typeof modeId !== 'string') {
    return Response.json({ error: 'modeId is required.' }, { status: 400 });
  }
  if (typeof score !== 'number' || score < 0) {
    return Response.json({ error: 'score must be a non-negative number.' }, { status: 400 });
  }
  if (typeof timeMs !== 'number' || timeMs < 0) {
    return Response.json({ error: 'timeMs must be a non-negative number.' }, { status: 400 });
  }

  // Process
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
