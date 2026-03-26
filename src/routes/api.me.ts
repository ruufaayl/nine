// ──────────────────────────────────────────────
// NINE — /api/me Resource Route (current user)
// ──────────────────────────────────────────────

import type { LoaderFunctionArgs } from 'react-router';
import { getUserFromRequest } from '../lib/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({
    user: {
      id: user.id,
      username: user.username,
      rank: user.rank,
      xp: user.xp,
      isGuest: user.isGuest,
    },
  });
}
