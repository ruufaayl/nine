// ──────────────────────────────────────────────
// NINE — Socket Event Wiring
// ──────────────────────────────────────────────

import type { Server, Socket } from 'socket.io';
import { randomUUID } from 'node:crypto';
import { joinQueue, checkQueue, leaveQueue } from './matchmaker';
import { createRoom, registerRoomEvents } from './roomHandler';

// ─── Constants ──────────────────────────────

/** How often to poll each queue for matches (ms). */
const MATCH_POLL_INTERVAL_MS = 500;

/** Active mode queues being polled. */
const activePollers = new Map<string, ReturnType<typeof setInterval>>();

// ─── Puzzle Seed Generator ──────────────────

function generatePuzzleSeed(): string {
  return randomUUID();
}

// ─── Start Queue Poller ─────────────────────

function ensurePoller(io: Server, modeId: string): void {
  if (activePollers.has(modeId)) return;

  const poller = setInterval(async () => {
    try {
      const match = await checkQueue(modeId);
      if (!match) return;

      const { roomId, playerA, playerB } = match;
      const puzzleSeed = generatePuzzleSeed();

      // Create the room
      createRoom(roomId, modeId, puzzleSeed, playerA, playerB);

      // Join both sockets to the room
      const socketA = io.sockets.sockets.get(playerA.socketId);
      const socketB = io.sockets.sockets.get(playerB.socketId);

      if (!socketA || !socketB) {
        // One player disconnected before match — re-queue the other
        if (socketA) {
          await joinQueue(playerA.userId, modeId, playerA.socketId);
          socketA.emit('match_cancelled', { reason: 'Opponent disconnected.' });
        }
        if (socketB) {
          await joinQueue(playerB.userId, modeId, playerB.socketId);
          socketB.emit('match_cancelled', { reason: 'Opponent disconnected.' });
        }
        return;
      }

      await socketA.join(roomId);
      await socketB.join(roomId);

      // Emit match_started to both players
      io.to(roomId).emit('match_started', {
        roomId,
        modeId,
        puzzleSeed,
        players: [
          { userId: playerA.userId, socketId: playerA.socketId },
          { userId: playerB.userId, socketId: playerB.socketId },
        ],
      });

      console.log(
        `[match] ${playerA.userId} vs ${playerB.userId} → ${roomId} (${modeId})`,
      );
    } catch (err) {
      console.error(`[match] poller error for ${modeId}:`, err);
    }
  }, MATCH_POLL_INTERVAL_MS);

  activePollers.set(modeId, poller);
}

// ─── Register Connection Events ─────────────

export function registerSocketEvents(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[ws] connected: ${socket.id}`);

    // ── Find Match ──────────────────────────
    socket.on(
      'find_match',
      async (data: { userId: string; modeId: string }) => {
        const { userId, modeId } = data;

        if (!userId || !modeId) {
          socket.emit('error', { message: 'userId and modeId are required.' });
          return;
        }

        // Join the queue
        await joinQueue(userId, modeId, socket.id);

        // Acknowledge
        socket.emit('queue_joined', { modeId });

        // Ensure the poller is running for this mode
        ensurePoller(io, modeId);

        console.log(`[queue] ${userId} → ${modeId}`);
      },
    );

    // ── Cancel Match Search ─────────────────
    socket.on('cancel_match', async (data: { userId: string }) => {
      await leaveQueue(data.userId);
      socket.emit('queue_left');
    });

    // ── Register game room event handlers ───
    registerRoomEvents(io, socket);

    // ── Disconnect ──────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[ws] disconnected: ${socket.id}`);
      // Note: room disconnect is handled in roomHandler.ts
    });
  });
}

// ─── Cleanup ────────────────────────────────

export function shutdownPollers(): void {
  for (const [, poller] of activePollers) {
    clearInterval(poller);
  }
  activePollers.clear();
}
