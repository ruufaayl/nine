// ──────────────────────────────────────────────
// NINE — Socket Event Wiring
// Escrow integration + balance-gated matchmaking
// Ready-up + Countdown flow
// ──────────────────────────────────────────────

import type { Server, Socket } from 'socket.io';
import { randomUUID } from 'node:crypto';
import { joinQueue, checkQueue, leaveQueue } from './matchmaker';
import { createRoom, registerRoomEvents, markEscrowCreated, getRoom } from './roomHandler';

// ─── Constants ──────────────────────────────

const MATCH_POLL_INTERVAL_MS = 500;
const activePollers = new Map<string, ReturnType<typeof setInterval>>();

// ─── Puzzle Seed Generator ──────────────────

function generatePuzzleSeed(): string {
  return randomUUID();
}

// ─── Start Ready Timer ──────────────────────

function startReadyTimer(io: Server, roomId: string): void {
  const room = getRoom(roomId);
  if (!room) return;

  room.readyTimer = setTimeout(() => {
    const r = getRoom(roomId);
    if (!r || r.phase !== 'ready-check') return;

    io.to(roomId).emit('match_dequeued', {
      reason: 'Not all players readied up in time.',
    });

    // Destroy room
    const { destroyRoom } = require('./roomHandler');
    destroyRoom(roomId);
  }, 10_000);
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

      // Extract difficulty from the match metadata
      const difficulty = match.difficulty ?? 'medium';

      // Create DB match record for escrow tracking
      let matchId = `match_${randomUUID().slice(0, 12)}`;
      try {
        const { createMatchRecord } = await import('../src/lib/progression.server');
        matchId = await createMatchRecord(modeId, difficulty, playerA.userId, playerB.userId);
      } catch (err) {
        console.error('[match] Failed to create DB match record:', err);
      }

      // Create the room with difficulty + matchId (starts in ready-check phase)
      createRoom(roomId, modeId, difficulty, puzzleSeed, matchId, playerA, playerB);

      // Join both sockets to the room
      const socketA = io.sockets.sockets.get(playerA.socketId);
      const socketB = io.sockets.sockets.get(playerB.socketId);

      if (!socketA || !socketB) {
        // One player disconnected before match — re-queue the other
        if (socketA) {
          await joinQueue(playerA.userId, modeId, playerA.socketId, difficulty);
          socketA.emit('match_cancelled', { reason: 'Opponent disconnected.' });
        }
        if (socketB) {
          await joinQueue(playerB.userId, modeId, playerB.socketId, difficulty);
          socketB.emit('match_cancelled', { reason: 'Opponent disconnected.' });
        }
        return;
      }

      await socketA.join(roomId);
      await socketB.join(roomId);

      // Create escrow (deduct entry fee from both players)
      let escrowOk = false;
      try {
        const { createPvPEscrow } = await import('../src/lib/progression.server');
        const escrowResult = await createPvPEscrow(matchId, playerA.userId, playerB.userId, difficulty);
        escrowOk = escrowResult.success;

        if (!escrowOk) {
          // Insufficient funds — cancel match, refund queue
          io.to(roomId).emit('match_cancelled', {
            reason: escrowResult.error ?? 'Insufficient coins for entry fee.',
          });
          await joinQueue(playerA.userId, modeId, playerA.socketId, difficulty);
          await joinQueue(playerB.userId, modeId, playerB.socketId, difficulty);
          return;
        }

        markEscrowCreated(roomId);
      } catch (err) {
        console.error('[match] Escrow creation failed:', err);
      }

      // ── NEW FLOW: Emit match_found (NOT match_started) ──
      // Players must ready up within 10 seconds
      io.to(roomId).emit('match_found', {
        roomId,
        modeId,
        difficulty,
        matchId,
        escrowActive: escrowOk,
        players: [
          { userId: playerA.userId, socketId: playerA.socketId },
          { userId: playerB.userId, socketId: playerB.socketId },
        ],
      });

      // Start 10-second ready timer
      startReadyTimer(io, roomId);

      console.log(
        `[match] ${playerA.userId} vs ${playerB.userId} → ${roomId} (${modeId}/${difficulty}) escrow=${escrowOk} — waiting for ready`,
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
      async (data: { userId: string; modeId: string; difficulty?: string }) => {
        const { userId, modeId, difficulty = 'medium' } = data;

        if (!userId || !modeId) {
          socket.emit('error', { message: 'userId and modeId are required.' });
          return;
        }

        // Check balance + fetch trophies before queueing
        let trophies = 0;
        try {
          const { canAffordEntry, getUserBalance } = await import('../src/lib/progression.server');
          const canAfford = await canAffordEntry(userId, difficulty);
          if (!canAfford) {
            socket.emit('queue_rejected', {
              reason: 'Insufficient coins for entry fee.',
            });
            return;
          }
          const balance = await getUserBalance(userId);
          trophies = balance.trophies;
        } catch {
          // DB not available — allow queue (dev mode)
        }

        // Join the queue with trophy data
        await joinQueue(userId, modeId, socket.id, difficulty, trophies);

        // Acknowledge
        socket.emit('queue_joined', { modeId, difficulty });

        // Ensure the poller is running for this mode
        ensurePoller(io, modeId);

        console.log(`[queue] ${userId} → ${modeId}/${difficulty} (${trophies} trophies)`);
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
      // Room disconnect is handled in roomHandler.ts
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
