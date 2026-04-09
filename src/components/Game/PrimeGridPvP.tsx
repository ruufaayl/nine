// ──────────────────────────────────────────────
// NINE — Prime Grid PvP Screen
// Full lifecycle: search → found → ready → countdown → play → result → rechallenge
// ──────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SudokuGrid } from '../Board/SudokuGrid';
import { NumberPad } from '../Board/NumberPad';
import { usePrimeGridPvP } from '../../hooks/usePrimeGridPvP';
import { useRaceMode, type RaceModeUser, type RechallengeState } from '../../hooks/useRaceMode';
import { MAX_MISTAKES, ENTRY_FEES, TROPHY_DELTAS } from '../../lib/economy';
import type { Difficulty } from '../../types/game';

// ─── Types ───────────────────────────────────

interface PrimeGridPvPProps {
  difficulty: Difficulty;
  opponentName?: string;
  user?: RaceModeUser | null;
  onExit: () => void;
}

// ═══════════════════════════════════════════════
// SEARCHING SCREEN
// ═══════════════════════════════════════════════

function SearchingScreen({ onCancel }: { onCancel: () => void }) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-8 px-6"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Radar animation */}
      <div className="relative w-40 h-40">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              inset: `${i * 16}px`,
              border: '2px solid var(--accent-primary)',
              opacity: 0.15,
            }}
            animate={{ opacity: [0.1, 0.35, 0.1], scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
          />
        ))}
        <motion.div
          className="absolute top-1/2 left-1/2 w-1/2 h-px origin-left"
          style={{
            background: 'linear-gradient(90deg, var(--accent-primary), transparent)',
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5 rounded-full"
          style={{ background: 'var(--accent-primary)' }}
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, rgba(108,99,255,0.12) 60deg, transparent 120deg)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
        />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <motion.h2
          className="text-lg font-bold"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Searching for opponent{'.'.repeat(dots)}
        </motion.h2>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Matchmaking • Trophy-range matching
        </p>
      </div>

      <motion.button
        className="px-8 py-3 text-sm font-semibold cursor-pointer"
        style={{
          fontFamily: 'var(--font-primary)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)',
        }}
        whileHover={{ background: 'var(--bg-card-hover)', scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onCancel}
      >
        Cancel
      </motion.button>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MATCH FOUND SCREEN
// ═══════════════════════════════════════════════

function MatchFoundScreen({ opponentId }: { opponentId: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-6 px-6"
      style={{ background: 'var(--bg-primary)' }}
    >
      <motion.div
        className="flex items-center gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Player A */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black"
            style={{
              background: 'rgba(108, 99, 255, 0.12)',
              border: '2px solid var(--accent-primary)',
              color: 'var(--accent-primary)',
            }}
          >
            Y
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>You</span>
        </motion.div>

        {/* VS Flash */}
        <motion.span
          className="text-3xl font-black"
          style={{ color: 'var(--text-tertiary)' }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
        >
          VS
        </motion.span>

        {/* Player B */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black"
            style={{
              background: 'rgba(255, 107, 107, 0.12)',
              border: '2px solid var(--accent-error)',
              color: 'var(--accent-error)',
            }}
          >
            {opponentId.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--accent-error)' }}>
            {opponentId.slice(0, 8)}
          </span>
        </motion.div>
      </motion.div>

      <motion.h2
        className="text-xl font-extrabold tracking-tight"
        style={{ color: 'var(--accent-success)', fontFamily: 'var(--font-primary)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Match Found!
      </motion.h2>
    </div>
  );
}

// ═══════════════════════════════════════════════
// READY-UP SCREEN (10s timer)
// ═══════════════════════════════════════════════

function ReadyUpScreen({
  readyState,
  opponentId,
  onReady,
}: {
  readyState: { me: boolean; opponent: boolean };
  opponentId: string;
  onReady: () => void;
}) {
  const [timer, setTimer] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const timerPercent = (timer / 10) * 100;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-8 px-6"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Timer bar */}
      <div className="w-full max-w-sm">
        <div
          className="w-full h-2 overflow-hidden"
          style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-full)' }}
        >
          <motion.div
            className="h-full"
            style={{
              background: timer <= 3 ? 'var(--accent-error)' : 'var(--accent-primary)',
              borderRadius: 'var(--radius-full)',
            }}
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-center text-xs mt-2 tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
          {timer}s to ready up
        </p>
      </div>

      {/* Player cards */}
      <div className="flex items-center gap-6">
        {/* You */}
        <motion.div
          className="flex flex-col items-center gap-3 py-5 px-6"
          style={{
            background: readyState.me ? 'rgba(52, 199, 89, 0.08)' : 'var(--bg-card)',
            border: readyState.me ? '2px solid var(--accent-success)' : '2px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
          animate={readyState.me ? { scale: [1, 1.03, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black"
            style={{
              background: 'rgba(108, 99, 255, 0.12)',
              color: 'var(--accent-primary)',
            }}
          >
            Y
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>You</span>
          <span
            className="text-[0.6rem] font-bold uppercase tracking-wider"
            style={{ color: readyState.me ? 'var(--accent-success)' : 'var(--text-tertiary)' }}
          >
            {readyState.me ? '✓ Ready' : 'Waiting…'}
          </span>
        </motion.div>

        <span className="text-lg font-black" style={{ color: 'var(--text-tertiary)' }}>VS</span>

        {/* Opponent */}
        <motion.div
          className="flex flex-col items-center gap-3 py-5 px-6"
          style={{
            background: readyState.opponent ? 'rgba(52, 199, 89, 0.08)' : 'var(--bg-card)',
            border: readyState.opponent ? '2px solid var(--accent-success)' : '2px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
          animate={readyState.opponent ? { scale: [1, 1.03, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black"
            style={{
              background: 'rgba(255, 107, 107, 0.12)',
              color: 'var(--accent-error)',
            }}
          >
            {opponentId.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--accent-error)' }}>
            {opponentId.slice(0, 8)}
          </span>
          <span
            className="text-[0.6rem] font-bold uppercase tracking-wider"
            style={{ color: readyState.opponent ? 'var(--accent-success)' : 'var(--text-tertiary)' }}
          >
            {readyState.opponent ? '✓ Ready' : 'Waiting…'}
          </span>
        </motion.div>
      </div>

      {/* Ready Button */}
      {!readyState.me && (
        <motion.button
          className="px-12 py-4 text-lg font-extrabold uppercase tracking-[0.15em] cursor-pointer"
          style={{
            fontFamily: 'var(--font-primary)',
            background: 'var(--accent-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 0 30px rgba(108, 99, 255, 0.25)',
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(108, 99, 255, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onReady}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          READY
        </motion.button>
      )}

      {readyState.me && !readyState.opponent && (
        <motion.p
          className="text-sm font-semibold"
          style={{ color: 'var(--accent-success)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Waiting for opponent…
        </motion.p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// COUNTDOWN SCREEN (3-2-1-GO)
// ═══════════════════════════════════════════════

function CountdownScreen({ value }: { value: number | null }) {
  const display = value === 0 ? 'GO!' : value?.toString() ?? '';

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'var(--bg-primary)' }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={display}
          className="font-black select-none"
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: value === 0 ? '6rem' : '8rem',
            color: value === 0 ? 'var(--accent-success)' : 'var(--accent-primary)',
            textShadow: `0 0 60px ${value === 0 ? 'rgba(52,199,89,0.4)' : 'rgba(108,99,255,0.4)'}`,
          }}
          initial={{ scale: 2.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════
// GAME OVER POPUP (YOU WIN / YOU LOSE)
// ═══════════════════════════════════════════════

function GameOverPopup({ result, onDone }: { result: 'won' | 'lost'; onDone: () => void }) {
  const isWin = result === 'won';

  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: isWin
          ? 'rgba(52, 199, 89, 0.15)'
          : 'rgba(255, 59, 48, 0.15)',
        backdropFilter: 'blur(12px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 250, damping: 15 }}
      >
        <motion.span
          className="text-7xl"
          animate={isWin
            ? { rotate: [0, -15, 15, -8, 8, 0], scale: [1, 1.3, 1] }
            : { x: [-8, 8, -6, 6, -3, 3, 0] }
          }
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {isWin ? '🏆' : '💀'}
        </motion.span>

        <motion.h1
          className="font-black tracking-[0.1em] uppercase text-center"
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '3.5rem',
            color: isWin ? 'var(--accent-success)' : 'var(--accent-error)',
            textShadow: isWin
              ? '0 0 80px rgba(52,199,89,0.5)'
              : '0 0 80px rgba(255,59,48,0.5)',
          }}
          animate={isWin
            ? { scale: [1, 1.08, 1] }
            : { x: [-4, 4, -3, 3, -2, 2, 0] }
          }
          transition={isWin
            ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.5, delay: 0.3 }
          }
        >
          {isWin ? 'YOU WIN!' : 'YOU LOSE!'}
        </motion.h1>

        {/* Particle burst for winner */}
        {isWin && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i % 3 === 0 ? 'var(--accent-gold)' : i % 3 === 1 ? 'var(--accent-primary)' : 'var(--accent-success)',
                  left: '50%',
                  top: '50%',
                }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos((i * 30 * Math.PI) / 180) * 200,
                  y: Math.sin((i * 30 * Math.PI) / 180) * 200,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 1, delay: 0.2 + i * 0.05, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// RESULT SCREEN (full stats + rechallenge)
// ═══════════════════════════════════════════════

function ResultScreen({
  result,
  matchStats,
  matchEconomy,
  myMistakes,
  elapsedSec,
  difficulty,
  rechallengeState,
  onExit,
  onRechallenge,
  onAcceptRechallenge,
  onDeclineRechallenge,
}: {
  result: 'win' | 'loss' | 'draw';
  matchStats: any;
  matchEconomy: any;
  myMistakes: number;
  elapsedSec: number;
  difficulty: Difficulty;
  rechallengeState: RechallengeState;
  onExit: () => void;
  onRechallenge: () => void;
  onAcceptRechallenge: () => void;
  onDeclineRechallenge: () => void;
}) {
  const isWin = result === 'win';
  const eco = matchEconomy ?? { winnerCoinsEarned: 0, loserCoinsLost: 0, trophyDeltaWin: 0, trophyDeltaLoss: 0, xpWinner: 0, xpLoser: 0 };
  const stats = matchStats ?? { winner: { score: 0, mistakes: 0 }, loser: { score: 0, mistakes: 0 } };
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Rechallenge timer for received offers
  const [rcTimer, setRcTimer] = useState(5);
  useEffect(() => {
    if (rechallengeState !== 'received') return;
    setRcTimer(5);
    const interval = setInterval(() => {
      setRcTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onDeclineRechallenge();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rechallengeState, onDeclineRechallenge]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto"
      style={{ background: 'rgba(12, 12, 15, 0.95)', backdropFilter: 'blur(16px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex flex-col items-center gap-5 w-full max-w-sm px-6 py-8"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {/* Result Badge */}
        <motion.span className="text-5xl" animate={{ rotate: isWin ? [0, -10, 10, 0] : [0, -3, 3, 0] }} transition={{ delay: 0.3, duration: 0.5 }}>
          {isWin ? '🏆' : '💀'}
        </motion.span>

        <h2
          className="text-2xl font-extrabold tracking-tight"
          style={{
            color: isWin ? 'var(--accent-success)' : 'var(--accent-error)',
            fontFamily: 'var(--font-primary)',
          }}
        >
          {isWin ? 'Victory!' : 'Defeated'}
        </h2>

        {/* Stats Table */}
        <div
          className="w-full overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {/* Header */}
          <div className="grid grid-cols-3 px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[0.55rem] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>&nbsp;</span>
            <span className="text-[0.55rem] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--accent-primary)' }}>You</span>
            <span className="text-[0.55rem] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--accent-error)' }}>Opponent</span>
          </div>
          {/* Score */}
          <StatRow label="Score" myVal={isWin ? stats.winner?.score : stats.loser?.score} oppVal={isWin ? stats.loser?.score : stats.winner?.score} />
          {/* Mistakes */}
          <StatRow label="Mistakes" myVal={`${isWin ? stats.winner?.mistakes : stats.loser?.mistakes}/${MAX_MISTAKES}`} oppVal={`${isWin ? stats.loser?.mistakes : stats.winner?.mistakes}/${MAX_MISTAKES}`} />
          {/* Time */}
          <StatRow label="Time" myVal={timeStr} oppVal={timeStr} />
          {/* Trophies */}
          <StatRow
            label="🏆 Trophies"
            myVal={isWin ? `+${eco.trophyDeltaWin}` : `-${eco.trophyDeltaLoss}`}
            oppVal={isWin ? `-${eco.trophyDeltaLoss}` : `+${eco.trophyDeltaWin}`}
            myColor={isWin ? 'var(--accent-success)' : 'var(--accent-error)'}
            oppColor={isWin ? 'var(--accent-error)' : 'var(--accent-success)'}
          />
          {/* Coins */}
          <StatRow
            label="🪙 Coins"
            myVal={isWin ? `+${eco.winnerCoinsEarned}` : '—'}
            oppVal={isWin ? '—' : `+${eco.winnerCoinsEarned}`}
            myColor={isWin ? 'var(--accent-gold)' : 'rgba(255,255,255,0.3)'}
            oppColor={isWin ? 'rgba(255,255,255,0.3)' : 'var(--accent-gold)'}
          />
          {/* XP */}
          <StatRow
            label="⭐ XP"
            myVal={`+${isWin ? eco.xpWinner : eco.xpLoser}`}
            oppVal={`+${isWin ? eco.xpLoser : eco.xpWinner}`}
            myColor="var(--accent-secondary)"
            oppColor="var(--accent-secondary)"
          />
        </div>

        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} mode
        </p>

        {/* Rechallenge Offer Received */}
        <AnimatePresence>
          {rechallengeState === 'received' && (
            <motion.div
              className="w-full flex flex-col items-center gap-3 px-4 py-4"
              style={{
                background: 'rgba(108, 99, 255, 0.08)',
                border: '1px solid rgba(108, 99, 255, 0.2)',
                borderRadius: 'var(--radius-md)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>
                Opponent wants a rematch!
              </p>
              {/* Timer bar */}
              <div className="w-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)' }}>
                <motion.div
                  className="h-full"
                  style={{ background: 'var(--accent-primary)', borderRadius: 'var(--radius-full)' }}
                  animate={{ width: `${(rcTimer / 5) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>{rcTimer}s</p>
              <div className="flex gap-3 w-full">
                <motion.button
                  className="flex-1 py-3 text-sm font-bold cursor-pointer"
                  style={{
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                  }}
                  whileHover={{ opacity: 0.9 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onAcceptRechallenge}
                >
                  Accept
                </motion.button>
                <motion.button
                  className="flex-1 py-3 text-sm font-semibold cursor-pointer"
                  style={{
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--radius-md)',
                  }}
                  whileHover={{ borderColor: 'rgba(255,255,255,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onDeclineRechallenge}
                >
                  Decline
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTAs */}
        {rechallengeState !== 'received' && (
          <div className="flex gap-3 w-full">
            <motion.button
              className="flex-1 py-3.5 text-sm font-semibold cursor-pointer"
              style={{
                fontFamily: 'var(--font-primary)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-md)',
              }}
              whileHover={{ borderColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onExit}
            >
              Return to Lobby
            </motion.button>

            <motion.button
              className="flex-1 py-3.5 text-sm font-bold cursor-pointer"
              style={{
                fontFamily: 'var(--font-primary)',
                background: rechallengeState === 'sent' ? 'rgba(108, 99, 255, 0.15)' : 'var(--accent-primary)',
                color: rechallengeState === 'sent' ? 'var(--accent-primary)' : '#fff',
                border: rechallengeState === 'sent' ? '1px solid rgba(108, 99, 255, 0.3)' : 'none',
                borderRadius: 'var(--radius-md)',
              }}
              whileHover={rechallengeState === 'none' ? { opacity: 0.9, scale: 1.02 } : {}}
              whileTap={rechallengeState === 'none' ? { scale: 0.97 } : {}}
              onClick={rechallengeState === 'none' ? onRechallenge : undefined}
              disabled={rechallengeState !== 'none'}
            >
              {rechallengeState === 'sent' ? (
                <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  Waiting for response…
                </motion.span>
              ) : rechallengeState === 'declined' || rechallengeState === 'timeout' ? (
                'Declined'
              ) : (
                'Rechallenge'
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatRow({
  label,
  myVal,
  oppVal,
  myColor,
  oppColor,
}: {
  label: string;
  myVal: string | number;
  oppVal: string | number;
  myColor?: string;
  oppColor?: string;
}) {
  return (
    <div className="grid grid-cols-3 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span className="text-sm font-bold text-center tabular-nums" style={{ color: myColor ?? 'rgba(255,255,255,0.8)' }}>{myVal}</span>
      <span className="text-sm font-bold text-center tabular-nums" style={{ color: oppColor ?? 'rgba(255,255,255,0.8)' }}>{oppVal}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SCORE BAR (during gameplay)
// ═══════════════════════════════════════════════

function ScoreBar({
  myScore, opponentScore, myMistakes, opponentMistakes, opponentProgress, opponentName,
}: {
  myScore: number; opponentScore: number; myMistakes: number; opponentMistakes: number;
  opponentProgress: number; opponentName: string;
}) {
  const total = myScore + opponentScore || 1;
  const myPercent = (myScore / total) * 100;

  return (
    <div className="w-full px-5 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-primary)' }}>You</span>
          <span className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--text-primary)' }}>{myScore}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: MAX_MISTAKES }, (_, i) => (
              <span key={i} className="text-[0.5rem]" style={{ opacity: i < myMistakes ? 0.3 : 1 }}>
                {i < myMistakes ? '💔' : '❤️'}
              </span>
            ))}
          </div>
        </div>
        <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>VS</span>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: MAX_MISTAKES }, (_, i) => (
              <span key={i} className="text-[0.5rem]" style={{ opacity: i < opponentMistakes ? 0.3 : 1 }}>
                {i < opponentMistakes ? '💔' : '❤️'}
              </span>
            ))}
          </div>
          <span className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--text-primary)' }}>{opponentScore}</span>
          <span className="text-xs font-bold" style={{ color: 'var(--accent-error)', fontFamily: 'var(--font-primary)' }}>{opponentName}</span>
        </div>
      </div>
      <div className="w-full h-2.5 flex overflow-hidden" style={{ borderRadius: 'var(--radius-full)', background: 'var(--bg-card)' }}>
        <motion.div className="h-full" style={{ background: 'var(--accent-primary)', borderRadius: 'var(--radius-full) 0 0 var(--radius-full)' }} animate={{ width: `${myPercent}%` }} transition={{ duration: 0.5 }} />
        <motion.div className="h-full" style={{ background: 'var(--accent-error)', borderRadius: '0 var(--radius-full) var(--radius-full) 0' }} animate={{ width: `${100 - myPercent}%` }} transition={{ duration: 0.5 }} />
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-1.5">
        <span className="text-[0.6rem]" style={{ color: 'var(--text-tertiary)' }}>Opponent: {Math.round(opponentProgress)}% solved</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// POINT POPUP
// ═══════════════════════════════════════════════

function PointPopup({ points }: { points: number }) {
  return (
    <motion.div
      className="absolute z-30 pointer-events-none"
      style={{ top: '-20px', left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-success)' }}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -24, scale: 0.7 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      +{points}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

export function PrimeGridPvP({
  difficulty,
  opponentName = 'Opponent',
  user,
  onExit,
}: PrimeGridPvPProps) {
  const pvp = usePrimeGridPvP(difficulty);
  const race = useRaceMode(user);

  const [showGameOverPopup, setShowGameOverPopup] = useState(false);
  const [showResultScreen, setShowResultScreen] = useState(false);
  const gameOverTriggered = useRef(false);

  // Init puzzle when match_started fires
  useEffect(() => {
    if (race.matchState === 'playing') {
      pvp.initPvP();
    }
  }, [race.matchState, pvp.initPvP]);

  // Wire opponent events from socket to PvP hook
  useEffect(() => {
    // opponent_cell_lock is handled via socket listeners
    // We could use a more direct wiring, but for now the hook handles its own state
  }, []);

  // Detect 3 mistakes → send game_over to server + show popup
  useEffect(() => {
    if (pvp.isGameOver && race.matchState === 'playing' && !gameOverTriggered.current) {
      gameOverTriggered.current = true;
      race.sendGameOver(pvp.mistakes, pvp.myScore);
    }
  }, [pvp.isGameOver, pvp.mistakes, pvp.myScore, race.matchState, race.sendGameOver]);

  // Detect win → send game_won to server
  useEffect(() => {
    if (pvp.isComplete && race.matchState === 'playing') {
      race.sendGameWon(pvp.elapsedMs, pvp.myScore);
    }
  }, [pvp.isComplete, pvp.elapsedMs, pvp.myScore, race.matchState, race.sendGameWon]);

  // When match is over → show game over popup, then result screen
  useEffect(() => {
    if (race.matchState === 'finished' && race.matchResult && !showGameOverPopup && !showResultScreen) {
      setShowGameOverPopup(true);
    }
  }, [race.matchState, race.matchResult, showGameOverPopup, showResultScreen]);

  const handleGameOverPopupDone = useCallback(() => {
    setShowGameOverPopup(false);
    setShowResultScreen(true);
  }, []);

  const handleExit = useCallback(() => {
    race.resetRace();
    gameOverTriggered.current = false;
    setShowGameOverPopup(false);
    setShowResultScreen(false);
    onExit();
  }, [race.resetRace, onExit]);

  const handleRechallenge = useCallback(() => {
    race.sendRechallenge();
  }, [race.sendRechallenge]);

  const handleAcceptRechallenge = useCallback(() => {
    race.acceptRechallenge();
    gameOverTriggered.current = false;
    setShowGameOverPopup(false);
    setShowResultScreen(false);
  }, [race.acceptRechallenge]);

  const handleDeclineRechallenge = useCallback(() => {
    race.declineRechallenge();
  }, [race.declineRechallenge]);

  const elapsedSec = Math.floor(pvp.elapsedMs / 1000);

  // ── PRE-GAME PHASES ──

  if (race.matchState === 'idle') {
    // Auto-start searching
    useEffect(() => {
      race.findMatch('prime-grid', difficulty);
    }, []);
    return <SearchingScreen onCancel={handleExit} />;
  }

  if (race.matchState === 'searching') {
    return <SearchingScreen onCancel={handleExit} />;
  }

  if (race.matchState === 'found') {
    return <MatchFoundScreen opponentId={race.matchInfo?.opponentId ?? '???'} />;
  }

  if (race.matchState === 'ready-wait') {
    return (
      <ReadyUpScreen
        readyState={race.readyState}
        opponentId={race.matchInfo?.opponentId ?? '???'}
        onReady={race.sendReady}
      />
    );
  }

  if (race.matchState === 'countdown') {
    return <CountdownScreen value={race.countdownValue} />;
  }

  // ── PLAYING + FINISHED ──

  if (!pvp.grid) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <motion.div
          className="text-sm font-medium"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Preparing match…
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <motion.header
        className="w-full flex items-center justify-between px-5 py-2.5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <motion.button
          className="text-sm font-medium cursor-pointer"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}
          whileHover={{ color: 'var(--text-secondary)' }}
          whileTap={{ scale: 0.94 }}
          onClick={handleExit}
        >
          ← Forfeit
        </motion.button>

        <div className="flex items-center gap-2">
          <div className="pill pill-accent">PvP</div>
          <div className="pill" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </div>
        </div>

        <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
          {String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:{String(elapsedSec % 60).padStart(2, '0')}
        </span>
      </motion.header>

      {/* Score Bar */}
      <ScoreBar
        myScore={pvp.myScore}
        opponentScore={pvp.opponentScore}
        myMistakes={pvp.mistakes}
        opponentMistakes={pvp.opponentMistakes}
        opponentProgress={pvp.opponentProgress}
        opponentName={opponentName}
      />

      {/* Board */}
      <motion.div
        className="flex flex-col items-center justify-center flex-1 gap-5 px-4 py-4 w-full"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="relative">
          <SudokuGrid
            grid={pvp.grid}
            selectedCell={pvp.selectedCell}
            errors={pvp.errors}
            isPencilMode={pvp.isPencilMode}
            lastCorrectCell={pvp.lastCorrectCell}
            lastErrorCell={pvp.lastErrorCell}
            lockedCells={pvp.lockedCells}
            onSelectCell={pvp.selectCell}
            onFillCell={pvp.fillCell}
            onErase={pvp.eraseCell}
            onTogglePencil={pvp.togglePencil}
          />

          <AnimatePresence>
            {pvp.scorePopup && (
              <div
                className="absolute pointer-events-none"
                style={{ top: `${(pvp.scorePopup.row / 9) * 100}%`, left: `${(pvp.scorePopup.col / 9) * 100}%` }}
              >
                <PointPopup points={pvp.scorePopup.points} />
              </div>
            )}
          </AnimatePresence>
        </div>

        <NumberPad
          grid={pvp.grid}
          isPencilMode={pvp.isPencilMode}
          onFillCell={pvp.fillCell}
          onErase={pvp.eraseCell}
          onTogglePencil={pvp.togglePencil}
        />

        {/* Digit values */}
        <div className="flex flex-wrap justify-center gap-1.5 max-w-md">
          {Object.entries(pvp.digitValues).map(([digit, pts]) => (
            <span
              key={digit}
              className="text-[0.55rem] tabular-nums px-2 py-0.5"
              style={{
                fontFamily: 'var(--font-primary)',
                color: 'var(--text-tertiary)',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {digit}={pts}pts
            </span>
          ))}
        </div>
      </motion.div>

      {/* Game Over Popup (animated YOU WIN / YOU LOSE) */}
      <AnimatePresence>
        {showGameOverPopup && race.matchResult && (
          <GameOverPopup result={race.matchResult} onDone={handleGameOverPopupDone} />
        )}
      </AnimatePresence>

      {/* Result Screen (full stats) */}
      <AnimatePresence>
        {showResultScreen && race.matchResult && (
          <ResultScreen
            result={race.matchResult === 'won' ? 'win' : 'loss'}
            matchStats={race.matchOverStats}
            matchEconomy={race.matchEconomy}
            myMistakes={pvp.mistakes}
            elapsedSec={elapsedSec}
            difficulty={difficulty}
            rechallengeState={race.rechallengeState}
            onExit={handleExit}
            onRechallenge={handleRechallenge}
            onAcceptRechallenge={handleAcceptRechallenge}
            onDeclineRechallenge={handleDeclineRechallenge}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
