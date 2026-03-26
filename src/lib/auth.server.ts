// ──────────────────────────────────────────────
// NINE — Auth Server Utilities (.server = never bundled to client)
// ──────────────────────────────────────────────

import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, sessions, scores, passwordResets } from '../db/schema.js';
import type { User } from '../db/schema.js';

// ─── Constants ──────────────────────────────

const SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
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
      isGuest: false,
    })
    .returning();

  return toSafeUser(user);
}

// ─── Create Guest User ─────────────────────

export async function createGuestUser(): Promise<SafeUser> {
  const hex = crypto.randomBytes(2).toString('hex'); // 4 hex chars
  const alias = `Guest_${hex}`;
  const fakeEmail = `guest_${hex}_${Date.now()}@nine.local`;

  const [user] = await db
    .insert(users)
    .values({
      username: alias,
      email: fakeEmail,
      passwordHash: '', // no password for guests
      isGuest: true,
    })
    .returning();

  return toSafeUser(user);
}

// ─── Destroy Guest Data ────────────────────

export async function destroyGuestData(userId: string): Promise<void> {
  // CASCADE on scores + sessions handles child rows automatically
  await db.delete(users).where(eq(users.id, userId));
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

  // Guest accounts cannot log in with passwords
  if (user.isGuest) return null;

  // Empty hash = no password set (shouldn't happen for non-guests)
  if (!user.passwordHash) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  return toSafeUser(user);
}

// ─── Password Reset ─────────────────────────

export async function generatePasswordResetToken(
  email: string,
): Promise<{ success: boolean; message: string }> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);

  if (!user || user.isGuest) {
    // Don't leak whether email exists — always return success
    return {
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await db.insert(passwordResets).values({
    userId: user.id,
    token,
    expiresAt,
  });

  // ── Mock email (plug in SMTP later) ──
  console.log('─────────────────────────────────────────');
  console.log('[NINE] Password Reset Email (MOCK)');
  console.log(`  To:    ${user.email}`);
  console.log(`  Token: ${token}`);
  console.log(`  Link:  https://nine.io/reset?token=${token}`);
  console.log(`  Expires: ${expiresAt.toISOString()}`);
  console.log('─────────────────────────────────────────');

  return {
    success: true,
    message: 'If an account exists with that email, a reset link has been sent.',
  };
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
  return `${COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
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

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  // Check expiry
  if (new Date(session.expiresAt) < new Date()) {
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

// ─── Get Session ID from Request ────────────

export function getSessionIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  return parseSessionIdFromCookie(cookieHeader);
}

// ─── Fetch Recent Scores for User ───────────

export async function getRecentScores(
  userId: string,
  limit = 10,
): Promise<Array<{ id: string; modeId: string; score: number; timeMs: number; createdAt: Date }>> {
  const rows = await db
    .select({
      id: scores.id,
      modeId: scores.modeId,
      score: scores.score,
      timeMs: scores.timeMs,
      createdAt: scores.createdAt,
    })
    .from(scores)
    .where(eq(scores.userId, userId))
    .orderBy(scores.createdAt)
    .limit(limit);

  return rows;
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
