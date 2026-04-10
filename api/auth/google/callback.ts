// ──────────────────────────────────────────────
// NINE — Google OAuth: Callback
// GET /api/auth/google/callback
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Google } from 'arctic';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../src/db/index.js';
import { users, oauthAccounts } from '../../../src/db/schema.js';
import { createSession, serializeSessionCookie } from '../../../src/lib/auth.server.js';

function getGoogle() {
  return new Google(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.APP_URL ?? 'http://localhost:5199'}/api/auth/google/callback`,
  );
}

function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  const match = header.split(';').map(c => c.trim()).find(c => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const code = req.query.code as string;
  const state = req.query.state as string;
  const cookieHeader = req.headers.cookie ?? '';
  const storedState = parseCookie(cookieHeader, '__nine_google_state');
  const storedVerifier = parseCookie(cookieHeader, '__nine_google_verifier');

  // Validate state
  if (!code || !state || state !== storedState || !storedVerifier) {
    return res.redirect(302, '/login?error=oauth_state');
  }

  try {
    const google = getGoogle();
    const tokens = await google.validateAuthorizationCode(code, storedVerifier);
    const accessToken = tokens.accessToken();

    // Fetch user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json() as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    if (!profile.id || !profile.email) {
      return res.redirect(302, '/login?error=oauth_profile');
    }

    // Check if this Google account is already linked
    const [existingOAuth] = await db
      .select()
      .from(oauthAccounts)
      .where(and(
        eq(oauthAccounts.provider, 'google'),
        eq(oauthAccounts.providerUserId, profile.id),
      ))
      .limit(1);

    let userId: string;

    if (existingOAuth) {
      // Returning user — log them in
      userId = existingOAuth.userId;
    } else {
      // Check if a user with this email already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, profile.email.toLowerCase()))
        .limit(1);

      if (existingUser) {
        // Link Google to existing email account
        userId = existingUser.id;
      } else {
        // Create brand-new user
        const username = profile.name
          ?.replace(/[^a-zA-Z0-9_]/g, '_')
          .slice(0, 20)
          || `Player_${profile.id.slice(0, 6)}`;

        const [newUser] = await db
          .insert(users)
          .values({
            username,
            email: profile.email.toLowerCase(),
            passwordHash: '', // OAuth users have no password
            isGuest: false,
            avatarUrl: profile.picture ?? null,
          })
          .returning();

        userId = newUser.id;
      }

      // Create the oauth link
      await db.insert(oauthAccounts).values({
        userId,
        provider: 'google',
        providerUserId: profile.id,
        providerEmail: profile.email.toLowerCase(),
      });
    }

    // Create session + set cookie
    const sessionId = await createSession(userId);

    // Clear OAuth state cookies + set session cookie
    const clearOpts = 'Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
    res.setHeader('Set-Cookie', [
      serializeSessionCookie(sessionId),
      `__nine_google_state=; ${clearOpts}`,
      `__nine_google_verifier=; ${clearOpts}`,
    ]);

    return res.redirect(302, '/');
  } catch (err) {
    console.error('[OAuth/Google] Callback error:', err);
    return res.redirect(302, '/login?error=oauth_failed');
  }
}
