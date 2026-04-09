// ──────────────────────────────────────────────
// NINE — Game Room Handler (1v1 Race)
// Server-authoritative: escrow, scoring, forfeit
// Ready-up, countdown, rechallenge support
// ──────────────────────────────────────────────

import type { Server, Socket } from 'socket.io';

// ─── Types ──────────────────────────────────

export type RoomPhase = 'ready-check' | 'countdown' | 'playing' | 'finished';

export interface RoomPlayer {
  userId: string;
  socketId: string;
  cellsFilled: number;
  boxesCompleted: number;
  score: number;
  mistakes: number;
  ready: boolean;
}

export interface GameRoom {
  roomId: string;
  modeId: string;
  difficulty: string;
  puzzleSeed: string;
  players: Map<string, RoomPlayer>; // socketId → player
  createdAt: number;
  winnerId: string | null;
  matchId: string;          // DB match ID for escrow
  escrowCreated: boolean;   // whether escrow was successfully created
  startedAt: number;        // match start timestamp
  phase: RoomPhase;
  readyTimer: ReturnType<typeof setTimeout> | null;
  countdownTimer: ReturnType<typeof setTimeout> | null;
}

// ─── Rechallenge tracking ───────────────────

interface RechallengeEntry {
  fromSocketId: string;
  toSocketId: string;
  roomId: string;
  modeId: string;
  difficulty: string;
  timer: ReturnType<typeof setTimeout>;
}

const pendingRechallenges = new Map<string, RechallengeEntry>(); // roomId → entry

// ─── Active Rooms ───────────────────────────

const activeRooms = new Map<string, GameRoom>();

// ─── Room Management ────────────────────────

export function createRoom(
  roomId: string,
  modeId: string,
  difficulty: string,
  puzzleSeed: string,
  matchId: string,
  playerA: { userId: string; socketId: string },
  playerB: { userId: string; socketId: string },
): GameRoom {
  const room: GameRoom = {
    roomId,
    modeId,
    difficulty,
    puzzleSeed,
    players: new Map([
      [playerA.socketId, { ...playerA, cellsFilled: 0, boxesCompleted: 0, score: 0, mistakes: 0, ready: false }],
      [playerB.socketId, { ...playerB, cellsFilled: 0, boxesCompleted: 0, score: 0, mistakes: 0, ready: false }],
    ]),
    createdAt: Date.now(),
    winnerId: null,
    matchId,
    escrowCreated: false,
    startedAt: Date.now(),
    phase: 'ready-check',
    readyTimer: null,
    countdownTimer: null,
  };

  activeRooms.set(roomId, room);
  return room;
}

export function getRoom(roomId: string): GameRoom | undefined {
  return activeRooms.get(roomId);
}

export function getRoomBySocket(socketId: string): GameRoom | undefined {
  for (const room of activeRooms.values()) {
    if (room.players.has(socketId)) return room;
  }
  return undefined;
}

export function destroyRoom(roomId: string): void {
  const room = activeRooms.get(roomId);
  if (room) {
    if (room.readyTimer) clearTimeout(room.readyTimer);
    if (room.countdownTimer) clearTimeout(room.countdownTimer);
  }
  activeRooms.delete(roomId);
  pendingRechallenges.delete(roomId);
}

export function markEscrowCreated(roomId: string): void {
  const room = activeRooms.get(roomId);
  if (room) room.escrowCreated = true;
}

// ─── Ready-Up + Countdown Manager ───────────

function startReadyTimer(io: Server, roomId: string): void {
  const room = getRoom(roomId);
  if (!room) return;

  room.readyTimer = setTimeout(() => {
    const r = getRoom(roomId);
    if (!r || r.phase !== 'ready-check') return;

    // Time expired — dequeue both
    io.to(roomId).emit('match_dequeued', {
      reason: 'Not all players readied up in time.',
    });

    destroyRoom(roomId);
  }, 10_000); // 10 seconds
}

function checkAllReady(io: Server, roomId: string): void {
  const room = getRoom(roomId);
  if (!room || room.phase !== 'ready-check') return;

  const players = Array.from(room.players.values());
  const allReady = players.every((p) => p.ready);

  // Broadcast ready state to both
  io.to(roomId).emit('ready_state', {
    players: players.map((p) => ({
      socketId: p.socketId,
      userId: p.userId,
      ready: p.ready,
    })),
  });

  if (!allReady) return;

  // All ready — clear ready timer, start countdown
  if (room.readyTimer) {
    clearTimeout(room.readyTimer);
    room.readyTimer = null;
  }

  room.phase = 'countdown';
  io.to(roomId).emit('countdown_start', { seconds: 3 });

  // After 3 seconds, start the match
  room.countdownTimer = setTimeout(() => {
    const r = getRoom(roomId);
    if (!r || r.phase !== 'countdown') return;

    r.phase = 'playing';
    r.startedAt = Date.now();

    io.to(roomId).emit('match_started', {
      roomId: r.roomId,
      modeId: r.modeId,
      difficulty: r.difficulty,
      puzzleSeed: r.puzzleSeed,
      matchId: r.matchId,
      escrowActive: r.escrowCreated,
      players: Array.from(r.players.values()).map((p) => ({
        userId: p.userId,
        socketId: p.socketId,
      })),
    });

    console.log(`[room] Match started: ${roomId}`);
  }, 3_000);
}

// ─── Build match_over payload ───────────────

function buildMatchOverPayload(
  room: GameRoom,
  winnerId: string,
  winnerSocketId: string,
  reason: string,
  settleResult: any,
) {
  const players = Array.from(room.players.values());
  const winner = players.find((p) => p.userId === winnerId);
  const loser = players.find((p) => p.userId !== winnerId);
  const elapsedMs = Date.now() - room.startedAt;

  return {
    winnerId,
    winnerSocketId,
    reason,
    stats: {
      winner: {
        userId: winner?.userId ?? winnerId,
        score: winner?.score ?? 0,
        mistakes: winner?.mistakes ?? 0,
        cellsFilled: winner?.cellsFilled ?? 0,
        timeMs: elapsedMs,
      },
      loser: {
        userId: loser?.userId ?? 'unknown',
        score: loser?.score ?? 0,
        mistakes: loser?.mistakes ?? 0,
        cellsFilled: loser?.cellsFilled ?? 0,
        timeMs: elapsedMs,
      },
    },
    economy: settleResult
      ? {
          winnerCoinsEarned: settleResult.winnerCoinsEarned ?? 0,
          loserCoinsLost: settleResult.loserCoinsLost ?? 0,
          trophyDeltaWin: settleResult.trophyDelta?.win ?? 0,
          trophyDeltaLoss: settleResult.trophyDelta?.loss ?? 0,
          xpWinner: settleResult.xpWinner ?? 80,
          xpLoser: settleResult.xpLoser ?? 20,
        }
      : {
          // Fallback mock economy when no DB
          winnerCoinsEarned: 200,
          loserCoinsLost: 0,
          trophyDeltaWin: 15,
          trophyDeltaLoss: 10,
          xpWinner: 80,
          xpLoser: 20,
        },
    difficulty: room.difficulty,
    modeId: room.modeId,
    roomId: room.roomId,
  };
}

// ─── Event Handlers ─────────────────────────

export function registerRoomEvents(io: Server, socket: Socket): void {
  // ── Player Ready ──────────────────────────
  socket.on('player_ready', (data: { roomId: string }) => {
    const room = getRoom(data.roomId);
    if (!room || room.phase !== 'ready-check') return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.ready = true;
    console.log(`[room] ${player.userId} ready in ${data.roomId}`);

    checkAllReady(io, data.roomId);
  });

  // ── Cell Fill ─────────────────────────────
  // Player fills a cell → broadcast ghost_update to opponent
  socket.on('cell_fill', (data: {
    roomId: string;
    row: number;
    col: number;
    value: number;
    points: number;
    isCorrect: boolean;
  }) => {
    const room = getRoom(data.roomId);
    if (!room || room.winnerId || room.phase !== 'playing') return;

    const player = room.players.get(socket.id);
    if (!player) return;

    if (data.isCorrect) {
      player.cellsFilled += 1;
      player.score += (data.points ?? 10);

      // Broadcast to opponent: lock this cell
      socket.to(data.roomId).emit('opponent_cell_lock', {
        row: data.row,
        col: data.col,
        value: data.value,
        points: data.points,
        opponentCellsFilled: player.cellsFilled,
        opponentScore: player.score,
      });
    } else {
      player.mistakes += 1;

      // Broadcast mistake to opponent
      socket.to(data.roomId).emit('opponent_mistake', {
        opponentMistakes: player.mistakes,
      });
    }
  });

  // ── Box Complete ──────────────────────────
  socket.on('box_complete', (data: { roomId: string; boxIndex: number }) => {
    const room = getRoom(data.roomId);
    if (!room || room.winnerId || room.phase !== 'playing') return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.boxesCompleted += 1;

    socket.to(data.roomId).emit('ghost_flash', {
      boxIndex: data.boxIndex,
      opponentBoxesCompleted: player.boxesCompleted,
    });
  });

  // ── Progress Update ───────────────────────
  socket.on('progress_update', (data: { roomId: string; fillPercent: number }) => {
    const room = getRoom(data.roomId);
    if (!room || room.winnerId || room.phase !== 'playing') return;

    socket.to(data.roomId).emit('opponent_progress', {
      fillPercent: data.fillPercent,
    });
  });

  // ── Game Won ──────────────────────────────
  socket.on('game_won', async (data: {
    roomId: string;
    timeMs: number;
    score: number;
    mistakes: number;
  }) => {
    const room = getRoom(data.roomId);
    if (!room || room.winnerId) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    room.winnerId = player.userId;
    room.phase = 'finished';

    // Find loser
    const loser = Array.from(room.players.values()).find(
      (p) => p.socketId !== socket.id,
    );

    // Calculate times
    const winnerTimeMs = data.timeMs || (Date.now() - room.startedAt);

    // Settle economy if escrow exists
    let settleResult = null;
    if (room.escrowCreated && loser) {
      try {
        const { settlePvPMatch } = await import('../lib/progression.server');
        settleResult = await settlePvPMatch(
          room.matchId,
          player.userId,
          loser.userId,
          room.difficulty,
          player.score,
          loser.score,
          player.mistakes,
          loser.mistakes,
          winnerTimeMs,
          Date.now() - room.startedAt,
          room.modeId,
          false,
        );
      } catch (err) {
        console.error('[room] Failed to settle PvP match:', err);
        try {
          const { refundEscrow } = await import('../lib/progression.server');
          await refundEscrow(room.matchId);
        } catch (refundErr) {
          console.error('[room] Refund also failed:', refundErr);
        }
      }
    }

    const payload = buildMatchOverPayload(
      room,
      player.userId,
      socket.id,
      'completion',
      settleResult,
    );

    io.to(data.roomId).emit('match_over', payload);

    // Don't destroy immediately — allow rechallenge
    setTimeout(() => destroyRoom(data.roomId), 60_000);
  });

  // ── Game Over (3 mistakes) ────────────────
  socket.on('game_over', async (data: {
    roomId: string;
    mistakes: number;
    score: number;
  }) => {
    const room = getRoom(data.roomId);
    if (!room || room.winnerId) return;

    const loserPlayer = room.players.get(socket.id);
    if (!loserPlayer) return;

    // The OTHER player wins
    const winner = Array.from(room.players.values()).find(
      (p) => p.socketId !== socket.id,
    );
    if (!winner) return;

    room.winnerId = winner.userId;
    room.phase = 'finished';

    // Settle
    let settleResult = null;
    if (room.escrowCreated) {
      try {
        const { settlePvPMatch } = await import('../lib/progression.server');
        const elapsedMs = Date.now() - room.startedAt;
        settleResult = await settlePvPMatch(
          room.matchId,
          winner.userId,
          loserPlayer.userId,
          room.difficulty,
          winner.score,
          loserPlayer.score,
          winner.mistakes,
          loserPlayer.mistakes,
          elapsedMs,
          elapsedMs,
          room.modeId,
          false,
        );
      } catch (err) {
        console.error('[room] Failed to settle on game_over:', err);
      }
    }

    const payload = buildMatchOverPayload(
      room,
      winner.userId,
      winner.socketId,
      'opponent_game_over',
      settleResult,
    );

    io.to(data.roomId).emit('match_over', payload);

    setTimeout(() => destroyRoom(data.roomId), 60_000);
  });

  // ── Rechallenge Request ───────────────────
  socket.on('rechallenge_request', (data: { roomId: string }) => {
    const room = getRoom(data.roomId);
    if (!room || room.phase !== 'finished') return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const opponent = Array.from(room.players.values()).find(
      (p) => p.socketId !== socket.id,
    );
    if (!opponent) return;

    // Check if already pending
    if (pendingRechallenges.has(data.roomId)) return;

    const timer = setTimeout(() => {
      // Timeout — auto decline
      pendingRechallenges.delete(data.roomId);
      io.to(data.roomId).emit('rechallenge_timeout');
    }, 5_000);

    pendingRechallenges.set(data.roomId, {
      fromSocketId: socket.id,
      toSocketId: opponent.socketId,
      roomId: data.roomId,
      modeId: room.modeId,
      difficulty: room.difficulty,
      timer,
    });

    // Notify opponent
    const opponentSocket = io.sockets.sockets.get(opponent.socketId);
    if (opponentSocket) {
      opponentSocket.emit('rechallenge_offer', {
        fromUserId: player.userId,
        roomId: data.roomId,
        difficulty: room.difficulty,
        modeId: room.modeId,
      });
    }

    // Confirm to requester
    socket.emit('rechallenge_sent');

    console.log(`[room] Rechallenge: ${player.userId} → ${opponent.userId}`);
  });

  // ── Rechallenge Accept ────────────────────
  socket.on('rechallenge_accept', async (data: { roomId: string }) => {
    const entry = pendingRechallenges.get(data.roomId);
    if (!entry) return;

    clearTimeout(entry.timer);
    pendingRechallenges.delete(data.roomId);

    // Destroy old room
    const oldRoom = getRoom(data.roomId);
    const players = oldRoom ? Array.from(oldRoom.players.values()) : [];
    destroyRoom(data.roomId);

    if (players.length < 2) return;

    const { randomUUID } = await import('node:crypto');
    const newRoomId = `room_${randomUUID().slice(0, 8)}`;
    const newPuzzleSeed = randomUUID();
    const newMatchId = `match_${randomUUID().slice(0, 12)}`;

    // Create new room
    createRoom(
      newRoomId,
      entry.modeId,
      entry.difficulty,
      newPuzzleSeed,
      newMatchId,
      { userId: players[0].userId, socketId: players[0].socketId },
      { userId: players[1].userId, socketId: players[1].socketId },
    );

    // Join sockets
    const socketA = io.sockets.sockets.get(players[0].socketId);
    const socketB = io.sockets.sockets.get(players[1].socketId);

    if (socketA) await socketA.join(newRoomId);
    if (socketB) await socketB.join(newRoomId);

    // Emit match_found → then auto-ready both (since rechallenge = already agreed)
    io.to(newRoomId).emit('match_found', {
      roomId: newRoomId,
      modeId: entry.modeId,
      difficulty: entry.difficulty,
      players: players.map((p) => ({ userId: p.userId, socketId: p.socketId })),
    });

    // Auto-ready both for rechallenge (skip ready-up phase)
    const newRoom = getRoom(newRoomId);
    if (newRoom) {
      for (const p of newRoom.players.values()) {
        p.ready = true;
      }
      // Short delay then start countdown
      setTimeout(() => {
        checkAllReady(io, newRoomId);
      }, 500);
    }

    console.log(`[room] Rechallenge accepted → ${newRoomId}`);
  });

  // ── Rechallenge Decline ───────────────────
  socket.on('rechallenge_decline', (data: { roomId: string }) => {
    const entry = pendingRechallenges.get(data.roomId);
    if (!entry) return;

    clearTimeout(entry.timer);
    pendingRechallenges.delete(data.roomId);

    io.to(data.roomId).emit('rechallenge_declined');
    console.log(`[room] Rechallenge declined in ${data.roomId}`);
  });

  // ── Player Disconnect Mid-Game ────────────
  socket.on('disconnect', async () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    // If in ready-check or countdown, just dequeue
    if (room.phase === 'ready-check' || room.phase === 'countdown') {
      const remaining = Array.from(room.players.values()).find(
        (p) => p.socketId !== socket.id,
      );
      if (remaining) {
        const remainingSocket = io.sockets.sockets.get(remaining.socketId);
        if (remainingSocket) {
          remainingSocket.emit('match_dequeued', {
            reason: 'Opponent disconnected.',
          });
        }
      }
      destroyRoom(room.roomId);
      return;
    }

    if (room.winnerId) return; // Already finished

    // The remaining player wins by forfeit
    const remainingPlayer = Array.from(room.players.values()).find(
      (p) => p.socketId !== socket.id,
    );
    const disconnectedPlayer = room.players.get(socket.id);

    if (remainingPlayer) {
      room.winnerId = remainingPlayer.userId;
      room.phase = 'finished';
      const elapsedMs = Date.now() - room.startedAt;

      // Settle escrow: forfeit = remaining player wins
      let settleResult = null;
      if (room.escrowCreated && disconnectedPlayer) {
        try {
          const { settlePvPMatch } = await import('../lib/progression.server');
          settleResult = await settlePvPMatch(
            room.matchId,
            remainingPlayer.userId,
            disconnectedPlayer.userId,
            room.difficulty,
            remainingPlayer.score,
            disconnectedPlayer.score,
            remainingPlayer.mistakes,
            disconnectedPlayer.mistakes,
            elapsedMs,
            elapsedMs,
            room.modeId,
            true,  // isForfeit
          );
        } catch (err) {
          console.error('[room] Failed to settle forfeit:', err);
          try {
            const { refundEscrow } = await import('../lib/progression.server');
            await refundEscrow(room.matchId);
          } catch {}
        }
      }

      const payload = buildMatchOverPayload(
        room,
        remainingPlayer.userId,
        remainingPlayer.socketId,
        'forfeit',
        settleResult,
      );

      io.to(room.roomId).emit('match_over', payload);
    }

    setTimeout(() => {
      destroyRoom(room.roomId);
    }, 60_000);
  });
}
