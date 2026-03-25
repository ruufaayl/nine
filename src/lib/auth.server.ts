// ──────────────────────────────────────────────
// NINE — Auth Server Utilities (.server = never bundled to client)
// ──────────────────────────────────────────────

import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, sessions } from '../db/schema';
import type { User } from '../db/schema';

// ─── Constants ──────────────────────────────

const SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const COOKIE_NAME = '__nine_session';

// ─── Public User Type (omits sensitive fields) ──

export type SafeUser = Omit<User, 'passwordHash'>;

function toSafeUser(user: User): SafeUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

// ─── Create User ────────────────────────────

export async function createUser(
  username: string,
  email: string,
  password: string,
): Promise<SafeUser> {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(users)
    .values({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
    })
    .returning();

  return toSafeUser(user);
}

// ─── Verify Login ───────────────────────────

export async function verifyLogin(
  email: string,
  password: string,
): Promise<SafeUser | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);

  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  return toSafeUser(user);
}

// ─── Session Management ─────────────────────

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const [session] = await db
    .insert(sessions)
    .values({ userId, expiresAt })
    .returning();

  return session.id;
}

export async function destroySession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

// ─── Cookie Helpers ─────────────────────────

export function serializeSessionCookie(sessionId: string): string {
  const maxAge = SESSION_DURATION_MS / 1000;
  return `${COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function parseSessionIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (!match) return null;

  const value = match.slice(COOKIE_NAME.length + 1);
  return value || null;
}

// ─── Get User From Request ──────────────────

export async function getUserFromRequest(
  request: Request,
): Promise<SafeUser | null> {
  const cookieHeader = request.headers.get('Cookie');
  const sessionId = parseSessionIdFromCookie(cookieHeader);

  if (!sessionId) return null;

  // Join session → user, check expiry
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  // Check expiry
  if (new Date(session.expiresAt) < new Date()) {
    // Clean up expired session
    await destroySession(sessionId);
    return null;
  }

  // Fetch user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) return null;

  return toSafeUser(user);
}

// ─── Validation Helpers ─────────────────────

export interface AuthErrors {
  username?: string;
  email?: string;
  password?: string;
  form?: string;
}

export function validateSignup(
  username: string,
  email: string,
  password: string,
): AuthErrors | null {
  const errors: AuthErrors = {};

  if (!username || username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters.';
  }
  if (username.trim().length > 32) {
    errors.username = 'Username must be 32 characters or fewer.';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
    errors.username = 'Username: letters, numbers, hyphens, underscores only.';
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'A valid email is required.';
  }

  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateLogin(
  email: string,
  password: string,
): AuthErrors | null {
  const errors: AuthErrors = {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'A valid email is required.';
  }

  if (!password || password.length === 0) {
    errors.password = 'Password is required.';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
