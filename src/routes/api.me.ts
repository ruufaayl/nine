// ──────────────────────────────────────────────
// NINE — /api/me Resource Route (current user)
// Returns full user profile including economy data
// ──────────────────────────────────────────────

import type { LoaderFunctionArgs } from 'react-router';
import { getUserFromRequest } from '../lib/auth.server';
import { getRankForTrophies, levelFromXP, xpForLevel } from '../lib/economy';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }

  // Derive rank + level from authoritative data
  const rank = getRankForTrophies(user.trophies ?? 0);
  const level = levelFromXP(user.totalXp ?? 0);
  const nextLevelXp = xpForLevel(level + 1);
  const currentLevelXp = xpForLevel(level);

  return Response.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      bio: user.bio ?? null,
      isGuest: user.isGuest,
      createdAt: user.createdAt,

      // Economy
      coins: user.coins ?? 5000,
      trophies: user.trophies ?? 0,
      level,

      // XP
      xp: user.xp ?? 0,
      totalXp: user.totalXp ?? 0,
      xpToNextLevel: nextLevelXp - (user.totalXp ?? 0),
      currentLevelXp,
      nextLevelXp,

      // Rank
      rank: rank.name,
      rankTier: rank.name,
      rankColor: rank.color,

      // Stats
      gamesPlayed: user.gamesPlayed ?? 0,
      wins: user.wins ?? 0,
      losses: user.losses ?? 0,
      winRate: (user.gamesPlayed ?? 0) > 0
        ? Math.round(((user.wins ?? 0) / (user.gamesPlayed ?? 0)) * 100)
        : 0,
    },
  });
}
