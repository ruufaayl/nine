// ──────────────────────────────────────────────
// NINE — Race Mode Socket Hook
// Full PvP lifecycle: search → found → ready → countdown → play → result → rechallenge
// ──────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

// ─── Types ──────────────────────────────────

export type MatchState =
  | 'idle'
  | 'searching'
  | 'found'
  | 'ready-wait'
  | 'countdown'
  | 'playing'
  | 'finished';

export type MatchResult = 'won' | 'lost' | null;

export type RechallengeState = 'none' | 'sent' | 'received' | 'accepted' | 'declined' | 'timeout';

export interface GhostCell {
  row: number;
  col: number;
}

export interface MatchInfo {
  roomId: string;
  modeId: string;
  puzzleSeed: string;
  difficulty: string;
  opponentId: string;
}

export interface ReadyState {
  me: boolean;
  opponent: boolean;
}

export interface MatchEconomy {
  winnerCoinsEarned: number;
  loserCoinsLost: number;
  trophyDeltaWin: number;
  trophyDeltaLoss: number;
  xpWinner: number;
  xpLoser: number;
}

export interface MatchStats {
  winner: {
    userId: string;
    score: number;
    mistakes: number;
    cellsFilled: number;
    timeMs: number;
  };
  loser: {
    userId: string;
    score: number;
    mistakes: number;
    cellsFilled: number;
    timeMs: number;
  };
}

export interface RaceModeUser {
  id: string;
  username: string;
}

// ─── Server Payloads ────────────────────────

interface MatchFoundPayload {
  roomId: string;
  modeId: string;
  difficulty: string;
  matchId: string;
  escrowActive: boolean;
  players: { userId: string; socketId: string }[];
}

interface MatchStartedPayload {
  roomId: string;
  modeId: string;
  puzzleSeed: string;
  difficulty: string;
  players: { userId: string; socketId: string }[];
}

interface ReadyStatePayload {
  players: { socketId: string; userId: string; ready: boolean }[];
}

interface CountdownStartPayload {
  seconds: number;
}

interface MatchOverPayload {
  winnerId: string;
  winnerSocketId: string;
  reason: string;
  stats: MatchStats;
  economy: MatchEconomy | null;
  difficulty: string;
  modeId: string;
  roomId: string;
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

interface RechallengeOfferPayload {
  fromUserId: string;
  roomId: string;
  difficulty: string;
  modeId: string;
}

// ─── Constants ──────────────────────────────

const WS_URL: string =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.PROD
    ? 'https://nine.zaiyra.me'
    : 'http://68.183.186.126:3001');

// ─── Guest ID Generator ─────────────────────

function generateGuestId(): string {
  return `guest_${crypto.randomUUID()}`;
}

// ─── Hook ───────────────────────────────────

export function useRaceMode(user?: RaceModeUser | null) {
  const socketRef = useRef<Socket | null>(null);
  const guestIdRef = useRef<string | null>(null);

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
  const [readyState, setReadyState] = useState<ReadyState>({ me: false, opponent: false });
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [matchEconomy, setMatchEconomy] = useState<MatchEconomy | null>(null);
  const [matchOverStats, setMatchOverStats] = useState<MatchStats | null>(null);
  const [matchOverReason, setMatchOverReason] = useState<string>('');

  const [opponentProgress, setOpponentProgress] = useState<GhostCell[]>([]);
  const [opponentCellCount, setOpponentCellCount] = useState(0);
  const [opponentBoxCompletions, setOpponentBoxCompletions] = useState<number[]>([]);
  const [latestBoxFlash, setLatestBoxFlash] = useState<number | null>(null);

  // Rechallenge
  const [rechallengeState, setRechallengeState] = useState<RechallengeState>('none');
  const [rechallengeFrom, setRechallengeFrom] = useState<string | null>(null);

  // Countdown interval
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    socket.on('connect_error', (err) => {
      console.error('[nine-ws] ✗ Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[nine-ws] Disconnected. Reason:', reason);
    });

    // ── match_found (NEW — replaces instant match_started) ──
    socket.on('match_found', (data: MatchFoundPayload) => {
      console.log('[nine-ws] 🔍 Match found!', data);

      const opponent = data.players.find((p) => p.socketId !== socket.id);

      setMatchInfo({
        roomId: data.roomId,
        modeId: data.modeId,
        puzzleSeed: '', // Will be set on match_started
        difficulty: data.difficulty,
        opponentId: opponent?.userId ?? 'unknown',
      });
      setReadyState({ me: false, opponent: false });
      setMatchState('found');

      // Auto-transition to ready-wait after 1.5s
      setTimeout(() => {
        setMatchState((prev) => (prev === 'found' ? 'ready-wait' : prev));
      }, 1500);
    });

    // ── ready_state ──
    socket.on('ready_state', (data: ReadyStatePayload) => {
      const me = data.players.find((p) => p.socketId === socket.id);
      const opp = data.players.find((p) => p.socketId !== socket.id);
      setReadyState({
        me: me?.ready ?? false,
        opponent: opp?.ready ?? false,
      });
    });

    // ── countdown_start ──
    socket.on('countdown_start', (data: CountdownStartPayload) => {
      console.log('[nine-ws] ⏱️ Countdown starting:', data.seconds);
      setMatchState('countdown');
      setCountdownValue(data.seconds);

      // Count down locally
      let remaining = data.seconds;
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      countdownIntervalRef.current = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setCountdownValue(0);
        } else {
          setCountdownValue(remaining);
        }
      }, 1000);
    });

    // ── match_started ──
    socket.on('match_started', (data: MatchStartedPayload) => {
      console.log('[nine-ws] 🎮 Match started!', data);

      const opponent = data.players.find((p) => p.socketId !== socket.id);

      setMatchInfo((prev) => ({
        roomId: data.roomId,
        modeId: data.modeId,
        puzzleSeed: data.puzzleSeed,
        difficulty: prev?.difficulty ?? data.difficulty ?? 'medium',
        opponentId: opponent?.userId ?? prev?.opponentId ?? 'unknown',
      }));
      setMatchState('playing');
      setMatchResult(null);
      setCountdownValue(null);
      setOpponentProgress([]);
      setOpponentCellCount(0);
      setOpponentBoxCompletions([]);
      setLatestBoxFlash(null);
      setRechallengeState('none');
    });

    // ── ghost_update / opponent_cell_lock ──
    socket.on('ghost_update', (data: GhostUpdatePayload) => {
      setOpponentProgress((prev) => [...prev, { row: data.row, col: data.col }]);
      setOpponentCellCount(data.opponentCellsFilled);
    });

    socket.on('opponent_cell_lock', (data: any) => {
      // Forward to the PvP hook via a custom event
      setOpponentCellCount(data.opponentCellsFilled ?? 0);
    });

    // ── ghost_flash ──
    socket.on('ghost_flash', (data: GhostFlashPayload) => {
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
      setMatchEconomy(data.economy ?? null);
      setMatchOverStats(data.stats ?? null);
      setMatchOverReason(data.reason ?? '');
      setRechallengeState('none');
    });

    // ── match_cancelled ──
    socket.on('match_cancelled', () => {
      console.log('[nine-ws] Match cancelled');
      setMatchState('idle');
    });

    // ── match_dequeued ──
    socket.on('match_dequeued', (data: { reason: string }) => {
      console.log('[nine-ws] Dequeued:', data.reason);
      setMatchState('idle');
      setMatchInfo(null);
      setReadyState({ me: false, opponent: false });
      setCountdownValue(null);
    });

    // ── queue_joined ──
    socket.on('queue_joined', () => {
      console.log('[nine-ws] ✓ In queue.');
      setMatchState('searching');
    });

    // ── Rechallenge events ──
    socket.on('rechallenge_sent', () => {
      setRechallengeState('sent');
    });

    socket.on('rechallenge_offer', (data: RechallengeOfferPayload) => {
      setRechallengeState('received');
      setRechallengeFrom(data.fromUserId);
    });

    socket.on('rechallenge_declined', () => {
      setRechallengeState('declined');
    });

    socket.on('rechallenge_timeout', () => {
      setRechallengeState('timeout');
    });

    return () => {
      console.log('[nine-ws] Cleaning up socket.');
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ── Actions ──

  const findMatch = useCallback(
    (modeId: string, difficulty: string = 'medium') => {
      if (!socketRef.current) return;

      const finalUserId = resolveUserId();
      console.log('[nine-ws] Finding match...', { userId: finalUserId, modeId, difficulty });

      setMatchState('searching');
      setMatchResult(null);
      setMatchEconomy(null);
      setMatchOverStats(null);
      setOpponentProgress([]);
      setOpponentBoxCompletions([]);
      setRechallengeState('none');
      socketRef.current.emit('find_match', { userId: finalUserId, modeId, difficulty });
    },
    [resolveUserId],
  );

  const cancelMatch = useCallback(() => {
    if (!socketRef.current) return;
    const finalUserId = resolveUserId();
    socketRef.current.emit('cancel_match', { userId: finalUserId });
    setMatchState('idle');
  }, [resolveUserId]);

  const sendReady = useCallback(() => {
    if (!socketRef.current || !matchInfo) return;
    socketRef.current.emit('player_ready', { roomId: matchInfo.roomId });
    setReadyState((prev) => ({ ...prev, me: true }));
  }, [matchInfo]);

  const sendCellFill = useCallback(
    (row: number, col: number, value?: number, points?: number, isCorrect?: boolean) => {
      if (!socketRef.current || !matchInfo) return;
      socketRef.current.emit('cell_fill', {
        roomId: matchInfo.roomId,
        row,
        col,
        value: value ?? 0,
        points: points ?? 10,
        isCorrect: isCorrect ?? true,
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

  const sendGameOver = useCallback(
    (mistakes: number, score: number) => {
      if (!socketRef.current || !matchInfo) return;
      socketRef.current.emit('game_over', {
        roomId: matchInfo.roomId,
        mistakes,
        score,
      });
    },
    [matchInfo],
  );

  const sendRechallenge = useCallback(() => {
    if (!socketRef.current || !matchInfo) return;
    socketRef.current.emit('rechallenge_request', { roomId: matchInfo.roomId });
  }, [matchInfo]);

  const acceptRechallenge = useCallback(() => {
    if (!socketRef.current || !matchInfo) return;
    socketRef.current.emit('rechallenge_accept', { roomId: matchInfo.roomId });
    setRechallengeState('accepted');
  }, [matchInfo]);

  const declineRechallenge = useCallback(() => {
    if (!socketRef.current || !matchInfo) return;
    socketRef.current.emit('rechallenge_decline', { roomId: matchInfo.roomId });
    setRechallengeState('declined');
  }, [matchInfo]);

  const resetRace = useCallback(() => {
    setMatchState('idle');
    setMatchResult(null);
    setMatchInfo(null);
    setReadyState({ me: false, opponent: false });
    setCountdownValue(null);
    setMatchEconomy(null);
    setMatchOverStats(null);
    setOpponentProgress([]);
    setOpponentCellCount(0);
    setOpponentBoxCompletions([]);
    setLatestBoxFlash(null);
    setRechallengeState('none');
  }, []);

  return {
    // State
    matchState,
    matchResult,
    matchInfo,
    readyState,
    countdownValue,
    matchEconomy,
    matchOverStats,
    matchOverReason,
    opponentProgress,
    opponentCellCount,
    opponentBoxCompletions,
    latestBoxFlash,
    rechallengeState,
    rechallengeFrom,

    // Actions
    findMatch,
    cancelMatch,
    sendReady,
    sendCellFill,
    sendBoxComplete,
    sendGameWon,
    sendGameOver,
    sendRechallenge,
    acceptRechallenge,
    declineRechallenge,
    resetRace,
  };
}
