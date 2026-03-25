// ──────────────────────────────────────────────
// NINE — Game Room Handler (1v1 Race)
// ──────────────────────────────────────────────

import type { Server, Socket } from 'socket.io';

// ─── Types ──────────────────────────────────

export interface RoomPlayer {
  userId: string;
  socketId: string;
  cellsFilled: number;
  boxesCompleted: number;
}

export interface GameRoom {
  roomId: string;
  modeId: string;
  puzzleSeed: string;
  players: Map<string, RoomPlayer>; // socketId → player
  createdAt: number;
  winnerId: string | null;
}

// ─── Active Rooms ───────────────────────────

const activeRooms = new Map<string, GameRoom>();

// ─── Room Management ────────────────────────

/**
 * Create a new game room for a matched pair.
 */
export function createRoom(
  roomId: string,
  modeId: string,
  puzzleSeed: string,
  playerA: { userId: string; socketId: string },
  playerB: { userId: string; socketId: string },
): GameRoom {
  const room: GameRoom = {
    roomId,
    modeId,
    puzzleSeed,
    players: new Map([
      [playerA.socketId, { ...playerA, cellsFilled: 0, boxesCompleted: 0 }],
      [playerB.socketId, { ...playerB, cellsFilled: 0, boxesCompleted: 0 }],
    ]),
    createdAt: Date.now(),
    winnerId: null,
  };

  activeRooms.set(roomId, room);
  return room;
}

/**
 * Get a room by ID.
 */
export function getRoom(roomId: string): GameRoom | undefined {
  return activeRooms.get(roomId);
}

/**
 * Find the room a socket belongs to.
 */
export function getRoomBySocket(socketId: string): GameRoom | undefined {
  for (const room of activeRooms.values()) {
    if (room.players.has(socketId)) return room;
  }
  return undefined;
}

/**
 * Destroy a room and clean up.
 */
export function destroyRoom(roomId: string): void {
  activeRooms.delete(roomId);
}

// ─── Event Handlers ─────────────────────────

/**
 * Register all in-game socket events for a player.
 */
export function registerRoomEvents(io: Server, socket: Socket): void {
  // ── Cell Fill ─────────────────────────────
  // Player fills a cell → broadcast ghost_update to opponent
  socket.on('cell_fill', (data: { roomId: string; row: number; col: number }) => {
    const room = getRoom(data.roomId);
    if (!room || room.winnerId) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.cellsFilled += 1;

    // Broadcast coordinates (NOT the value) to opponent
    socket.to(data.roomId).emit('ghost_update', {
      row: data.row,
      col: data.col,
      opponentCellsFilled: player.cellsFilled,
    });
  });

  // ── Box Complete ──────────────────────────
  // Player completes a 3x3 box → broadcast ghost_flash to opponent
  socket.on('box_complete', (data: { roomId: string; boxIndex: number }) => {
    const room = getRoom(data.roomId);
    if (!room || room.winnerId) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.boxesCompleted += 1;

    socket.to(data.roomId).emit('ghost_flash', {
      boxIndex: data.boxIndex,
      opponentBoxesCompleted: player.boxesCompleted,
    });
  });

  // ── Game Won ──────────────────────────────
  // Player completes the puzzle → broadcast match_over
  socket.on('game_won', (data: { roomId: string; timeMs: number; score: number }) => {
    const room = getRoom(data.roomId);
    if (!room || room.winnerId) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    room.winnerId = player.userId;

    io.to(data.roomId).emit('match_over', {
      winnerId: player.userId,
      winnerSocketId: socket.id,
      timeMs: data.timeMs,
      score: data.score,
      stats: {
        winnerCells: player.cellsFilled,
        winnerBoxes: player.boxesCompleted,
      },
    });

    // Clean up room after a delay (let clients process the result)
    setTimeout(() => {
      destroyRoom(data.roomId);
    }, 10_000);
  });

  // ── Player Disconnect Mid-Game ────────────
  socket.on('disconnect', () => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.winnerId) return;

    // The remaining player wins by forfeit
    const remainingPlayer = Array.from(room.players.values()).find(
      (p) => p.socketId !== socket.id,
    );

    if (remainingPlayer) {
      room.winnerId = remainingPlayer.userId;

      io.to(room.roomId).emit('match_over', {
        winnerId: remainingPlayer.userId,
        winnerSocketId: remainingPlayer.socketId,
        forfeit: true,
      });
    }

    setTimeout(() => {
      destroyRoom(room.roomId);
    }, 5_000);
  });
}
