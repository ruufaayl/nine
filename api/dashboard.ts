// ──────────────────────────────────────────────
// NINE — /api/dashboard
// GET ?q=activity|daily|live
// Consolidated dashboard endpoint (Vercel Hobby limit)
// ──────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, gt, desc, sql } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import {
  users, sessions, matches, matchPlayers, notifications,
  dailyChallenges, dailyChallengeScores,
} from '../src/db/schema.js';

const COOKIE_NAME = '__nine_session';

function getSessionId(req: VercelRequest): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  return match.slice(COOKIE_NAME.length + 1) || null;
}

async function getAuthUserId(sessionId: string): Promise<string | null> {
  const [session] = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, sql`NOW()`)))
    .limit(1);
  return session?.userId ?? null;
}

// ─── Activity ──────────────────────────────

async function handleActivity(req: VercelRequest, res: VercelResponse) {
  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(401).json({ error: 'Not authenticated' });

  const userId = await getAuthUserId(sessionId);
  if (!userId) return res.status(401).json({ error: 'Session expired' });

  const recentMatches = await db
    .select({
      matchId: matches.id, modeId: matches.modeId,
      result: matchPlayers.result, xpEarned: matchPlayers.xpEarned,
      endedAt: matches.endedAt,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matches.id, matchPlayers.matchId))
    .where(and(eq(matchPlayers.userId, userId), eq(matches.status, 'completed')))
    .orderBy(desc(matches.endedAt))
    .limit(10);

  const matchIds = recentMatches.map((m) => m.matchId);
  let opponents: Record<string, string> = {};
  if (matchIds.length > 0) {
    const oppRows = await db
      .select({ matchId: matchPlayers.matchId, username: users.username })
      .from(matchPlayers)
      .innerJoin(users, eq(users.id, matchPlayers.userId))
      .where(and(sql`${matchPlayers.matchId} = ANY(${matchIds})`, sql`${matchPlayers.userId} != ${userId}`));
    for (const row of oppRows) opponents[row.matchId] = row.username;
  }

  const recentNotifs = await db
    .select({ id: notifications.id, type: notifications.type, content: notifications.content, isRead: notifications.isRead, createdAt: notifications.createdAt })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(10);

  const activity = [
    ...recentMatches.map((m) => ({
      id: `match-${m.matchId}`, type: 'match' as const,
      text: m.result === 'win' ? `You defeated ${opponents[m.matchId] ?? 'an opponent'} in ${m.modeId}` : m.result === 'loss' ? `You lost to ${opponents[m.matchId] ?? 'an opponent'} in ${m.modeId}` : `Draw with ${opponents[m.matchId] ?? 'an opponent'} in ${m.modeId}`,
      icon: m.result === 'win' ? '⚡' : m.result === 'loss' ? '✗' : '≈',
      accent: m.result === 'win' ? 'var(--electric-lime)' : m.result === 'loss' ? 'var(--neon-magenta)' : 'var(--cyber-cyan)',
      xp: m.xpEarned, time: m.endedAt?.toISOString() ?? null,
    })),
    ...recentNotifs.map((n) => ({
      id: `notif-${n.id}`, type: 'notification' as const,
      text: n.content,
      icon: n.type === 'friend_request' ? '◈' : n.type === 'game_invite' ? '⚔' : '●',
      accent: n.type === 'friend_request' ? 'var(--cyber-cyan)' : n.type === 'game_invite' ? 'var(--neon-magenta)' : 'var(--laser-orange)',
      xp: 0, time: n.createdAt?.toISOString() ?? null,
    })),
  ].sort((a, b) => {
    if (!a.time) return 1; if (!b.time) return -1;
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  }).slice(0, 10);

  res.setHeader('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');
  return res.status(200).json(activity);
}

// ─── Daily ─────────────────────────────────

async function handleDaily(req: VercelRequest, res: VercelResponse) {
  const sessionId = getSessionId(req);
  let userId: string | null = null;
  if (sessionId) userId = await getAuthUserId(sessionId);

  const [today] = await db.select().from(dailyChallenges).where(eq(dailyChallenges.activeDate, sql`CURRENT_DATE`)).limit(1);
  if (!today) {
    res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    return res.status(200).json({ challenge: null, streak: 0, completed: false });
  }

  let completed = false;
  let streak = 0;

  if (userId) {
    const [score] = await db.select().from(dailyChallengeScores).where(and(eq(dailyChallengeScores.challengeId, today.id), eq(dailyChallengeScores.userId, userId))).limit(1);
    completed = !!score;

    const streakRows = await db.select({ activeDate: dailyChallenges.activeDate }).from(dailyChallengeScores).innerJoin(dailyChallenges, eq(dailyChallenges.id, dailyChallengeScores.challengeId)).where(eq(dailyChallengeScores.userId, userId)).orderBy(desc(dailyChallenges.activeDate)).limit(60);

    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    const completedDates = new Set(streakRows.map((r) => { const d = new Date(r.activeDate as unknown as string); d.setHours(0, 0, 0, 0); return d.getTime(); }));

    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(todayDate); checkDate.setDate(checkDate.getDate() - i);
      if (completedDates.has(checkDate.getTime())) streak++; else break;
    }
  }

  const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(dailyChallengeScores).where(eq(dailyChallengeScores.challengeId, today.id));

  res.setHeader('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');
  return res.status(200).json({ challenge: { id: today.id, modeId: today.modeId, activeDate: today.activeDate }, streak, completed, totalCompletions: Number(count) });
}

// ─── Live ──────────────────────────────────

async function handleLive(_req: VercelRequest, res: VercelResponse) {
  const ongoing = await db.select({ id: matches.id, modeId: matches.modeId, startedAt: matches.startedAt }).from(matches).where(eq(matches.status, 'ongoing')).orderBy(matches.startedAt).limit(6);

  if (ongoing.length === 0) {
    res.setHeader('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
    return res.status(200).json([]);
  }

  const matchIds = ongoing.map((m) => m.id);
  const players = await db.select({ matchId: matchPlayers.matchId, username: users.username }).from(matchPlayers).innerJoin(users, eq(users.id, matchPlayers.userId)).where(sql`${matchPlayers.matchId} = ANY(${matchIds})`);

  const playersByMatch: Record<string, string[]> = {};
  for (const p of players) { if (!playersByMatch[p.matchId]) playersByMatch[p.matchId] = []; playersByMatch[p.matchId].push(p.username); }

  const now = Date.now();
  const result = ongoing.map((m) => {
    const ps = playersByMatch[m.id] ?? [];
    const totalSec = Math.floor((now - (m.startedAt?.getTime() ?? now)) / 1000);
    return { id: m.id, mode: m.modeId, p1: ps[0] ?? '???', p2: ps[1] ?? '???', time: `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}` };
  });

  res.setHeader('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');
  return res.status(200).json(result);
}

// ─── Router ────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const q = (req.query.q as string) ?? 'daily';
    switch (q) {
      case 'activity': return handleActivity(req, res);
      case 'daily': return handleDaily(req, res);
      case 'live': return handleLive(req, res);
      default: return res.status(400).json({ error: `Unknown query: ${q}` });
    }
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
