// ──────────────────────────────────────────────
// NINE — Race Mode Socket Hook
// ──────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

// ─── Types ──────────────────────────────────

export type MatchState = 'idle' | 'searching' | 'playing' | 'finished';
export type MatchResult = 'won' | 'lost' | null;

export interface GhostCell {
  row: number;
  col: number;
}

export interface MatchInfo {
  roomId: string;
  modeId: string;
  puzzleSeed: string;
  opponentId: string;
}

export interface RaceModeUser {
  id: string;
  username: string;
}

interface MatchStartedPayload {
  roomId: string;
  modeId: string;
  puzzleSeed: string;
  players: { userId: string; socketId: string }[];
}

interface GhostUpdatePayload {
  row: number;
  col: number;
  opponentCellsFilled: number;
}

interface GhostFlashPayload {
  boxIndex: number;
  opponentBoxesCompleted: number;
}

interface MatchOverPayload {
  winnerId: string;
  winnerSocketId: string;
  forfeit?: boolean;
  timeMs?: number;
  score?: number;
}

// ─── Constants ──────────────────────────────

const WS_URL = (() => {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string> };
    return meta.env?.VITE_WS_URL ?? 'http://localhost:3001';
  } catch {
    return 'http://localhost:3001';
  }
})();

// ─── Guest ID Generator ─────────────────────

function generateGuestId(): string {
  return `guest_${crypto.randomUUID()}`;
}

// ─── Hook ───────────────────────────────────

export function useRaceMode(user?: RaceModeUser | null) {
  const socketRef = useRef<Socket | null>(null);
  const guestIdRef = useRef<string | null>(null);

  /**
   * Resolve the userId to send in socket events.
   * If user is authenticated, use their real ID.
   * If guest, generate a stable guest UUID for the session.
   */
  const resolveUserId = useCallback((): string => {
    if (user?.id) return user.id;

    if (!guestIdRef.current) {
      guestIdRef.current = generateGuestId();
      console.log('[nine-ws] Generated guest ID:', guestIdRef.current);
    }
    return guestIdRef.current;
  }, [user]);

  // ── State ──
  const [matchState, setMatchState] = useState<MatchState>('idle');
  const [matchResult, setMatchResult] = useState<MatchResult>(null);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [opponentProgress, setOpponentProgress] = useState<GhostCell[]>([]);
  const [opponentCellCount, setOpponentCellCount] = useState(0);
  const [opponentBoxCompletions, setOpponentBoxCompletions] = useState<number[]>([]);
  const [latestBoxFlash, setLatestBoxFlash] = useState<number | null>(null);

  // ── Connect on mount ──
  useEffect(() => {
    console.log('[nine-ws] Connecting to:', WS_URL);

    const socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // ── connect ──
    socket.on('connect', () => {
      console.log('[nine-ws] ✓ Connected. Socket ID:', socket.id);
    });

    // ── connect_error ──
    socket.on('connect_error', (err) => {
      console.error('[nine-ws] ✗ Connection error:', err.message);
    });

    // ── disconnect ──
    socket.on('disconnect', (reason) => {
      console.log('[nine-ws] Disconnected. Reason:', reason);
    });

    // ── match_started ──
    socket.on('match_started', (data: MatchStartedPayload) => {
      console.log('[nine-ws] 🎮 Match started!', {
        roomId: data.roomId,
        modeId: data.modeId,
        players: data.players.map((p) => p.userId),
      });

      const opponent = data.players.find((p) => p.socketId !== socket.id);

      setMatchInfo({
        roomId: data.roomId,
        modeId: data.modeId,
        puzzleSeed: data.puzzleSeed,
        opponentId: opponent?.userId ?? 'unknown',
      });
      setMatchState('playing');
      setMatchResult(null);
      setOpponentProgress([]);
      setOpponentCellCount(0);
      setOpponentBoxCompletions([]);
      setLatestBoxFlash(null);
    });

    // ── ghost_update ──
    socket.on('ghost_update', (data: GhostUpdatePayload) => {
      setOpponentProgress((prev) => [...prev, { row: data.row, col: data.col }]);
      setOpponentCellCount(data.opponentCellsFilled);
    });

    // ── ghost_flash ──
    socket.on('ghost_flash', (data: GhostFlashPayload) => {
      console.log('[nine-ws] ⚡ Opponent completed box:', data.boxIndex);
      setOpponentBoxCompletions((prev) => [...prev, data.boxIndex]);
      setLatestBoxFlash(data.boxIndex);
      setTimeout(() => setLatestBoxFlash(null), 600);
    });

    // ── match_over ──
    socket.on('match_over', (data: MatchOverPayload) => {
      const didWin = data.winnerSocketId === socket.id;
      console.log('[nine-ws] 🏁 Match over!', didWin ? 'YOU WON' : 'YOU LOST', data);
      setMatchResult(didWin ? 'won' : 'lost');
      setMatchState('finished');
    });

    // ── match_cancelled ──
    socket.on('match_cancelled', () => {
      console.log('[nine-ws] Match cancelled');
      setMatchState('idle');
    });

    // ── queue_joined ──
    socket.on('queue_joined', () => {
      console.log('[nine-ws] ✓ In queue. Searching for opponent...');
      setMatchState('searching');
    });

    return () => {
      console.log('[nine-ws] Cleaning up socket.');
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ── Actions ──

  const findMatch = useCallback(
    (modeId: string) => {
      if (!socketRef.current) return;

      const finalUserId = resolveUserId();

      console.log('[nine-ws] Finding match...', { userId: finalUserId, modeId });

      setMatchState('searching');
      setMatchResult(null);
      setOpponentProgress([]);
      setOpponentBoxCompletions([]);
      socketRef.current.emit('find_match', { userId: finalUserId, modeId });
    },
    [resolveUserId],
  );

  const cancelMatch = useCallback(() => {
    if (!socketRef.current) return;
    const finalUserId = resolveUserId();
    socketRef.current.emit('cancel_match', { userId: finalUserId });
    setMatchState('idle');
  }, [resolveUserId]);

  const sendCellFill = useCallback(
    (row: number, col: number) => {
      if (!socketRef.current || !matchInfo) return;
      socketRef.current.emit('cell_fill', {
        roomId: matchInfo.roomId,
        row,
        col,
      });
    },
    [matchInfo],
  );

  const sendBoxComplete = useCallback(
    (boxIndex: number) => {
      if (!socketRef.current || !matchInfo) return;
      socketRef.current.emit('box_complete', {
        roomId: matchInfo.roomId,
        boxIndex,
      });
    },
    [matchInfo],
  );

  const sendGameWon = useCallback(
    (timeMs: number, score: number) => {
      if (!socketRef.current || !matchInfo) return;
      socketRef.current.emit('game_won', {
        roomId: matchInfo.roomId,
        timeMs,
        score,
      });
    },
    [matchInfo],
  );

  const resetRace = useCallback(() => {
    setMatchState('idle');
    setMatchResult(null);
    setMatchInfo(null);
    setOpponentProgress([]);
    setOpponentCellCount(0);
    setOpponentBoxCompletions([]);
    setLatestBoxFlash(null);
  }, []);

  return {
    matchState,
    matchResult,
    matchInfo,
    opponentProgress,
    opponentCellCount,
    opponentBoxCompletions,
    latestBoxFlash,
    findMatch,
    cancelMatch,
    sendCellFill,
    sendBoxComplete,
    sendGameWon,
    resetRace,
  };
}
