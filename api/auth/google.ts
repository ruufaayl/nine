// ──────────────────────────────────────────────
// NINE — Google OAuth: Initiate
// GET /api/auth/google → redirect to Google
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Google, generateState, generateCodeVerifier } from 'arctic';

function getGoogle() {
  return new Google(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.APP_URL ?? 'http://localhost:5199'}/api/auth/google/callback`,
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const google = getGoogle();
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile']);

  // Store state + verifier in short-lived cookies for the callback
  const cookieOpts = 'Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600';
  res.setHeader('Set-Cookie', [
    `__nine_google_state=${state}; ${cookieOpts}`,
    `__nine_google_verifier=${codeVerifier}; ${cookieOpts}`,
  ]);

  return res.redirect(302, url.toString());
}
