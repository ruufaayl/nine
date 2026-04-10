// ──────────────────────────────────────────────
// S-12 — Room Lobby (Premium Pre-game)
//
// Mode-colored header, clean VS layout,
// animated ready states, countdown sequence.
// ──────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { getModeById } from '../../lib/gameModesData';

// ─── Mode colors ───────────────────────────

const MODE_COLORS: Record<string, string> = {
  'prime-grid': '#4338CA', 'glyph-grid': '#0F766E', 'shattered-grid': '#B91C1C',
  'canvas-fracture': '#9333EA', 'vault-breaker': '#DB2777', 'cipher-scramble': '#F59E0B',
  'lexicon-weave': '#1E40AF', 'enigma-weave': '#7C2D12', 'interrogation': '#EA580C',
  'alias-protocol': '#E11D48', 'global-override': '#047857', 'data-sift': '#FACC15',
  'cinema-lattice': '#0369A1', 'chronos-shift': '#78350F',
};

const COUNTDOWN_SECONDS = 5;

const MOCK_OPPONENT = {
  username: 'SPECTRAL_07',
  rank: 'Operative',
  wins: 42,
  initial: 'S',
};

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ─── Player Card ────────────────────────────

function PlayerCard({
  name, rank, wins, initial, isReady, isSelf, color, onToggle,
}: {
  name: string; rank: string; wins: number; initial: string;
  isReady: boolean; isSelf: boolean; color: string; onToggle?: () => void;
}) {
  return (
    <motion.div
      className="flex-1 max-w-[160px]"
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: isSelf ? 0.1 : 0.25, ease: EASE }}
    >
      <div
        className="relative flex flex-col items-center px-4 py-5"
        style={{
          background: 'var(--bg-card)',
          border: `2px solid ${isReady ? color : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-lg)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          boxShadow: isReady ? `0 0 20px ${color}15` : 'none',
        }}
      >
        {/* Avatar circle */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
          style={{
            background: isReady ? color : 'var(--bg-primary)',
            border: `2px solid ${isReady ? color : 'var(--border-default)'}`,
            transition: 'all 0.3s',
          }}
        >
          <motion.span
            className="text-xl font-black"
            style={{
              fontFamily: 'var(--font-display)',
              color: isReady ? '#fff' : 'var(--text-tertiary)',
            }}
            animate={isReady ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.4 }}
          >
            {initial}
          </motion.span>
        </div>

        {/* Name */}
        <h3
          className="text-[0.75rem] font-black uppercase tracking-[0.08em] mb-0.5 truncate max-w-full text-center"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          {name}
        </h3>

        {/* Rank · wins */}
        <p
          className="text-[0.55rem] uppercase tracking-[0.1em] mb-4"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          {rank} · {wins}W
        </p>

        {/* Ready button / status */}
        {isSelf ? (
          <motion.button
            className="w-full py-2 text-[0.6rem] font-bold uppercase tracking-[0.12em] cursor-pointer"
            style={{
              background: isReady ? color : 'transparent',
              color: isReady ? '#fff' : 'var(--text-tertiary)',
              border: isReady ? 'none' : '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-display)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggle}
          >
            {isReady ? '✓ Ready' : 'Ready Up'}
          </motion.button>
        ) : (
          <div
            className="w-full py-2 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-center"
            style={{
              background: isReady ? `${color}15` : 'transparent',
              color: isReady ? color : 'var(--text-tertiary)',
              border: `1px solid ${isReady ? `${color}30` : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.3s',
            }}
          >
            {isReady ? '✓ Ready' : 'Waiting…'}
          </div>
        )}
      </div>

      {/* Label */}
      <p
        className="text-[0.5rem] font-semibold uppercase tracking-[0.15em] text-center mt-2"
        style={{ color: isSelf ? color : 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
      >
        {isSelf ? 'You' : 'Opponent'}
      </p>
    </motion.div>
  );
}

// ─── Room Lobby ─────────────────────────────

export default function RoomLobby() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modeId = searchParams.get('mode') ?? 'prime-grid';
  const difficulty = searchParams.get('difficulty') ?? 'medium';
  const mode = getModeById(modeId);
  const color = MODE_COLORS[modeId] ?? '#6C63FF';

  const [selfReady, setSelfReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Simulate opponent readying
  useEffect(() => {
    const t = setTimeout(() => setOpponentReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Auto-ready self
  useEffect(() => {
    const t = setTimeout(() => setSelfReady(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Start countdown when both ready
  useEffect(() => {
    if (selfReady && opponentReady && countdown === null) {
      setCountdown(COUNTDOWN_SECONDS);
    }
  }, [selfReady, opponentReady, countdown]);

  // Tick countdown
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [countdown !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate on 0
  useEffect(() => {
    if (countdown === 0) {
      const t = setTimeout(() => {
        navigate(`/play/game/${roomId}?mode=${modeId}&difficulty=${difficulty}`);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [countdown, navigate, roomId, modeId, difficulty]);

  const toggleReady = useCallback(() => setSelfReady((p) => !p), []);
  const allReady = selfReady && opponentReady;

  return (
    <div className="relative min-h-full" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-lg mx-auto flex flex-col min-h-full">

        {/* ── Mode header bar ── */}
        <motion.div
          className="relative overflow-hidden px-6 py-5"
          style={{ background: color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-lg font-black tracking-[-0.02em]"
                style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
              >
                {mode?.name ?? modeId}
              </h2>
              <span
                className="text-[0.55rem] font-semibold uppercase tracking-[0.12em]"
                style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)' }}
              >
                Room {roomId?.slice(-6)}
              </span>
            </div>
            <span
              className="text-[0.6rem] font-bold uppercase tracking-[0.1em] px-3 py-1"
              style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: '999px',
                color: '#fff',
                fontFamily: 'var(--font-body)',
              }}
            >
              {difficulty}
            </span>
          </div>
        </motion.div>

        {/* ── VS Area ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="flex items-center gap-5 mb-10">
            <PlayerCard
              name="YOU"
              rank="Recruit"
              wins={17}
              initial="Y"
              isReady={selfReady}
              isSelf={true}
              color={color}
              onToggle={toggleReady}
            />

            {/* VS */}
            <motion.div
              className="flex flex-col items-center gap-2 select-none"
              animate={allReady ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              <span
                className="text-2xl font-black"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: allReady ? color : 'var(--text-muted)',
                  transition: 'color 0.3s',
                }}
              >
                VS
              </span>
              <div className="w-px h-6" style={{ background: `${color}20` }} />
            </motion.div>

            <PlayerCard
              name={MOCK_OPPONENT.username}
              rank={MOCK_OPPONENT.rank}
              wins={MOCK_OPPONENT.wins}
              initial={MOCK_OPPONENT.initial}
              isReady={opponentReady}
              isSelf={false}
              color={color}
            />
          </div>

          {/* Countdown */}
          <AnimatePresence>
            {countdown !== null && countdown > 0 && (
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
              >
                <span
                  className="text-[0.5rem] font-bold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
                >
                  Game Starts In
                </span>
                <motion.span
                  key={countdown}
                  className="text-6xl font-black tabular-nums"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: color,
                  }}
                  initial={{ scale: 1.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {countdown}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* GO flash */}
          <AnimatePresence>
            {countdown === 0 && (
              <motion.span
                className="text-5xl font-black"
                style={{ fontFamily: 'var(--font-display)', color: color }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 0] }}
                transition={{ duration: 0.6 }}
              >
                GO!
              </motion.span>
            )}
          </AnimatePresence>

          {/* Waiting indicator */}
          {!allReady && (
            <motion.p
              className="text-[0.6rem] font-semibold mt-6"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Waiting for all players…
            </motion.p>
          )}
        </div>

        {/* ── Leave button ── */}
        <div className="px-6 pb-6 flex justify-center">
          <motion.button
            className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] cursor-pointer px-6 py-2"
            style={{
              color: 'var(--text-tertiary)',
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              fontFamily: 'var(--font-body)',
            }}
            whileHover={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/play')}
          >
            Leave Room
          </motion.button>
        </div>
      </div>
    </div>
  );
}
