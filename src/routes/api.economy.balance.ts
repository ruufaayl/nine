// ──────────────────────────────────────────────
// NINE — /api/economy/balance Resource Route
// GET — returns user's coins, trophies, rank, level
// ──────────────────────────────────────────────

import type { LoaderFunctionArgs } from 'react-router';
import { getUserFromRequest } from '../lib/auth.server';
import { getUserBalance } from '../lib/progression.server';
import { getRankForTrophies, levelFromXP, xpForLevel } from '../lib/economy';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const balance = await getUserBalance(user.id);
    const rank = getRankForTrophies(balance.trophies);
    const level = levelFromXP(user.totalXp ?? 0);
    const nextLevelXp = xpForLevel(level + 1);
    const currentLevelXp = xpForLevel(level);

    return Response.json({
      coins: balance.coins,
      trophies: balance.trophies,
      rank: rank.name,
      rankColor: rank.color,
      level,
      totalXp: user.totalXp ?? 0,
      xpToNextLevel: nextLevelXp - (user.totalXp ?? 0),
      currentLevelXp,
      nextLevelXp,
    });
  } catch (error) {
    console.error('[api.economy.balance] Failed:', error);
    return Response.json(
      { error: 'Failed to fetch balance.' },
      { status: 500 },
    );
  }
}
