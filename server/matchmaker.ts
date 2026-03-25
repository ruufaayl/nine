// ──────────────────────────────────────────────
// NINE — Redis-Backed Matchmaker
// ──────────────────────────────────────────────

import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';

// ─── Types ──────────────────────────────────

export interface QueueEntry {
  userId: string;
  socketId: string;
  joinedAt: number;
}

export interface MatchResult {
  roomId: string;
  playerA: QueueEntry;
  playerB: QueueEntry;
  modeId: string;
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

function queueKey(modeId: string): string {
  return `nine:queue:${modeId}`;
}

function userQueueKey(userId: string): string {
  return `nine:user_queue:${userId}`;
}

// ─── Join Queue ─────────────────────────────

/**
 * Add a player to the matchmaking queue for a given mode.
 * Prevents duplicate entries for the same user.
 */
export async function joinQueue(
  userId: string,
  modeId: string,
  socketId: string,
): Promise<void> {
  const entry: QueueEntry = {
    userId,
    socketId,
    joinedAt: Date.now(),
  };

  // Prevent duplicate queue entries
  const existingQueue = await redis.get(userQueueKey(userId));
  if (existingQueue) {
    // Remove from old queue first
    await leaveQueue(userId, existingQueue);
  }

  // Push to mode-specific list
  await redis.rpush(queueKey(modeId), JSON.stringify(entry));

  // Track which queue this user is in
  await redis.set(userQueueKey(userId), modeId, 'EX', 300); // 5 min TTL
}

// ─── Leave Queue ────────────────────────────

/**
 * Remove a player from a matchmaking queue.
 */
export async function leaveQueue(
  userId: string,
  modeId?: string,
): Promise<void> {
  const mode = modeId ?? (await redis.get(userQueueKey(userId)));
  if (!mode) return;

  // Scan the queue list and remove entries for this user
  const entries = await redis.lrange(queueKey(mode), 0, -1);
  for (const raw of entries) {
    try {
      const entry = JSON.parse(raw) as QueueEntry;
      if (entry.userId === userId) {
        await redis.lrem(queueKey(mode), 1, raw);
      }
    } catch {
      // Skip malformed entries
    }
  }

  await redis.del(userQueueKey(userId));
}

// ─── Check Queue ────────────────────────────

/**
 * Check if a mode queue has ≥ 2 players.
 * If so, pop the first two and return a match.
 * Returns null if no match is available.
 */
export async function checkQueue(
  modeId: string,
): Promise<MatchResult | null> {
  const key = queueKey(modeId);
  const length = await redis.llen(key);

  if (length < 2) return null;

  // Pop two entries atomically via a transaction
  const results = await redis
    .multi()
    .lpop(key)
    .lpop(key)
    .exec();

  if (!results || results.length < 2) return null;

  const [errA, rawA] = results[0];
  const [errB, rawB] = results[1];

  if (errA || errB || !rawA || !rawB) return null;

  let playerA: QueueEntry;
  let playerB: QueueEntry;

  try {
    playerA = JSON.parse(rawA as string) as QueueEntry;
    playerB = JSON.parse(rawB as string) as QueueEntry;
  } catch {
    return null;
  }

  // Clean up user-queue tracking
  await redis.del(userQueueKey(playerA.userId));
  await redis.del(userQueueKey(playerB.userId));

  const roomId = `room_${randomUUID().slice(0, 8)}`;

  return {
    roomId,
    playerA,
    playerB,
    modeId,
  };
}

// ─── Cleanup ────────────────────────────────

/**
 * Graceful shutdown — close Redis connection.
 */
export async function shutdownMatchmaker(): Promise<void> {
  await redis.quit();
}
