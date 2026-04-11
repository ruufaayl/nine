// ──────────────────────────────────────────────
// S-09 — Play Hub (Solid Card Pile — Premium)
//
// Solid-color cards stacked. Scroll flies them
// up one-by-one. Last card locks in place.
// Tapping a card opens a bottom sheet with
// difficulty slider + play offline / PvP.
// No separate ModeDetail screen needed.
// ──────────────────────────────────────────────

import { useNavigate } from 'react-router';
import { useRef, useState, useMemo } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
  type MotionValue,
} from 'framer-motion';
import {
  GAME_MODES,
  type GameCategory,
  type GameModeEntry,
} from '../../lib/gameModesData';
import { ENTRY_FEES, TIME_LIMITS, TROPHY_DELTAS } from '../../lib/economy';

// ─── Design tokens ──────────────────────────

const MODE_COLORS: Record<string, { bg: string; ink: 'white' | 'black' }> = {
  'prime-grid':      { bg: '#4338CA', ink: 'white' },
  'glyph-grid':      { bg: '#0F766E', ink: 'white' },
  'shattered-grid':  { bg: '#B91C1C', ink: 'white' },
  'canvas-fracture': { bg: '#9333EA', ink: 'white' },
  'vault-breaker':   { bg: '#DB2777', ink: 'white' },
  'cipher-scramble': { bg: '#F59E0B', ink: 'black' },
  'lexicon-weave':   { bg: '#1E40AF', ink: 'white' },
  'enigma-weave':    { bg: '#7C2D12', ink: 'white' },
  'interrogation':   { bg: '#EA580C', ink: 'white' },
  'alias-protocol':  { bg: '#E11D48', ink: 'white' },
  'global-override': { bg: '#047857', ink: 'white' },
  'data-sift':       { bg: '#FACC15', ink: 'black' },
  'cinema-lattice':  { bg: '#0369A1', ink: 'white' },
  'chronos-shift':   { bg: '#78350F', ink: 'white' },
};

const CATEGORY_SYMBOL: Record<GameCategory, string> = {
  'Core Systems': '◈',
  'The Cyphers':  '⟁',
  'The Archives': '⧖',
  'The Matrices': '⬡',
};

function colorFor(id: string) {
  return MODE_COLORS[id] ?? { bg: '#111111', ink: 'white' as const };
}

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   color: '#34C759', desc: 'Relaxed pace, gentle puzzles' },
  { id: 'medium', label: 'Medium', color: '#F59E0B', desc: 'Balanced challenge' },
  { id: 'hard',   label: 'Hard',   color: '#EF4444', desc: 'Serious brain workout' },
  { id: 'expert', label: 'Expert', color: '#8B5CF6', desc: 'Only for the fearless' },
] as const;

type DifficultyId = typeof DIFFICULTIES[number]['id'];

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ─── Single Card ────────────────────────────

interface CardProps {
  mode: GameModeEntry;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
  onClick: () => void;
}

function PileCard({ mode, index, total, scrollYProgress, onClick }: CardProps) {
  const { bg, ink } = colorFor(mode.id);
  const fg = ink === 'white' ? '#ffffff' : '#0a0a0a';
  const fgSoft = ink === 'white' ? 'rgba(255,255,255,0.65)' : 'rgba(10,10,10,0.65)';
  const fgLine = ink === 'white' ? 'rgba(255,255,255,0.22)' : 'rgba(10,10,10,0.22)';
  const symbol = CATEGORY_SYMBOL[mode.category];

  const isLast = index === total - 1;
  const step = 1 / total;
  const start = index * step;
  const end = (index + 1) * step;
  // Last card: arrives at `start` and stays completely frozen after.
  const arrive = isLast ? Math.min(start + step * 0.05, 1) : end;

  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.35 });

  // ── Motion transforms ──
  const y = useTransform(
    smooth,
    isLast
      ? [Math.max(0, start - step * 0.3), arrive, arrive + 0.001, 1]
      : [Math.max(0, start - step * 0.3), start, end, Math.min(1, end + step * 0.1)],
    isLast
      ? ['4%', '0%', '0%', '0%']
      : ['4%', '0%', '-110%', '-110%'],
  );

  const scale = useTransform(
    smooth,
    isLast
      ? [Math.max(0, start - step * 0.8), arrive, 1]
      : [Math.max(0, start - step * 0.8), start, end * 0.92, end],
    isLast
      ? [0.94, 1, 1]
      : [0.94, 1, 1, 0.97],
  );

  const rotate = useTransform(
    smooth,
    isLast
      ? [start, 1]
      : [start, end * 0.85, end],
    isLast
      ? [0, 0]
      : [0, -1.5, -4],
  );

  const opacity = useTransform(
    smooth,
    isLast
      ? [Math.max(0, start - step * 0.6), Math.max(0, start - step * 0.2), arrive, 1]
      : [Math.max(0, start - step * 0.6), Math.max(0, start - step * 0.2), start, end * 0.85, end],
    isLast
      ? [0, 0.5, 1, 1]
      : [0, 0.5, 1, 1, 0],
  );

  const boxShadow = useTransform(
    smooth,
    [Math.max(0, start - step), start, isLast ? 1 : end],
    [
      '0 20px 40px -15px rgba(0,0,0,0.2)',
      '0 40px 80px -20px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.04)',
      isLast
        ? '0 40px 80px -20px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.04)'
        : '0 10px 30px -10px rgba(0,0,0,0.15)',
    ],
  );

  const contentY = useTransform(
    smooth,
    [start - step * 0.3, start, isLast ? 1 : end],
    [14, 0, isLast ? 0 : -20],
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        zIndex: total - index,
        y,
        scale,
        rotate,
        opacity,
        transformOrigin: '50% 50%',
      }}
    >
      <motion.button
        onClick={onClick}
        className="relative w-full text-left outline-none select-none cursor-pointer block"
        whileTap={{ scale: 0.98 }}
        style={{
          height: '64vh',
          maxHeight: '560px',
          padding: 0,
        }}
      >
        <motion.div
          className="relative w-full h-full overflow-hidden"
          style={{
            borderRadius: '28px',
            background: bg,
            boxShadow,
          }}
        >
          {/* Top highlight sheen */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${ink === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.18)'}, transparent)`,
            }}
          />

          {/* Oversized glyph watermark */}
          <div
            aria-hidden
            className="absolute -right-6 -top-10 pointer-events-none select-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: '260px',
              lineHeight: 0.75,
              color: ink === 'white' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              letterSpacing: '-0.05em',
            }}
          >
            {symbol}
          </div>

          {/* Index tag + category — top */}
          <div className="relative flex items-center justify-between px-7 pt-7">
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                border: `1px solid ${fgLine}`,
                borderRadius: '999px',
              }}
            >
              <span className="w-1 h-1 rounded-full" style={{ background: fg }} />
              <span
                className="text-[0.55rem] font-semibold uppercase tracking-[0.18em]"
                style={{ color: fg, fontFamily: 'var(--font-body)' }}
              >
                {mode.category}
              </span>
            </div>
            <span
              className="text-[0.6rem] font-bold tabular-nums tracking-widest"
              style={{ color: fgSoft, fontFamily: 'var(--font-numeric)' }}
            >
              {String(index + 1).padStart(2, '0')} — {String(total).padStart(2, '0')}
            </span>
          </div>

          {/* Title + description + meta — bottom */}
          <motion.div
            className="absolute inset-x-0 bottom-0 px-7 pb-7"
            style={{ y: contentY }}
          >
            <h2
              className="font-black leading-[0.9] tracking-[-0.03em] mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                color: fg,
                fontSize: 'clamp(2.4rem, 8.5vw, 3.4rem)',
              }}
            >
              {mode.name}
            </h2>
            <p
              className="text-[0.8rem] leading-relaxed mb-6 max-w-[90%]"
              style={{
                color: ink === 'white' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
            >
              {mode.description}
            </p>

            {/* Meta bar */}
            <div
              className="flex items-end justify-between pt-5"
              style={{ borderTop: `1px solid ${fgLine}` }}
            >
              <div className="flex items-center gap-5">
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[0.5rem] font-bold uppercase tracking-[0.18em]"
                    style={{ color: fgSoft, fontFamily: 'var(--font-body)' }}
                  >
                    Format
                  </span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: fg, fontFamily: 'var(--font-numeric)' }}
                  >
                    {mode.playerCount}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[0.5rem] font-bold uppercase tracking-[0.18em]"
                    style={{ color: fgSoft, fontFamily: 'var(--font-body)' }}
                  >
                    Duration
                  </span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: fg, fontFamily: 'var(--font-numeric)' }}
                  >
                    {mode.avgDuration}
                  </span>
                </div>
              </div>

              <motion.div
                className="flex items-center gap-2 px-5 py-3"
                style={{
                  background: fg,
                  color: ink === 'white' ? '#0a0a0a' : '#ffffff',
                  borderRadius: '999px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                }}
                whileHover={{ scale: 1.04 }}
              >
                <span className="text-[0.65rem] uppercase tracking-[0.18em]">Play</span>
                <span className="text-sm leading-none">→</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.button>
    </motion.div>
  );
}

// ─── Play Bottom Sheet ─────────────────────

interface PlaySheetProps {
  mode: GameModeEntry;
  onClose: () => void;
  onPlay: (type: 'offline' | 'pvp', difficulty: DifficultyId) => void;
}

function PlaySheet({ mode, onClose, onPlay }: PlaySheetProps) {
  const [difficulty, setDifficulty] = useState<DifficultyId>('medium');
  const diff = useMemo(() => DIFFICULTIES.find((d) => d.id === difficulty)!, [difficulty]);
  const { bg, ink } = colorFor(mode.id);
  const fg = ink === 'white' ? '#fff' : '#0a0a0a';
  const entryFee = ENTRY_FEES[difficulty] ?? 100;
  const timeLimit = TIME_LIMITS[difficulty] ?? 900;
  const trophyDelta = TROPHY_DELTAS[difficulty] ?? { win: 12, loss: 8 };

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-lg mx-auto"
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '85dvh',
          overflow: 'auto',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Mode header strip */}
        <div
          className="relative overflow-hidden px-6 py-5"
          style={{ background: bg, borderRadius: '24px 24px 0 0' }}
        >
          <div
            className="absolute top-0 left-6 right-6 h-px"
            style={{ background: ink === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
          />
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-lg font-black tracking-[-0.02em]"
                style={{ fontFamily: 'var(--font-display)', color: fg }}
              >
                {mode.name}
              </h2>
              <span
                className="text-[0.55rem] font-semibold uppercase tracking-[0.12em]"
                style={{
                  color: ink === 'white' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {mode.playerCount} · {mode.avgDuration}
              </span>
            </div>
            <motion.button
              className="w-8 h-8 flex items-center justify-center cursor-pointer"
              style={{
                background: ink === 'white' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                border: 'none',
                borderRadius: '999px',
                color: fg,
                fontSize: '0.9rem',
              }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
            >
              ✕
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-5 flex flex-col gap-5">
          {/* Difficulty slider */}
          <div>
            <h3
              className="text-[0.6rem] font-bold uppercase tracking-[0.18em] mb-3"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              Difficulty
            </h3>

            <div
              className="relative flex w-full p-1"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <motion.div
                className="absolute top-1 bottom-1"
                style={{
                  width: `${100 / DIFFICULTIES.length}%`,
                  background: diff.color,
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: `0 4px 12px ${diff.color}30`,
                }}
                animate={{
                  left: `${(DIFFICULTIES.findIndex((d) => d.id === difficulty) / DIFFICULTIES.length) * 100 + 0.5}%`,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />

              {DIFFICULTIES.map((d) => {
                const isActive = d.id === difficulty;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className="relative z-10 flex-1 py-2.5 text-center cursor-pointer"
                    style={{
                      background: 'none',
                      border: 'none',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: isActive ? '#fff' : 'var(--text-tertiary)',
                      transition: 'color 0.2s',
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={difficulty}
                className="flex items-center justify-between mt-2.5 px-1"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <span
                  className="text-[0.7rem]"
                  style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
                >
                  {diff.desc}
                </span>
                <span
                  className="text-[0.6rem] font-bold tabular-nums"
                  style={{ color: diff.color, fontFamily: 'var(--font-numeric)' }}
                >
                  {Math.floor(timeLimit / 60)}:{String(timeLimit % 60).padStart(2, '0')}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stakes grid */}
          <div className="grid grid-cols-3 gap-2">
            <div
              className="flex flex-col items-center py-3"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-numeric)' }}
              >
                {entryFee}
              </span>
              <span
                className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] mt-0.5"
                style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
              >
                Entry Fee
              </span>
            </div>
            <div
              className="flex flex-col items-center py-3"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: '#34C759', fontFamily: 'var(--font-numeric)' }}
              >
                +{trophyDelta.win}
              </span>
              <span
                className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] mt-0.5"
                style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
              >
                Win
              </span>
            </div>
            <div
              className="flex flex-col items-center py-3"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: '#EF4444', fontFamily: 'var(--font-numeric)' }}
              >
                -{trophyDelta.loss}
              </span>
              <span
                className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] mt-0.5"
                style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
              >
                Loss
              </span>
            </div>
          </div>

          {/* Play buttons */}
          <div className="flex flex-col gap-3 pb-4">
            <motion.button
              className="w-full py-4 cursor-pointer relative overflow-hidden"
              style={{
                background: bg,
                border: 'none',
                borderRadius: 'var(--radius-md)',
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPlay('offline', difficulty)}
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                <span className="text-lg" style={{ lineHeight: 1, color: fg }}>◈</span>
                <span
                  className="text-[0.8rem] font-black uppercase tracking-[0.08em]"
                  style={{ fontFamily: 'var(--font-display)', color: fg }}
                >
                  Play Offline
                </span>
              </div>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                }}
              />
            </motion.button>

            <motion.button
              className="w-full py-4 cursor-pointer"
              style={{
                background: 'none',
                border: '2px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPlay('pvp', difficulty)}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-lg" style={{ lineHeight: 1, color: bg }}>⚡</span>
                <span
                  className="text-[0.8rem] font-black uppercase tracking-[0.08em]"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                >
                  Play PvP
                </span>
                <span
                  className="text-[0.55rem] font-bold tabular-nums px-2 py-0.5"
                  style={{
                    background: `${bg}15`,
                    color: bg,
                    borderRadius: 'var(--radius-full)',
                    fontFamily: 'var(--font-numeric)',
                  }}
                >
                  {entryFee} coins
                </span>
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Play Hub ───────────────────────────────

export default function PlayHub() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameModeEntry | null>(null);

  const trackHeightVh = (GAME_MODES.length - 0.5) * 100;

  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  const handlePlay = (type: 'offline' | 'pvp', difficulty: DifficultyId) => {
    if (!selectedMode) return;
    setSelectedMode(null);
    if (type === 'offline') {
      navigate(`/play/game/offline-${Date.now().toString(36)}?mode=${selectedMode.id}&difficulty=${difficulty}`);
    } else {
      navigate(`/play/matchmaking?mode=${selectedMode.id}&difficulty=${difficulty}`);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto overflow-x-hidden"
      style={{
        background: 'var(--bg-primary)',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-end justify-between">
          <div>
            <h1
              className="text-3xl font-black tracking-[-0.03em] leading-none"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Play
            </h1>
            <p
              className="text-[0.7rem] mt-2 uppercase tracking-[0.18em] font-semibold"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              {GAME_MODES.length} modes · scroll to browse
            </p>
          </div>
          <div
            className="text-[0.55rem] font-bold uppercase tracking-[0.18em] tabular-nums"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-numeric)' }}
          >
            01 / {String(GAME_MODES.length).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Scroll track */}
      <div
        ref={trackRef}
        className="relative px-6"
        style={{ height: `${trackHeightVh}vh` }}
      >
        {/* Sticky viewport — centered between header & nav */}
        <div
          className="sticky mx-auto"
          style={{
            top: '1.375rem',
            height: 'calc(100dvh - 9.5rem)',
            maxWidth: '390px',
          }}
        >
          <div className="relative w-full h-full">
            {GAME_MODES.map((mode, i) => (
              <PileCard
                key={mode.id}
                mode={mode}
                index={i}
                total={GAME_MODES.length}
                scrollYProgress={scrollYProgress}
                onClick={() => setSelectedMode(mode)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Trailing spacer */}
      <div style={{ height: '10vh' }} />

      {/* Play bottom sheet */}
      <AnimatePresence>
        {selectedMode && (
          <PlaySheet
            mode={selectedMode}
            onClose={() => setSelectedMode(null)}
            onPlay={handlePlay}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
