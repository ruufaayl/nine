// ──────────────────────────────────────────────
// S-11 — Matchmaking (animated search → auto-nav)
// ──────────────────────────────────────────────

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { getModeById, CATEGORY_ACCENTS } from '../../lib/gameModesData';

const SEARCH_MESSAGES = [
  'Scanning the grid…',
  'Probing signal frequencies…',
  'Locating opponent…',
  'Rival detected — verifying…',
  'Match found!',
];

const SEARCH_DURATION = 3000; // 3 seconds total

export default function Matchmaking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeId = searchParams.get('mode') ?? 'prime-grid';
  const mode = getModeById(modeId);
  const accent = mode ? CATEGORY_ACCENTS[mode.category] : '#00FFFF';

  const [messageIndex, setMessageIndex] = useState(0);
  const [matchFound, setMatchFound] = useState(false);
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

  // Auto-navigate after 3s
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setMatchFound(true);
      // Brief pause for "Match found!" to display, then navigate
      setTimeout(() => {
        navigate(`/play/lobby/match-${Date.now().toString(36)}?mode=${modeId}`);
      }, 600);
    }, SEARCH_DURATION);

    return () => clearTimeout(timeoutRef.current);
  }, [navigate, modeId]);

  const handleCancel = () => {
    clearTimeout(timeoutRef.current);
    navigate('/play');
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #12091f 0%, #0a0a0f 50%, #060609 100%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Mode label */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span
            className="text-[0.5rem] font-bold uppercase tracking-[0.3em] px-4 py-1.5"
            style={{
              color: accent,
              border: `1px solid ${accent}30`,
              background: `${accent}08`,
            }}
          >
            {mode?.name ?? modeId}
          </span>
        </motion.div>

        {/* Animated search visual */}
        <div className="relative w-48 h-48 mb-12">
          {/* Outer ring — slow spin */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${accent}25` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Middle ring — reverse spin */}
          <motion.div
            className="absolute inset-4 rounded-full"
            style={{ border: `2px dashed ${accent}35` }}
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner ring — fast pulse */}
          <motion.div
            className="absolute inset-10 rounded-full"
            style={{ border: `2px solid ${accent}50` }}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Center glyph */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={matchFound ? { scale: [1, 1.4, 1] } : { scale: [1, 1.05, 1] }}
            transition={
              matchFound
                ? { duration: 0.4 }
                : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            <span
              className="text-4xl"
              style={{
                color: accent,
                filter: `drop-shadow(0 0 20px ${accent}60)`,
              }}
            >
              {matchFound ? '⚡' : '◈'}
            </span>
          </motion.div>

          {/* Scanning sweeper */}
          {!matchFound && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, ${accent}15 60deg, transparent 120deg)`,
                borderRadius: '50%',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Match flash */}
          <AnimatePresence>
            {matchFound && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: `${accent}20`, boxShadow: `0 0 60px ${accent}40` }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Status message */}
        <div className="h-8 flex items-center justify-center mb-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              className="text-xs uppercase tracking-[0.2em] text-center"
              style={{
                fontFamily: 'var(--font-display)',
                color: matchFound ? accent : 'rgba(255,255,255,0.4)',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {SEARCH_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Loading dots */}
        {!matchFound && (
          <div className="flex items-center gap-2 mb-10">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: accent }}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}

        {/* Cancel */}
        {!matchFound && (
          <motion.button
            className="px-6 py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            whileHover={{ borderColor: 'rgba(255,255,255,0.2)' }}
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
