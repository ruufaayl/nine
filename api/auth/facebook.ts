// ──────────────────────────────────────────────
// NINE — Facebook OAuth: Initiate
// GET /api/auth/facebook → redirect to Facebook
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Facebook, generateState } from 'arctic';

function getFacebook() {
  return new Facebook(
    process.env.FACEBOOK_APP_ID!,
    process.env.FACEBOOK_APP_SECRET!,
    `${process.env.APP_URL ?? 'http://localhost:5199'}/api/auth/facebook/callback`,
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const facebook = getFacebook();
  const state = generateState();

  const url = facebook.createAuthorizationURL(state, ['email', 'public_profile']);

  const cookieOpts = 'Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600';
  res.setHeader('Set-Cookie', `__nine_fb_state=${state}; ${cookieOpts}`);

  return res.redirect(302, url.toString());
}
