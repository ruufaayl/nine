// ──────────────────────────────────────────────
// S-09 — Play Hub (Solid Card Pile)
//
// Each mode is a full-bleed solid-color card, stacked
// on the next. Scrolling flies the top card up and out,
// revealing the next. Fully reversible and scroll-driven.
// Design: premium solid color blocks, white type, Swiss/brutalist.
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

// Vertical scroll distance per card (fraction of viewport height).
// Smaller = tighter, faster pile.
const CARD_SCROLL_UNIT = 1.0;

// Premium solid color palette — rich, saturated, paired with white text.
// Each card gets its own color for visual rhythm as the pile flies.
const MODE_COLORS: Record<string, { bg: string; ink: 'white' | 'black' }> = {
  'prime-grid':      { bg: '#4338CA', ink: 'white' },  // indigo
  'glyph-grid':      { bg: '#0F766E', ink: 'white' },  // teal
  'shattered-grid':  { bg: '#B91C1C', ink: 'white' },  // crimson
  'canvas-fracture': { bg: '#9333EA', ink: 'white' },  // violet
  'vault-breaker':   { bg: '#DB2777', ink: 'white' },  // pink
  'cipher-scramble': { bg: '#F59E0B', ink: 'black' },  // amber
  'lexicon-weave':   { bg: '#1E40AF', ink: 'white' },  // royal blue
  'enigma-weave':    { bg: '#7C2D12', ink: 'white' },  // burnt sienna
  'interrogation':   { bg: '#EA580C', ink: 'white' },  // orange
  'alias-protocol':  { bg: '#E11D48', ink: 'white' },  // rose
  'global-override': { bg: '#047857', ink: 'white' },  // emerald
  'data-sift':       { bg: '#FACC15', ink: 'black' },  // yellow
  'cinema-lattice':  { bg: '#0369A1', ink: 'white' },  // sky
  'chronos-shift':   { bg: '#78350F', ink: 'white' },  // bronze
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

  // Each card owns a slice of the scroll track [start, end].
  const step = 1 / total;
  const start = index * step;
  const end = (index + 1) * step;

  // Smooth the scroll signal so animations feel buttery, not jittery.
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });

  // ── Motion transforms driven by smoothed progress ──
  // Vertical fly: card sits, then translates up past the viewport.
  const y = useTransform(
    smooth,
    [Math.max(0, start - step * 0.5), start, end, Math.min(1, end + step * 0.2)],
    ['2%', '0%', '-118%', '-118%'],
  );

  // Scale: gentle bloom when entering focus, tiny shrink as it leaves.
  const scale = useTransform(
    smooth,
    [Math.max(0, start - step * 1.2), start, end * 0.95, end],
    [0.92 - index * 0.008, 1, 1, 0.985],
  );

  // Rotation: slight tilt on exit for kinetic feel.
  const rotate = useTransform(
    smooth,
    [start, end * 0.85, end],
    [0, -2, -5],
  );

  // Opacity: fade in from pile, crisp while active, fade on exit.
  const opacity = useTransform(
    smooth,
    [Math.max(0, start - step), start - step * 0.5, start, end * 0.9, end],
    [0.35, 0.7, 1, 1, 0],
  );

  // Shadow depth grows while the card is the hero.
  const shadowOpacity = useTransform(
    smooth,
    [Math.max(0, start - step), start, end * 0.9, end],
    [0.25, 0.55, 0.55, 0.2],
  );
  const boxShadow = useTransform(
    shadowOpacity,
    (o) =>
      `0 40px 90px -30px rgba(0,0,0,${o + 0.15}), 0 20px 50px -20px rgba(0,0,0,${o}), 0 0 0 1px rgba(0,0,0,0.04)`,
  );

  // Inner content parallax — description drifts slightly slower than the card.
  const contentY = useTransform(
    smooth,
    [start - step * 0.5, start, end],
    [16, 0, -24],
  );

  return (
    <motion.div
      className="absolute left-0 right-0 mx-auto"
      style={{
        // Stack inset — underneath cards peek out as slim ridges.
        top: `${index * 8}px`,
        zIndex: total - index,
        y,
        scale,
        rotate,
        opacity,
        transformOrigin: '50% 90%',
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
            borderRadius: '32px',
            background: bg,
            boxShadow,
          }}
        >
          {/* Subtle top highlight — thin sheen for depth */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${ink === 'white' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.18)'}, transparent)`,
            }}
          />

          {/* Oversized glyph watermark — brutalist detail */}
          <div
            aria-hidden
            className="absolute -right-6 -top-10 pointer-events-none select-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: '280px',
              lineHeight: 0.75,
              color: ink === 'white' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
              letterSpacing: '-0.05em',
            }}
          >
            {symbol}
          </div>

          {/* Index tag — top-left */}
          <div className="relative flex items-center justify-between px-7 pt-7">
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                border: `1px solid ${fgLine}`,
                borderRadius: '999px',
              }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: fg }}
              />
              <span
                className="text-[0.55rem] font-semibold uppercase tracking-[0.18em]"
                style={{
                  color: fg,
                  fontFamily: 'var(--font-body)',
                }}
              >
                {mode.category}
              </span>
            </div>
            <span
              className="text-[0.6rem] font-bold tabular-nums tracking-widest"
              style={{
                color: fgSoft,
                fontFamily: 'var(--font-numeric)',
              }}
            >
              {String(index + 1).padStart(2, '0')} — {String(total).padStart(2, '0')}
            </span>
          </div>

          {/* Title + description + meta — bottom, with parallax */}
          <motion.div
            className="absolute inset-x-0 bottom-0 px-7 pb-7"
            style={{ y: contentY }}
          >
            <h2
              className="font-black leading-[0.9] tracking-[-0.03em] mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                color: fg,
                fontSize: 'clamp(2.6rem, 9vw, 3.6rem)',
              }}
            >
              {mode.name}
            </h2>
            <p
              className="text-[0.82rem] leading-relaxed mb-6 max-w-[90%]"
              style={{
                color: ink === 'white' ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.72)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
            >
              {mode.description}
            </p>

            {/* Meta bar — format / duration / play button */}
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
                <span className="text-[0.65rem] uppercase tracking-[0.18em]">
                  Play
                </span>
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

  // Scroll track sized to accommodate all cards sequentially.
  const trackHeightVh = GAME_MODES.length * CARD_SCROLL_UNIT * 100;

  // IMPORTANT: PlayHub owns its own scroll container so useScroll can track it.
  // The parent <main> (mobile-shell) stays static; scroll happens inside this div.
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
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
              }}
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

      {/* Scroll track — drives all card animations */}
      <div
        ref={trackRef}
        className="relative px-6"
        style={{ height: `${trackHeightVh}vh` }}
      >
        {/* Sticky viewport — the pile stays centered while scroll progresses */}
        <div
          className="sticky mx-auto"
          style={{
            top: '1rem',
            height: 'calc(100dvh - 10rem)',
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

      {/* Trailing spacer so the last card has room to settle */}
      <div style={{ height: '24vh' }} />
    </div>
  );
}
