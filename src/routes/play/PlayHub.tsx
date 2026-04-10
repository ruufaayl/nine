// ──────────────────────────────────────────────
// S-09 — Play Hub (Solid Card Pile — Premium)
//
// Solid-color cards stacked. Scroll flies them
// up one-by-one. Last card locks in place (no fly).
// Fully opaque — no transparency between cards.
// Buttery spring physics, Swiss/brutalist design.
// ──────────────────────────────────────────────

import { useNavigate } from 'react-router';
import { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type MotionValue,
} from 'framer-motion';
import {
  GAME_MODES,
  type GameCategory,
  type GameModeEntry,
} from '../../lib/gameModesData';

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
  // Each card owns a slice of the scroll track.
  // The last card's slice is shorter — it only needs to come into view, not fly out.
  const step = 1 / total;
  const start = index * step;
  const end = (index + 1) * step;

  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.35 });

  // ── Motion transforms ──
  // Last card: slides into view then LOCKS (no fly-out).
  const y = useTransform(
    smooth,
    isLast
      ? [Math.max(0, start - step * 0.3), start, 1]
      : [Math.max(0, start - step * 0.3), start, end, Math.min(1, end + step * 0.1)],
    isLast
      ? ['4%', '0%', '0%']
      : ['4%', '0%', '-110%', '-110%'],
  );

  // Scale: gentle bloom in, slight shrink on exit (last card stays at 1).
  const scale = useTransform(
    smooth,
    isLast
      ? [Math.max(0, start - step * 0.8), start, 1]
      : [Math.max(0, start - step * 0.8), start, end * 0.92, end],
    isLast
      ? [0.94, 1, 1]
      : [0.94, 1, 1, 0.97],
  );

  // Rotation: slight tilt on exit for kinetic feel (last card: none).
  const rotate = useTransform(
    smooth,
    isLast
      ? [start, 1]
      : [start, end * 0.85, end],
    isLast
      ? [0, 0]
      : [0, -1.5, -4],
  );

  // Opacity: FULLY OPAQUE when active. No transparency gaps.
  // Cards below are hidden by the card above — stack is opaque.
  const opacity = useTransform(
    smooth,
    isLast
      ? [Math.max(0, start - step * 0.6), Math.max(0, start - step * 0.2), start, 1]
      : [Math.max(0, start - step * 0.6), Math.max(0, start - step * 0.2), start, end * 0.85, end],
    isLast
      ? [0, 0.5, 1, 1]
      : [0, 0.5, 1, 1, 0],
  );

  // Shadow depth.
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

  // Parallax content drift.
  const contentY = useTransform(
    smooth,
    [start - step * 0.3, start, isLast ? 1 : end],
    [14, 0, isLast ? 0 : -20],
  );

  return (
    <motion.div
      className="absolute left-0 right-0 mx-auto"
      style={{
        top: `${index * 6}px`,
        zIndex: total - index,
        y,
        scale,
        rotate,
        opacity,
        transformOrigin: '50% 85%',
      }}
    >
      <motion.button
        onClick={onClick}
        className="relative w-full text-left outline-none select-none cursor-pointer block"
        whileTap={{ scale: 0.99 }}
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

// ─── Play Hub ───────────────────────────────

export default function PlayHub() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Track sized so all cards (except last) get a full scroll unit.
  // Last card needs less track — it just settles, doesn't fly out.
  const trackHeightVh = (GAME_MODES.length - 0.3) * 100;

  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: trackRef,
    offset: ['start start', 'end end'],
  });

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
        {/* Sticky viewport */}
        <div
          className="sticky mx-auto"
          style={{
            top: '0.75rem',
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
                onClick={() => navigate(`/play/mode/${mode.id}`)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Trailing spacer — enough for last card to settle cleanly */}
      <div style={{ height: '16vh' }} />
    </div>
  );
}
