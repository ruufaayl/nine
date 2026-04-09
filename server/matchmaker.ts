// ──────────────────────────────────────────────
// NINE — Redis-Backed Matchmaker
// Difficulty-aware + trophy-range matching
// ──────────────────────────────────────────────

import {
  MATCH_TROPHY_RANGE_INITIAL,
  MATCH_TROPHY_RANGE_EXPAND,
  MATCH_TROPHY_RANGE_MAX,
} from '../src/lib/economy';

import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';

// ─── Types ──────────────────────────────────

export interface QueueEntry {
  userId: string;
  socketId: string;
  joinedAt: number;
  difficulty: string;
  trophies: number;
}

export interface MatchResult {
  roomId: string;
  playerA: QueueEntry;
  playerB: QueueEntry;
  modeId: string;
  difficulty: string;
}

// ─── Redis Client ───────────────────────────

const REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 200, 3000);
  },
});

redis.on('error', (err) => {
  console.error('[matchmaker] Redis error:', err.message);
});

// ─── Queue Keys ─────────────────────────────

function queueKey(modeId: string, difficulty: string = 'medium'): string {
  return `nine:queue:${modeId}:${difficulty}`;
}

function userQueueKey(userId: string): string {
  return `nine:user_queue:${userId}`;
}

// ─── Join Queue ─────────────────────────────

export async function joinQueue(
  userId: string,
  modeId: string,
  socketId: string,
  difficulty: string = 'medium',
  trophies: number = 0,
): Promise<void> {
  const entry: QueueEntry = {
    userId,
    socketId,
    joinedAt: Date.now(),
    difficulty,
    trophies,
  };

  // Prevent duplicate queue entries
  const existingQueue = await redis.get(userQueueKey(userId));
  if (existingQueue) {
    // Parse out the old difficulty
    try {
      const parsed = JSON.parse(existingQueue) as { modeId: string; difficulty: string };
      await leaveQueue(userId, parsed.modeId, parsed.difficulty);
    } catch {
      await leaveQueue(userId, existingQueue);
    }
  }

  // Push to mode+difficulty-specific list
  await redis.rpush(queueKey(modeId, difficulty), JSON.stringify(entry));

  // Track which queue this user is in
  await redis.set(
    userQueueKey(userId),
    JSON.stringify({ modeId, difficulty }),
    'EX', 300,
  );
}

// ─── Leave Queue ────────────────────────────

export async function leaveQueue(
  userId: string,
  modeId?: string,
  difficulty?: string,
): Promise<void> {
  let mode = modeId;
  let diff = difficulty ?? 'medium';

  if (!mode) {
    const raw = await redis.get(userQueueKey(userId));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { modeId: string; difficulty: string };
      mode = parsed.modeId;
      diff = parsed.difficulty;
    } catch {
      mode = raw;
    }
  }

  if (!mode) return;

  const entries = await redis.lrange(queueKey(mode, diff), 0, -1);
  for (const raw of entries) {
    try {
      const entry = JSON.parse(raw) as QueueEntry;
      if (entry.userId === userId) {
        await redis.lrem(queueKey(mode, diff), 1, raw);
      }
    } catch {
      // Skip malformed entries
    }
  }

  await redis.del(userQueueKey(userId));
}

// ─── Check Queue ────────────────────────────

export async function checkQueue(
  modeId: string,
  difficulty?: string,
): Promise<MatchResult | null> {
  // Scan all difficulty queues for this mode
  const difficulties = difficulty ? [difficulty] : ['easy', 'medium', 'hard', 'expert'];

  for (const diff of difficulties) {
    const key = queueKey(modeId, diff);
    const length = await redis.llen(key);

    if (length < 2) continue;

    // Read all entries for trophy-range matching
    const rawEntries = await redis.lrange(key, 0, -1);
    const entries: { raw: string; entry: QueueEntry }[] = [];

    for (const raw of rawEntries) {
      try {
        entries.push({ raw, entry: JSON.parse(raw) as QueueEntry });
      } catch {
        // Skip malformed
      }
    }

    if (entries.length < 2) continue;

    // Try to find a trophy-compatible pair
    const now = Date.now();
    let bestPair: [number, number] | null = null;
    let bestDiff = Infinity;

    for (let i = 0; i < entries.length; i++) {
      const a = entries[i].entry;
      const aWaitSec = (now - a.joinedAt) / 1000;
      const aRange = Math.min(
        MATCH_TROPHY_RANGE_MAX,
        MATCH_TROPHY_RANGE_INITIAL + Math.floor(aWaitSec / 10) * MATCH_TROPHY_RANGE_EXPAND,
      );

      for (let j = i + 1; j < entries.length; j++) {
        const b = entries[j].entry;
        const bWaitSec = (now - b.joinedAt) / 1000;
        const bRange = Math.min(
          MATCH_TROPHY_RANGE_MAX,
          MATCH_TROPHY_RANGE_INITIAL + Math.floor(bWaitSec / 10) * MATCH_TROPHY_RANGE_EXPAND,
        );

        const trophyDiff = Math.abs(a.trophies - b.trophies);
        const maxRange = Math.max(aRange, bRange);

        if (trophyDiff <= maxRange && trophyDiff < bestDiff) {
          bestDiff = trophyDiff;
          bestPair = [i, j];
        }
      }
    }

    if (!bestPair) continue;

    const [idxA, idxB] = bestPair;
    const playerA = entries[idxA].entry;
    const playerB = entries[idxB].entry;

    // Remove both from the queue (remove higher index first to avoid shift)
    await redis.lrem(key, 1, entries[idxB].raw);
    await redis.lrem(key, 1, entries[idxA].raw);

    // Clean up user-queue tracking
    await redis.del(userQueueKey(playerA.userId));
    await redis.del(userQueueKey(playerB.userId));

    const roomId = `room_${randomUUID().slice(0, 8)}`;

    return {
      roomId,
      playerA,
      playerB,
      modeId,
      difficulty: diff,
    };
  }

  return null;
}

// ─── Cleanup ────────────────────────────────

export async function shutdownMatchmaker(): Promise<void> {
  await redis.quit();
}
