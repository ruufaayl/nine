// ──────────────────────────────────────────────
// NINE — Economy Engine (server-only)
// Handles XP, coins, trophies, escrow, game results
// ──────────────────────────────────────────────

import { eq, sql, and } from 'drizzle-orm';
import { db } from '../db';
import {
  users,
  scores,
  gameResults,
  matchEscrow,
  matches,
  matchPlayers,
} from '../db/schema';
import {
  calculateXP,
  getRankForTrophies,
  levelFromXP,
  ENTRY_FEES,
  TROPHY_DELTAS,
  TIME_LIMITS,
} from './economy';

// ─── Legacy Rank Definitions (for XP-based rank) ──

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

export function getRankForXp(xp: number): string {
  let rank = RANKS[0].name;
  for (const r of RANKS) {
    if (xp >= r.minXp) rank = r.name;
  }
  return rank;
}

export function getRankDefinition(name: string): RankDefinition {
  return RANKS.find((r) => r.name === name) ?? RANKS[0];
}

// ─── Legacy XP Calculation (for api.score backward compat) ──

export function calculateXPLegacy(
  baseScore: number,
  timeMs: number,
  difficultyMultiplier: number = 1.0,
): number {
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
  return Math.max(1, Math.floor(raw));
}

// ─── Process Game Result (legacy — for backward compat) ──

export interface GameResultOutput {
  earnedXp: number;
  totalXp: number;
  newRank: string;
  previousRank: string;
  didRankUp: boolean;
}

export async function processGameResult(
  userId: string,
  modeId: string,
  score: number,
  timeMs: number,
  difficultyMultiplier: number = 1.0,
): Promise<GameResultOutput> {
  const earnedXp = calculateXPLegacy(score, timeMs, difficultyMultiplier);

  const result = await db.transaction(async (tx) => {
    await tx.insert(scores).values({ userId, modeId, score, timeMs });

    const [updatedUser] = await tx
      .update(users)
      .set({
        xp: sql`${users.xp} + ${earnedXp}`,
        totalXp: sql`${users.totalXp} + ${earnedXp}`,
        gamesPlayed: sql`${users.gamesPlayed} + 1`,
      })
      .where(eq(users.id, userId))
      .returning({ xp: users.xp, rank: users.rank, totalXp: users.totalXp });

    const totalXp = updatedUser.totalXp;
    const previousRank = updatedUser.rank;
    const newRank = getRankForXp(totalXp);
    const didRankUp = newRank !== previousRank;

    if (didRankUp) {
      await tx.update(users).set({ rank: newRank }).where(eq(users.id, userId));
    }

    // Update level
    const newLevel = levelFromXP(totalXp);
    await tx.update(users).set({ level: newLevel }).where(eq(users.id, userId));

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ECONOMY ENGINE — New System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Check Balance ──────────────────────────

export async function getUserBalance(userId: string): Promise<{ coins: number; trophies: number }> {
  const [user] = await db
    .select({ coins: users.coins, trophies: users.trophies })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new Error(`User ${userId} not found`);
  return { coins: user.coins, trophies: user.trophies };
}

// ─── Offline Game Complete ──────────────────

export interface OfflineGameInput {
  userId: string;
  modeId: string;
  difficulty: string;
  score: number;
  mistakes: number;
  timeMs: number;
  outcome: 'win' | 'game_over' | 'timeout';
}

export interface OfflineGameOutput {
  earnedXp: number;
  totalXp: number;
  newLevel: number;
  previousLevel: number;
  rankName: string;
}

export async function processOfflineGame(input: OfflineGameInput): Promise<OfflineGameOutput> {
  const { userId, modeId, difficulty, score, mistakes, timeMs, outcome } = input;

  // Only award XP for wins
  const timeLimitMs = (TIME_LIMITS[difficulty] ?? 600) * 1000;
  const earnedXp = outcome === 'win'
    ? calculateXP(difficulty, timeMs, timeLimitMs, mistakes)
    : 0;

  const result = await db.transaction(async (tx) => {
    // 1) Record immutable game result
    await tx.insert(gameResults).values({
      userId,
      modeId,
      difficulty,
      outcome,
      score,
      mistakes,
      timeMs,
      xpEarned: earnedXp,
      coinsEarned: 0,   // offline has no coin reward
      trophyDelta: 0,   // offline has no trophy change
      isPvp: false,
    });

    // 2) Update user stats
    const isWin = outcome === 'win';
    const isLoss = outcome === 'game_over' || outcome === 'timeout';
    const [updated] = await tx
      .update(users)
      .set({
        totalXp: sql`${users.totalXp} + ${earnedXp}`,
        xp: sql`${users.xp} + ${earnedXp}`,
        gamesPlayed: sql`${users.gamesPlayed} + 1`,
        wins: isWin ? sql`${users.wins} + 1` : users.wins,
        losses: isLoss ? sql`${users.losses} + 1` : users.losses,
      })
      .where(eq(users.id, userId))
      .returning({
        totalXp: users.totalXp,
        level: users.level,
      });

    // 3) Update level
    const newLevel = levelFromXP(updated.totalXp);
    if (newLevel !== updated.level) {
      await tx.update(users).set({ level: newLevel }).where(eq(users.id, userId));
    }

    // 4) Update rank tier from trophies (unchanged for offline, but sync)
    const [userNow] = await tx
      .select({ trophies: users.trophies })
      .from(users)
      .where(eq(users.id, userId));
    const rank = getRankForTrophies(userNow.trophies);
    await tx.update(users).set({ rankTier: rank.name, rank: rank.name }).where(eq(users.id, userId));

    return {
      totalXp: updated.totalXp,
      newLevel,
      previousLevel: updated.level,
      rankName: rank.name,
    };
  });

  return {
    earnedXp,
    totalXp: result.totalXp,
    newLevel: result.newLevel,
    previousLevel: result.previousLevel,
    rankName: result.rankName,
  };
}

// ─── PvP: Create Escrow ─────────────────────

export interface EscrowResult {
  success: boolean;
  error?: string;
  matchId?: string;
}

/**
 * Deduct entry fee from both players and store in escrow.
 * Atomic — either both deductions succeed or none.
 */
export async function createPvPEscrow(
  matchId: string,
  playerAId: string,
  playerBId: string,
  difficulty: string,
): Promise<EscrowResult> {
  const entryFee = ENTRY_FEES[difficulty] ?? 100;

  try {
    await db.transaction(async (tx) => {
      // Check both balances
      const [playerA] = await tx
        .select({ coins: users.coins })
        .from(users)
        .where(eq(users.id, playerAId));
      const [playerB] = await tx
        .select({ coins: users.coins })
        .from(users)
        .where(eq(users.id, playerBId));

      if (!playerA || !playerB) throw new Error('Player not found');
      if (playerA.coins < entryFee) throw new Error(`Player A insufficient coins: ${playerA.coins} < ${entryFee}`);
      if (playerB.coins < entryFee) throw new Error(`Player B insufficient coins: ${playerB.coins} < ${entryFee}`);

      // Deduct from both
      await tx.update(users).set({ coins: sql`${users.coins} - ${entryFee}` }).where(eq(users.id, playerAId));
      await tx.update(users).set({ coins: sql`${users.coins} - ${entryFee}` }).where(eq(users.id, playerBId));

      // Create escrow records
      await tx.insert(matchEscrow).values([
        { matchId, userId: playerAId, amount: entryFee, status: 'held' },
        { matchId, userId: playerBId, amount: entryFee, status: 'held' },
      ]);
    });

    return { success: true, matchId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Escrow creation failed';
    console.error(`[escrow] Failed for match ${matchId}:`, message);
    return { success: false, error: message };
  }
}

// ─── PvP: Settle Escrow (Winner Takes All) ──

export interface SettleResult {
  success: boolean;
  winnerCoinsEarned: number;
  trophyDelta: { win: number; loss: number };
}

/**
 * Award escrow pool to winner, update trophies & stats.
 * Called by roomHandler when game_won or forfeit occurs.
 */
export async function settlePvPMatch(
  matchId: string,
  winnerId: string,
  loserId: string,
  difficulty: string,
  winnerScore: number,
  loserScore: number,
  winnerMistakes: number,
  loserMistakes: number,
  winnerTimeMs: number,
  loserTimeMs: number,
  modeId: string = 'prime-grid',
  isForfeit: boolean = false,
): Promise<SettleResult> {
  const entryFee = ENTRY_FEES[difficulty] ?? 100;
  const pool = entryFee * 2; // total pot
  const trophyConfig = TROPHY_DELTAS[difficulty] ?? { win: 10, loss: 7 };
  const timeLimitMs = (TIME_LIMITS[difficulty] ?? 600) * 1000;

  // Winner XP
  const winnerXp = calculateXP(difficulty, winnerTimeMs, timeLimitMs, winnerMistakes);
  // Loser gets partial XP (never zero for trying)
  const loserXp = Math.max(1, Math.floor(winnerXp * 0.15));

  await db.transaction(async (tx) => {
    // 1) Update escrow: mark as awarded/refunded
    await tx
      .update(matchEscrow)
      .set({ status: 'awarded', resolvedAt: sql`now()` })
      .where(and(eq(matchEscrow.matchId, matchId), eq(matchEscrow.userId, winnerId)));

    await tx
      .update(matchEscrow)
      .set({ status: 'awarded', resolvedAt: sql`now()` })
      .where(and(eq(matchEscrow.matchId, matchId), eq(matchEscrow.userId, loserId)));

    // 2) Award coins to winner (full pool)
    await tx
      .update(users)
      .set({
        coins: sql`${users.coins} + ${pool}`,
        trophies: sql`GREATEST(0, ${users.trophies} + ${trophyConfig.win})`,
        totalXp: sql`${users.totalXp} + ${winnerXp}`,
        xp: sql`${users.xp} + ${winnerXp}`,
        gamesPlayed: sql`${users.gamesPlayed} + 1`,
        wins: sql`${users.wins} + 1`,
      })
      .where(eq(users.id, winnerId));

    // 3) Loser: deduct trophies (floor at 0), partial XP
    await tx
      .update(users)
      .set({
        trophies: sql`GREATEST(0, ${users.trophies} - ${trophyConfig.loss})`,
        totalXp: sql`${users.totalXp} + ${loserXp}`,
        xp: sql`${users.xp} + ${loserXp}`,
        gamesPlayed: sql`${users.gamesPlayed} + 1`,
        losses: sql`${users.losses} + 1`,
      })
      .where(eq(users.id, loserId));

    // 4) Update levels + ranks
    for (const uid of [winnerId, loserId]) {
      const [u] = await tx
        .select({ totalXp: users.totalXp, trophies: users.trophies })
        .from(users)
        .where(eq(users.id, uid));
      const newLevel = levelFromXP(u.totalXp);
      const newRank = getRankForTrophies(u.trophies);
      await tx.update(users).set({
        level: newLevel,
        rank: newRank.name,
        rankTier: newRank.name,
      }).where(eq(users.id, uid));
    }

    // 5) Record game_results for both players
    const outcomeWinner = isForfeit ? 'win' : 'win';
    const outcomeLoser = isForfeit ? 'forfeit' : 'loss';

    await tx.insert(gameResults).values([
      {
        userId: winnerId,
        matchId,
        modeId,
        difficulty,
        outcome: outcomeWinner,
        score: winnerScore,
        mistakes: winnerMistakes,
        timeMs: winnerTimeMs,
        xpEarned: winnerXp,
        coinsEarned: pool,
        trophyDelta: trophyConfig.win,
        isPvp: true,
      },
      {
        userId: loserId,
        matchId,
        modeId,
        difficulty,
        outcome: outcomeLoser,
        score: loserScore,
        mistakes: loserMistakes,
        timeMs: loserTimeMs,
        xpEarned: loserXp,
        coinsEarned: 0,
        trophyDelta: -trophyConfig.loss,
        isPvp: true,
      },
    ]);

    // 6) Mark match as completed
    await tx
      .update(matches)
      .set({ status: 'completed', endedAt: sql`now()` })
      .where(eq(matches.id, matchId));
  });

  return {
    success: true,
    winnerCoinsEarned: pool,
    trophyDelta: trophyConfig,
  };
}

// ─── PvP: Refund Escrow (error/cancel) ──────

export async function refundEscrow(matchId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // Get all held escrow for this match
    const escrows = await tx
      .select({ userId: matchEscrow.userId, amount: matchEscrow.amount })
      .from(matchEscrow)
      .where(and(eq(matchEscrow.matchId, matchId), eq(matchEscrow.status, 'held')));

    for (const e of escrows) {
      // Refund coins
      await tx.update(users).set({ coins: sql`${users.coins} + ${e.amount}` }).where(eq(users.id, e.userId));
      // Mark escrow as refunded
      await tx
        .update(matchEscrow)
        .set({ status: 'refunded', resolvedAt: sql`now()` })
        .where(and(eq(matchEscrow.matchId, matchId), eq(matchEscrow.userId, e.userId)));
    }

    // Mark match as abandoned
    await tx
      .update(matches)
      .set({ status: 'abandoned', endedAt: sql`now()` })
      .where(eq(matches.id, matchId));
  });
}

// ─── Check if player can afford entry ───────

export async function canAffordEntry(userId: string, difficulty: string): Promise<boolean> {
  const fee = ENTRY_FEES[difficulty] ?? 100;
  const { coins } = await getUserBalance(userId);
  return coins >= fee;
}

// ─── Create Match Record in DB ──────────────

/**
 * Insert a match record into the DB with both players.
 * Returns the generated match UUID.
 */
export async function createMatchRecord(
  modeId: string,
  difficulty: string,
  playerAId: string,
  playerBId: string,
): Promise<string> {
  const result = await db.transaction(async (tx) => {
    const [match] = await tx
      .insert(matches)
      .values({
        modeId,
        difficulty,
        status: 'ongoing',
      })
      .returning({ id: matches.id });

    await tx.insert(matchPlayers).values([
      { matchId: match.id, userId: playerAId, score: 0, xpEarned: 0 },
      { matchId: match.id, userId: playerBId, score: 0, xpEarned: 0 },
    ]);

    return match.id;
  });

  return result;
}
