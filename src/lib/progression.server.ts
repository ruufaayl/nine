// ──────────────────────────────────────────────
// NINE — Progression Engine (server-only)
// ──────────────────────────────────────────────

import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { scores, users } from '../db/schema';

// ─── Rank Definitions ───────────────────────

export interface RankDefinition {
  name: string;
  minXp: number;
  color: string;
  glow: string;
}

export const RANKS: readonly RankDefinition[] = [
  { name: 'Stone',    minXp: 0,      color: '#6b7280', glow: 'none' },
  { name: 'Bronze',   minXp: 500,    color: '#cd7f32', glow: 'none' },
  { name: 'Silver',   minXp: 2000,   color: '#c0c0c0', glow: 'none' },
  { name: 'Gold',     minXp: 5000,   color: '#fbbf24', glow: '0 0 8px rgba(251,191,36,0.5)' },
  { name: 'Platinum', minXp: 12000,  color: '#a5b4fc', glow: '0 0 8px rgba(165,180,252,0.5)' },
  { name: 'Diamond',  minXp: 25000,  color: '#22d3ee', glow: '0 0 10px rgba(34,211,238,0.6)' },
  { name: 'Legend',   minXp: 50000,  color: '#f472b6', glow: '0 0 12px rgba(244,114,182,0.6)' },
] as const;

/**
 * Return the rank name for a given XP total.
 */
export function getRankForXp(xp: number): string {
  let rank = RANKS[0].name;
  for (const r of RANKS) {
    if (xp >= r.minXp) rank = r.name;
  }
  return rank;
}

/**
 * Get full rank definition by name.
 */
export function getRankDefinition(name: string): RankDefinition {
  return RANKS.find((r) => r.name === name) ?? RANKS[0];
}

// ─── XP Calculation ─────────────────────────

/**
 * Pure function: calculate XP from a game result.
 * - Base score scaled by difficulty
 * - Time bonus: faster = more XP (capped at 2× multiplier)
 */
export function calculateXP(
  baseScore: number,
  timeMs: number,
  difficultyMultiplier: number = 1.0,
): number {
  // Time bonus: max bonus at ≤ 30s, linear decay to 1× at 10 min
  const timeSeconds = timeMs / 1000;
  const maxBonusTime = 30;
  const noBonusTime = 600;
  const timeFactor =
    timeSeconds <= maxBonusTime
      ? 2.0
      : timeSeconds >= noBonusTime
        ? 1.0
        : 2.0 - ((timeSeconds - maxBonusTime) / (noBonusTime - maxBonusTime));

  const raw = baseScore * difficultyMultiplier * timeFactor;

  // Floor to integer, minimum 1 XP for any completed game
  return Math.max(1, Math.floor(raw));
}

// ─── Process Game Result ────────────────────

export interface GameResultOutput {
  earnedXp: number;
  totalXp: number;
  newRank: string;
  previousRank: string;
  didRankUp: boolean;
}

/**
 * Process a completed game: insert score, award XP, check rank-up.
 * Runs inside a single transaction for atomicity.
 */
export async function processGameResult(
  userId: string,
  modeId: string,
  score: number,
  timeMs: number,
  difficultyMultiplier: number = 1.0,
): Promise<GameResultOutput> {
  const earnedXp = calculateXP(score, timeMs, difficultyMultiplier);

  // Use a transaction: insert score + update user XP/rank
  const result = await db.transaction(async (tx) => {
    // 1) Insert score record
    await tx.insert(scores).values({
      userId,
      modeId,
      score,
      timeMs,
    });

    // 2) Increment XP
    const [updatedUser] = await tx
      .update(users)
      .set({
        xp: sql`${users.xp} + ${earnedXp}`,
      })
      .where(eq(users.id, userId))
      .returning({ xp: users.xp, rank: users.rank });

    const totalXp = updatedUser.xp;
    const previousRank = updatedUser.rank;

    // 3) Check rank up
    const newRank = getRankForXp(totalXp);
    const didRankUp = newRank !== previousRank;

    if (didRankUp) {
      await tx
        .update(users)
        .set({ rank: newRank })
        .where(eq(users.id, userId));
    }

    return { totalXp, previousRank, newRank, didRankUp };
  });

  return {
    earnedXp,
    totalXp: result.totalXp,
    newRank: result.newRank,
    previousRank: result.previousRank,
    didRankUp: result.didRankUp,
  };
}
