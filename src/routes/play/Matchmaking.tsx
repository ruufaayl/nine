// ──────────────────────────────────────────────
// S-11 — Matchmaking (Premium Search Animation)
//
// Mode-colored background, concentric rings,
// pulsing radar sweep, cycling status messages.
// Smooth transition to lobby on match found.
// ──────────────────────────────────────────────

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { getModeById } from '../../lib/gameModesData';

// ─── Mode colors (shared) ──────────────────

const MODE_COLORS: Record<string, string> = {
  'prime-grid': '#4338CA', 'glyph-grid': '#0F766E', 'shattered-grid': '#B91C1C',
  'canvas-fracture': '#9333EA', 'vault-breaker': '#DB2777', 'cipher-scramble': '#F59E0B',
  'lexicon-weave': '#1E40AF', 'enigma-weave': '#7C2D12', 'interrogation': '#EA580C',
  'alias-protocol': '#E11D48', 'global-override': '#047857', 'data-sift': '#FACC15',
  'cinema-lattice': '#0369A1', 'chronos-shift': '#78350F',
};

const SEARCH_MESSAGES = [
  'Scanning the grid…',
  'Probing signal frequencies…',
  'Locating opponent…',
  'Rival detected — verifying…',
  'Match found!',
];

const SEARCH_DURATION = 3500;

export default function Matchmaking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeId = searchParams.get('mode') ?? 'prime-grid';
  const difficulty = searchParams.get('difficulty') ?? 'medium';
  const mode = getModeById(modeId);
  const color = MODE_COLORS[modeId] ?? '#6C63FF';

  const [messageIndex, setMessageIndex] = useState(0);
  const [matchFound, setMatchFound] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Cycle messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = prev + 1;
        if (next >= SEARCH_MESSAGES.length - 1) {
          clearInterval(interval);
          return SEARCH_MESSAGES.length - 1;
        }
        return next;
      });
    }, SEARCH_DURATION / SEARCH_MESSAGES.length);
    return () => clearInterval(interval);
  }, []);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((p) => p + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-navigate
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setMatchFound(true);
      setTimeout(() => {
        navigate(`/play/lobby/match-${Date.now().toString(36)}?mode=${modeId}&difficulty=${difficulty}`, { replace: true });
      }, 700);
    }, SEARCH_DURATION);
    return () => clearTimeout(timeoutRef.current);
  }, [navigate, modeId, difficulty]);

  const handleCancel = () => {
    clearTimeout(timeoutRef.current);
    navigate(-1);
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className="relative min-h-full overflow-hidden flex flex-col"
      style={{ background: color }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Mode + difficulty + rank label */}
        <motion.div
          className="mb-10 flex flex-col items-center gap-2.5"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span
            className="text-[0.55rem] font-bold uppercase tracking-[0.2em] px-4 py-1.5"
            style={{
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.08)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {mode?.name ?? modeId} · {difficulty}
          </span>
          <span
            className="text-[0.5rem] font-semibold uppercase tracking-[0.15em]"
            style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}
          >
            Matching same-rank opponents
          </span>
        </motion.div>

        {/* Radar / search visual */}
        <div className="relative w-52 h-52 mb-10">
          {/* Ring 1 — slow spin */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '1.5px solid rgba(255,255,255,0.12)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />

          {/* Ring 2 — reverse */}
          <motion.div
            className="absolute inset-5 rounded-full"
            style={{ border: '1.5px dashed rgba(255,255,255,0.15)' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
          />

          {/* Ring 3 — pulse */}
          <motion.div
            className="absolute inset-12 rounded-full"
            style={{ border: '2px solid rgba(255,255,255,0.25)' }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Radar sweep */}
          {!matchFound && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.08) 60deg, transparent 120deg)',
                borderRadius: '50%',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Center glyph */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={matchFound ? { scale: [1, 1.5, 1.1] } : { scale: [1, 1.04, 1] }}
            transition={matchFound
              ? { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
              : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            <span
              className="text-5xl"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.4))',
              }}
            >
              {matchFound ? '⚡' : '◈'}
            </span>
          </motion.div>

          {/* Match flash ring */}
          <AnimatePresence>
            {matchFound && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  boxShadow: '0 0 80px rgba(255,255,255,0.3)',
                }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: [0, 1, 0], scale: [0.6, 1.4, 1.6] }}
                transition={{ duration: 0.8 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Status message */}
        <div className="h-6 flex items-center justify-center mb-3">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              className="text-[0.7rem] font-semibold text-center"
              style={{
                fontFamily: 'var(--font-body)',
                color: matchFound ? '#fff' : 'rgba(255,255,255,0.6)',
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {SEARCH_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Elapsed timer */}
        {!matchFound && (
          <span
            className="text-[0.6rem] font-bold tabular-nums mb-8"
            style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-numeric)' }}
          >
            {timeStr}
          </span>
        )}

        {/* Loading dots */}
        {!matchFound && (
          <div className="flex items-center gap-2 mb-10">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#fff' }}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}

        {/* Cancel */}
        {!matchFound && (
          <motion.button
            className="px-8 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
            style={{
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.05)',
              fontFamily: 'var(--font-body)',
            }}
            whileHover={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)' }}
            whileTap={{ scale: 0.96 }}
            onClick={handleCancel}
          >
            Cancel
          </motion.button>
        )}
      </div>
    </div>
  );
}
