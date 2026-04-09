// ──────────────────────────────────────────────
// NINE — Economy Configuration
// Server-authoritative — no client-side mutations
// ──────────────────────────────────────────────

// ─── Starting Balance ───────────────────────

export const STARTING_COINS = 5000;

// ─── Entry Fees by Difficulty ───────────────

export const ENTRY_FEES: Record<string, number> = {
  easy: 50,
  medium: 100,
  hard: 250,
  expert: 500,
};

// ─── Trophy Awards by Difficulty ────────────
// [win, lose] — winner gains, loser loses

export const TROPHY_DELTAS: Record<string, { win: number; loss: number }> = {
  easy:   { win: 5,  loss: 3 },
  medium: { win: 12, loss: 8 },
  hard:   { win: 25, loss: 18 },
  expert: { win: 40, loss: 30 },
};

// ─── XP Awards (Offline Solo) ───────────────

export const BASE_XP: Record<string, number> = {
  easy: 100,
  medium: 250,
  hard: 500,
  expert: 1000,
};

/**
 * Time bonus multiplier — solving faster gives more XP.
 * Formula: clamp(2.0 - elapsed/limit, 0.5, 2.0)
 */
export function timeBonus(elapsedMs: number, timeLimitMs: number): number {
  const ratio = elapsedMs / timeLimitMs;
  return Math.max(0.5, Math.min(2.0, 2.0 - ratio));
}

/**
 * Mistake penalty — each mistake reduces XP by 15%.
 * Formula: (1 - 0.15 * mistakes)  clamped to [0.25, 1.0]
 */
export function mistakePenalty(mistakes: number): number {
  return Math.max(0.25, 1.0 - 0.15 * mistakes);
}

/**
 * Calculate final XP for an offline game.
 */
export function calculateXP(
  difficulty: string,
  elapsedMs: number,
  timeLimitMs: number,
  mistakes: number,
): number {
  const base = BASE_XP[difficulty] ?? 100;
  const tb = timeBonus(elapsedMs, timeLimitMs);
  const mp = mistakePenalty(mistakes);
  return Math.round(base * tb * mp);
}

// ─── Rank Tiers ─────────────────────────────

export const RANK_TIERS = [
  { name: 'Recruit',    minTrophies: 0,    color: '#8B8B8B' },
  { name: 'Bronze',     minTrophies: 100,  color: '#CD7F32' },
  { name: 'Silver',     minTrophies: 300,  color: '#C0C0C0' },
  { name: 'Gold',       minTrophies: 600,  color: '#FFD700' },
  { name: 'Platinum',   minTrophies: 1000, color: '#E5E4E2' },
  { name: 'Diamond',    minTrophies: 1500, color: '#B9F2FF' },
  { name: 'Mastermind', minTrophies: 2000, color: '#FF6B6B' },
] as const;

export function getRankForTrophies(trophies: number): typeof RANK_TIERS[number] {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (trophies >= RANK_TIERS[i].minTrophies) return RANK_TIERS[i];
  }
  return RANK_TIERS[0];
}

// ─── Level Thresholds ───────────────────────

const LEVEL_XP_BASE = 500;
const LEVEL_XP_GROWTH = 1.35;

/**
 * XP needed to reach a given level.
 * Level 1 = 0, Level 2 = 500, Level 3 = 1175, ...
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 2; l <= level; l++) {
    total += Math.round(LEVEL_XP_BASE * Math.pow(LEVEL_XP_GROWTH, l - 2));
  }
  return total;
}

/**
 * Derive level from total XP.
 */
export function levelFromXP(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
    if (level > 100) break; // safety cap
  }
  return level;
}

// ─── PvP Number Scoring ─────────────────────

/**
 * Calculate point value for each digit based on how many are pre-filled.
 * Rarer digits (fewer given instances) = higher points.
 *
 * @param givenCounts - Map of digit (1-9) to count of given instances
 * @returns Map of digit to point value
 */
export function calculateDigitValues(
  givenCounts: Record<number, number>,
): Record<number, number> {
  const values: Record<number, number> = {};
  for (let d = 1; d <= 9; d++) {
    const count = givenCounts[d] ?? 0;
    // More given = less valuable. Scale: 5-30 points.
    values[d] = Math.max(5, Math.min(30, Math.round(30 - count * 3)));
  }
  return values;
}

// ─── Matchmaking Range ──────────────────────

export const MATCH_TROPHY_RANGE_INITIAL = 200;
export const MATCH_TROPHY_RANGE_EXPAND = 100; // per 10 seconds of waiting
export const MATCH_TROPHY_RANGE_MAX = 800;

// ─── Time Limits (seconds) ──────────────────

export const TIME_LIMITS: Record<string, number> = {
  easy: 600,     // 10 min
  medium: 900,   // 15 min
  hard: 1200,    // 20 min
  expert: 1800,  // 30 min
};

// ─── Max Mistakes ───────────────────────────

export const MAX_MISTAKES = 3;
