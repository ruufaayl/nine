// ──────────────────────────────────────────────
// S-12 — Room Lobby (pre-game countdown)
// ──────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { getModeById, CATEGORY_ACCENTS } from '../../lib/gameModesData';

const COUNTDOWN_SECONDS = 5;

const MOCK_OPPONENT = {
  username: 'SPECTRAL_07',
  rank: 'Operative',
  wins: 42,
  avatar: '⟁',
};

// ─── Player Card ────────────────────────────

interface PlayerCardProps {
  username: string;
  rank: string;
  wins: number;
  avatar: string;
  isReady: boolean;
  isSelf: boolean;
  accent: string;
  onToggleReady?: () => void;
}

function PlayerCard({
  username, rank, wins, avatar, isReady, isSelf, accent, onToggleReady,
}: PlayerCardProps) {
  return (
    <motion.div
      className="relative flex-1 max-w-[240px] select-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: isSelf ? 0 : 0.2 }}
    >
      <div
        className="relative px-5 py-6 text-center"
        style={{
          background: '#0c0c14',
          border: `2px solid ${isReady ? accent : 'rgba(255,255,255,0.1)'}`,
          boxShadow: isReady ? `4px 4px 0px ${accent}` : '4px 4px 0px rgba(255,255,255,0.05)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Avatar */}
        <motion.div
          className="text-3xl mb-3"
          animate={isReady ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {avatar}
        </motion.div>

        {/* Username */}
        <h3
          className="text-sm font-black uppercase tracking-[0.12em] mb-1"
          style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
        >
          {username}
        </h3>

        {/* Rank + wins */}
        <p className="text-[0.5rem] uppercase tracking-widest text-white/30 mb-4">
          {rank} · {wins}W
        </p>

        {/* Ready state */}
        {isSelf ? (
          <motion.button
            className="w-full py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] cursor-pointer"
            style={{
              background: isReady ? accent : 'transparent',
              color: isReady ? '#0a0a0f' : 'rgba(255,255,255,0.4)',
              border: isReady ? 'none' : '1px solid rgba(255,255,255,0.15)',
              fontFamily: 'var(--font-display)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggleReady}
          >
            {isReady ? '✓ READY' : 'READY UP'}
          </motion.button>
        ) : (
          <div
            className="w-full py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-center"
            style={{
              background: isReady ? `${accent}20` : 'transparent',
              color: isReady ? accent : 'rgba(255,255,255,0.2)',
              border: `1px solid ${isReady ? `${accent}40` : 'rgba(255,255,255,0.06)'}`,
              fontFamily: 'var(--font-display)',
            }}
          >
            {isReady ? '✓ READY' : 'WAITING…'}
          </div>
        )}

        {/* Ready glow */}
        {isReady && (
          <motion.div
            className="absolute -inset-px pointer-events-none"
            style={{ boxShadow: `inset 0 0 20px ${accent}15, 0 0 30px ${accent}10` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </div>

      {/* Label */}
      <p
        className="text-[0.45rem] uppercase tracking-[0.3em] text-center mt-2"
        style={{ color: isSelf ? accent : 'rgba(255,255,255,0.2)' }}
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
  const mode = getModeById(modeId);
  const accent = mode ? CATEGORY_ACCENTS[mode.category] : '#00FFFF';

  const [selfReady, setSelfReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Simulate opponent readying up after 1s
  useEffect(() => {
    const t = setTimeout(() => setOpponentReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Auto-ready self after 2s
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
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [countdown !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate when countdown hits 0
  useEffect(() => {
    if (countdown === 0) {
      const t = setTimeout(() => {
        navigate(`/play/game/${roomId}?mode=${modeId}`);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [countdown, navigate, roomId, modeId]);

  const toggleReady = useCallback(() => setSelfReady((p) => !p), []);

  const allReady = selfReady && opponentReady;

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #12091f 0%, #0a0a0f 50%, #060609 100%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-xl font-black uppercase tracking-[0.2em] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Room Lobby
          </h1>
          <div className="flex items-center justify-center gap-3">
            <span
              className="text-[0.5rem] font-bold uppercase tracking-[0.2em] px-3 py-1"
              style={{ color: accent, border: `1px solid ${accent}30`, background: `${accent}08` }}
            >
              {mode?.name ?? modeId}
            </span>
            <span className="text-[0.45rem] uppercase tracking-widest text-white/20">
              {roomId}
            </span>
          </div>
        </motion.div>

        {/* VS layout */}
        <div className="flex items-center gap-8 sm:gap-14 mb-12">
          <PlayerCard
            username="YOU"
            rank="Recruit"
            wins={17}
            avatar="◈"
            isReady={selfReady}
            isSelf={true}
            accent={accent}
            onToggleReady={toggleReady}
          />

          {/* VS divider */}
          <motion.div
            className="flex flex-col items-center gap-2 select-none"
            animate={allReady ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <span
              className="text-xl font-black"
              style={{
                fontFamily: 'var(--font-display)',
                color: allReady ? accent : 'rgba(255,255,255,0.15)',
                textShadow: allReady ? `0 0 20px ${accent}50` : 'none',
                transition: 'all 0.3s',
              }}
            >
              VS
            </span>
            <div
              className="w-px h-8"
              style={{ background: `${accent}20` }}
            />
          </motion.div>

          <PlayerCard
            username={MOCK_OPPONENT.username}
            rank={MOCK_OPPONENT.rank}
            wins={MOCK_OPPONENT.wins}
            avatar={MOCK_OPPONENT.avatar}
            isReady={opponentReady}
            isSelf={false}
            accent={accent}
          />
        </div>

        {/* Countdown */}
        <AnimatePresence>
          {countdown !== null && countdown > 0 && (
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
            >
              <span
                className="text-[0.5rem] uppercase tracking-[0.3em]"
                style={{ color: `${accent}88`, fontFamily: 'var(--font-display)' }}
              >
                Game Starts In
              </span>
              <motion.span
                key={countdown}
                className="text-6xl font-black tabular-nums"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: accent,
                  textShadow: `0 0 40px ${accent}50`,
                }}
                initial={{ scale: 1.5, opacity: 0 }}
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
              style={{
                fontFamily: 'var(--font-display)',
                color: accent,
                textShadow: `0 0 60px ${accent}80`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 0] }}
              transition={{ duration: 0.6 }}
            >
              GO!
            </motion.span>
          )}
        </AnimatePresence>

        {/* Waiting status */}
        {!allReady && (
          <motion.p
            className="text-[0.55rem] uppercase tracking-[0.2em] text-white/20 mt-8"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Waiting for all players…
          </motion.p>
        )}

        {/* Leave button */}
        <motion.button
          className="absolute bottom-8 text-[0.5rem] uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors cursor-pointer"
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/play')}
        >
          Leave Room
        </motion.button>
      </div>
    </div>
  );
}
