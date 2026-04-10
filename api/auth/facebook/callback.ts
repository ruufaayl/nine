// ──────────────────────────────────────────────
// NINE — Facebook OAuth: Callback
// GET /api/auth/facebook/callback
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Facebook } from 'arctic';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../src/db/index.js';
import { users, oauthAccounts } from '../../../src/db/schema.js';
import { createSession, serializeSessionCookie } from '../../../src/lib/auth.server.js';

function getFacebook() {
  return new Facebook(
    process.env.FACEBOOK_APP_ID!,
    process.env.FACEBOOK_APP_SECRET!,
    `${process.env.APP_URL ?? 'http://localhost:5199'}/api/auth/facebook/callback`,
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
  const storedState = parseCookie(cookieHeader, '__nine_fb_state');

  if (!code || !state || state !== storedState) {
    return res.redirect(302, '/login?error=oauth_state');
  }

  try {
    const facebook = getFacebook();
    const tokens = await facebook.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    // Fetch user profile from Facebook Graph API
    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`,
    );
    const profile = await profileRes.json() as {
      id: string;
      name: string;
      email?: string;
      picture?: { data?: { url?: string } };
    };

    if (!profile.id) {
      return res.redirect(302, '/login?error=oauth_profile');
    }

    // Facebook may not return email if user hasn't verified it
    const email = profile.email?.toLowerCase() ?? `fb_${profile.id}@nine.local`;

    // Check if this Facebook account is already linked
    const [existingOAuth] = await db
      .select()
      .from(oauthAccounts)
      .where(and(
        eq(oauthAccounts.provider, 'facebook'),
        eq(oauthAccounts.providerUserId, profile.id),
      ))
      .limit(1);

    let userId: string;

    if (existingOAuth) {
      userId = existingOAuth.userId;
    } else {
      // Check if a user with this email already exists (only if real email)
      let existingUser: typeof users.$inferSelect | undefined;
      if (profile.email) {
        [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
      }

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const username = profile.name
          ?.replace(/[^a-zA-Z0-9_]/g, '_')
          .slice(0, 20)
          || `Player_${profile.id.slice(0, 6)}`;

        const [newUser] = await db
          .insert(users)
          .values({
            username,
            email,
            passwordHash: '',
            isGuest: false,
            avatarUrl: profile.picture?.data?.url ?? null,
          })
          .returning();

        userId = newUser.id;
      }

      await db.insert(oauthAccounts).values({
        userId,
        provider: 'facebook',
        providerUserId: profile.id,
        providerEmail: email,
      });
    }

    const sessionId = await createSession(userId);

    const clearOpts = 'Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
    res.setHeader('Set-Cookie', [
      serializeSessionCookie(sessionId),
      `__nine_fb_state=; ${clearOpts}`,
    ]);

    return res.redirect(302, '/');
  } catch (err) {
    console.error('[OAuth/Facebook] Callback error:', err);
    return res.redirect(302, '/login?error=oauth_failed');
  }
}
