// ──────────────────────────────────────────────
// NINE — The Vault Dial (Homepage)
// Neo-brutalist cyberpunk mode selector
// ──────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────

type GameCategory = 'Core Systems' | 'The Cyphers' | 'The Archives' | 'The Matrices';
type VaultPhase = 'idle' | 'category-selected' | 'mode-selected';

interface GameModeEntry {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
}

interface DifficultyEntry {
  key: string;
  label: string;
  sublabel: string;
  accent: string;
}

// ─── Data ───────────────────────────────────

const GAME_MODES: readonly GameModeEntry[] = [
  { id: 'prime-grid',      name: 'Prime Grid',        description: 'Classic 9×9 logic.',            category: 'Core Systems' },
  { id: 'glyph-grid',      name: 'Glyph Grid',        description: 'Wordoku with diagonals.',       category: 'Core Systems' },
  { id: 'shattered-grid',  name: 'Shattered Grid',    description: 'Reassemble polyomino shards.',  category: 'Core Systems' },
  { id: 'canvas-fracture', name: 'Canvas Fracture',   description: 'Slide & rotate tiles.',         category: 'Core Systems' },

  { id: 'vault-breaker',   name: 'Vault Breaker',     description: 'Crack the 5-letter code.',      category: 'The Cyphers' },
  { id: 'cipher-scramble', name: 'Cipher Scramble',   description: 'Unscramble. Find every word.',  category: 'The Cyphers' },
  { id: 'lexicon-weave',   name: 'Lexicon Weave',     description: 'Crossword intersections.',      category: 'The Cyphers' },
  { id: 'enigma-weave',    name: 'Enigma Weave',      description: 'Cryptic double meanings.',      category: 'The Cyphers' },

  { id: 'interrogation',   name: 'The Interrogation', description: 'Timed quiz. Multiplier decays.',category: 'The Archives' },
  { id: 'alias-protocol',  name: 'Alias Protocol',    description: '5 clues. 3 guesses.',           category: 'The Archives' },
  { id: 'global-override', name: 'Global Override',    description: 'Rapid-fire geo flash.',         category: 'The Archives' },

  { id: 'data-sift',       name: 'Data Sift',         description: 'Find 4 that belong.',           category: 'The Matrices' },
  { id: 'cinema-lattice',  name: 'Cinema Lattice',    description: 'Actor-genre-decade matrix.',    category: 'The Matrices' },
  { id: 'chronos-shift',   name: 'Chronos Shift',     description: 'Sort events chronologically.',  category: 'The Matrices' },
];

const CATEGORIES: readonly GameCategory[] = [
  'Core Systems',
  'The Cyphers',
  'The Archives',
  'The Matrices',
];

const CATEGORY_ACCENTS: Record<GameCategory, string> = {
  'Core Systems': '#00FFFF',
  'The Cyphers':  '#FF00FF',
  'The Archives': '#FF6600',
  'The Matrices': '#AAFF00',
};

const CATEGORY_GLYPHS: Record<GameCategory, string> = {
  'Core Systems': '◈',
  'The Cyphers':  '⟁',
  'The Archives': '⧖',
  'The Matrices': '⬡',
};

const DIFFICULTIES: readonly DifficultyEntry[] = [
  { key: 'trainee',    label: 'TRAINEE',    sublabel: 'Easy',   accent: '#AAFF00' },
  { key: 'operative',  label: 'OPERATIVE',  sublabel: 'Medium', accent: '#00FFFF' },
  { key: 'mastermind', label: 'MASTERMIND', sublabel: 'Hard',   accent: '#FF00FF' },
];

// ─── Geometry Utilities ─────────────────────

const DEG2RAD = Math.PI / 180;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * DEG2RAD;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToXY(cx, cy, r, endDeg);
  const end = polarToXY(cx, cy, r, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

function midAngle(startDeg: number, endDeg: number): number {
  return (startDeg + endDeg) / 2;
}

// ─── Dial Constants ─────────────────────────

const CX = 300;
const CY = 300;
const OUTER_R = 250;
const MIDDLE_R = 170;
const CORE_R = 65;
const ARC_GAP = 8;
const DIAL_SIZE = 600;

// ─── Framer Motion Variants ─────────────────

const coreLockVariants = {
  locked: {
    scale: 1,
    boxShadow: '0 0 0px rgba(0,255,255,0), inset 0 0 0px rgba(0,255,255,0)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  primed: {
    scale: 1.06,
    boxShadow: '0 0 25px rgba(0,255,255,0.15), inset 0 0 15px rgba(0,255,255,0.05)',
    borderColor: 'rgba(0,255,255,0.35)',
    transition: { type: 'spring' as const, stiffness: 200, damping: 15 },
  },
  unlocked: {
    scale: [1.06, 1.25, 1.1],
    boxShadow: [
      '0 0 25px rgba(0,255,255,0.15), inset 0 0 15px rgba(0,255,255,0.05)',
      '0 0 80px rgba(0,255,255,0.6), inset 0 0 40px rgba(0,255,255,0.2)',
      '0 0 35px rgba(0,255,255,0.25), inset 0 0 20px rgba(0,255,255,0.1)',
    ],
    borderColor: ['rgba(0,255,255,0.35)', 'rgba(0,255,255,1)', 'rgba(0,255,255,0.5)'],
    transition: { duration: 0.6, times: [0, 0.4, 1] },
  },
};

const cardFlyVariants = {
  hidden: { scale: 0, opacity: 0, y: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 280,
      damping: 22,
      mass: 0.8,
      delay: 0.35 + i * 0.09,
    },
  }),
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const labelVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const breadcrumbVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

// ─── Cosmic Background ──────────────────────

function CosmicBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'var(--bg-primary)',
        }}
      />

      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="vault-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(var(--fg),0.035)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#vault-grid)" />
      </svg>

      {/* Rotating geometric shapes */}
      <div
        className="absolute"
        style={{
          top: '15%',
          left: '10%',
          width: 400,
          height: 400,
          border: '1px solid rgba(var(--fg),0.025)',
          animation: 'slow-spin 120s linear infinite',
        }}
      />
      <div
        className="absolute"
        style={{
          top: '50%',
          right: '5%',
          width: 300,
          height: 300,
          border: '1px solid rgba(var(--fg),0.02)',
          borderRadius: '50%',
          animation: 'reverse-spin 90s linear infinite',
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: '10%',
          left: '30%',
          width: 200,
          height: 200,
          border: '1px solid rgba(var(--fg),0.02)',
          transform: 'rotate(45deg)',
          animation: 'slow-spin 150s linear infinite',
        }}
      />

      {/* Nebula glow */}
      <div
        className="absolute"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100,0,180,0.06) 0%, transparent 70%)',
          animation: 'pulse-glow 8s ease-in-out infinite',
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
        }}
      />
    </div>
  );
}

// ─── Outer Ring (Categories) ────────────────

interface OuterRingProps {
  activeCategory: GameCategory | null;
  onSelect: (cat: GameCategory) => void;
  phase: VaultPhase;
}

function OuterRing({ activeCategory, onSelect, phase }: OuterRingProps) {
  const arcSpan = 360 / CATEGORIES.length - ARC_GAP;

  return (
    <>
      {/* SVG arcs */}
      <svg
        className="absolute inset-0"
        viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}
        style={{ width: DIAL_SIZE, height: DIAL_SIZE }}
      >
        <defs>
          {CATEGORIES.map((cat) => (
            <filter key={`glow-${cat}`} id={`glow-outer-${cat.replace(/\s/g, '')}`}>
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        {CATEGORIES.map((cat, i) => {
          const startDeg = i * (arcSpan + ARC_GAP) + ARC_GAP / 2;
          const endDeg = startDeg + arcSpan;
          const isActive = activeCategory === cat;
          const isDimmed = phase !== 'idle' && !isActive;
          const accent = CATEGORY_ACCENTS[cat];
          const d = describeArc(CX, CY, OUTER_R, startDeg, endDeg);

          return (
            <g key={cat}>
              {/* Invisible wide hit area */}
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={50}
                strokeLinecap="round"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(cat)}
              />
              {/* Visible arc */}
              <motion.path
                d={d}
                fill="none"
                strokeLinecap="round"
                initial={false}
                animate={{
                  stroke: isActive ? accent : isDimmed ? 'rgba(var(--fg),0.06)' : 'rgba(var(--fg),0.12)',
                  strokeWidth: isActive ? 6 : 3,
                  filter: isActive ? `url(#glow-outer-${cat.replace(/\s/g, '')})` : 'none',
                  opacity: isDimmed ? 0.3 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ pointerEvents: 'none' }}
              />
            </g>
          );
        })}
      </svg>

      {/* Labels positioned at arc midpoints */}
      {CATEGORIES.map((cat, i) => {
        const startDeg = i * (arcSpan + ARC_GAP) + ARC_GAP / 2;
        const endDeg = startDeg + arcSpan;
        const mid = midAngle(startDeg, endDeg);
        const pos = polarToXY(CX, CY, OUTER_R + 35, mid);
        const isActive = activeCategory === cat;
        const isDimmed = phase !== 'idle' && !isActive;
        const accent = CATEGORY_ACCENTS[cat];

        return (
          <motion.button
            key={cat}
            className="absolute flex flex-col items-center gap-0.5 cursor-pointer select-none z-10"
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => onSelect(cat)}
            animate={{
              opacity: isDimmed ? 0.25 : 1,
              scale: isActive ? 1.08 : 1,
            }}
            whileHover={{ scale: isDimmed ? 1 : 1.12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <span
              className="text-lg"
              style={{ color: isActive ? accent : 'rgba(var(--fg),0.35)' }}
            >
              {CATEGORY_GLYPHS[cat]}
            </span>
            <span
              className="text-[0.55rem] font-bold tracking-[0.15em] uppercase whitespace-nowrap"
              style={{
                fontFamily: 'var(--font-primary)',
                color: isActive ? accent : 'rgba(var(--fg),0.4)',
                textShadow: isActive ? `0 0 12px ${accent}40` : 'none',
              }}
            >
              {cat}
            </span>
          </motion.button>
        );
      })}
    </>
  );
}

// ─── Middle Ring (Game Modes) ───────────────

interface MiddleRingProps {
  modes: GameModeEntry[];
  activeMode: GameModeEntry | null;
  activeCategory: GameCategory | null;
  onSelect: (mode: GameModeEntry) => void;
  phase: VaultPhase;
}

function MiddleRing({ modes, activeMode, activeCategory, onSelect, phase }: MiddleRingProps) {
  if (!activeCategory || modes.length === 0) return null;

  const accent = CATEGORY_ACCENTS[activeCategory];
  const arcSpan = 360 / modes.length - ARC_GAP;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeCategory}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* SVG arcs */}
        <svg
          className="absolute inset-0"
          viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}
          style={{ width: DIAL_SIZE, height: DIAL_SIZE }}
        >
          <defs>
            <filter id="glow-middle">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {modes.map((mode, i) => {
            const startDeg = i * (arcSpan + ARC_GAP) + ARC_GAP / 2;
            const endDeg = startDeg + arcSpan;
            const isActive = activeMode?.id === mode.id;
            const isDimmed = phase === 'mode-selected' && !isActive;
            const d = describeArc(CX, CY, MIDDLE_R, startDeg, endDeg);

            return (
              <g key={mode.id}>
                {/* Hit area */}
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={40}
                  strokeLinecap="round"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelect(mode)}
                />
                {/* Visible arc */}
                <motion.path
                  d={d}
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: isDimmed ? 0.25 : 1,
                    stroke: isActive ? accent : `${accent}66`,
                    strokeWidth: isActive ? 5 : 2.5,
                    filter: isActive ? 'url(#glow-middle)' : 'none',
                  }}
                  transition={{
                    pathLength: {
                      type: 'spring',
                      stiffness: 80,
                      damping: 18,
                      delay: i * 0.08,
                    },
                    opacity: { duration: 0.2, delay: i * 0.08 },
                    stroke: { type: 'spring', stiffness: 300, damping: 25 },
                    strokeWidth: { type: 'spring', stiffness: 300, damping: 25 },
                  }}
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            );
          })}
        </svg>

        {/* Mode labels */}
        {modes.map((mode, i) => {
          const startDeg = i * (arcSpan + ARC_GAP) + ARC_GAP / 2;
          const endDeg = startDeg + arcSpan;
          const mid = midAngle(startDeg, endDeg);
          const pos = polarToXY(CX, CY, MIDDLE_R + 28, mid);
          const isActive = activeMode?.id === mode.id;
          const isDimmed = phase === 'mode-selected' && !isActive;

          return (
            <motion.button
              key={mode.id}
              className="absolute flex flex-col items-center gap-0.5 cursor-pointer select-none z-10"
              style={{
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => onSelect(mode)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isDimmed ? 0.2 : 1,
                scale: isActive ? 1.1 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 25,
                delay: i * 0.06,
              }}
              whileHover={{ scale: isDimmed ? 1 : 1.15 }}
            >
              <span
                className="text-[0.6rem] font-semibold tracking-wide uppercase whitespace-nowrap"
                style={{
                  fontFamily: 'var(--font-primary)',
                  color: isActive ? accent : `${accent}99`,
                  textShadow: isActive ? `0 0 10px ${accent}50` : 'none',
                }}
              >
                {mode.name}
              </span>
              <span
                className="text-[0.45rem] tracking-wider whitespace-nowrap"
                style={{ color: isActive ? 'rgba(var(--fg),0.6)' : 'rgba(var(--fg),0.25)' }}
              >
                {mode.description}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Core Lock (Center) ─────────────────────

interface CoreLockProps {
  phase: VaultPhase;
  activeCategory: GameCategory | null;
  activeMode: GameModeEntry | null;
  onReset: () => void;
}

function CoreLock({ phase, activeCategory, activeMode, onReset }: CoreLockProps) {
  const state = phase === 'mode-selected' ? 'unlocked' : phase === 'category-selected' ? 'primed' : 'locked';
  const accent = activeCategory ? CATEGORY_ACCENTS[activeCategory] : '#333';

  return (
    <motion.button
      className="absolute z-20 rounded-full flex flex-col items-center justify-center cursor-pointer select-none"
      style={{
        width: CORE_R * 2,
        height: CORE_R * 2,
        left: CX - CORE_R,
        top: CY - CORE_R,
        background: 'rgba(10,10,15,0.9)',
        border: '2px solid',
        backdropFilter: 'blur(8px)',
      }}
      variants={coreLockVariants}
      animate={state}
      onClick={onReset}
      whileHover={state !== 'locked' ? { scale: 1.08 } : undefined}
    >
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div
            key="idle"
            className="flex flex-col items-center gap-1"
            variants={labelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <span
              className="text-[0.55rem] font-bold tracking-[0.2em] uppercase"
              style={{ fontFamily: 'var(--font-primary)', color: 'rgba(var(--fg),0.25)' }}
            >
              LOCKED
            </span>
          </motion.div>
        )}
        {phase === 'category-selected' && activeCategory && (
          <motion.div
            key="primed"
            className="flex flex-col items-center gap-1"
            variants={labelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <span className="text-xl" style={{ color: accent }}>
              {CATEGORY_GLYPHS[activeCategory]}
            </span>
            <span
              className="text-[0.45rem] font-semibold tracking-[0.15em] uppercase"
              style={{ fontFamily: 'var(--font-primary)', color: `${accent}aa` }}
            >
              SELECT MODE
            </span>
          </motion.div>
        )}
        {phase === 'mode-selected' && activeMode && (
          <motion.div
            key="unlocked"
            className="flex flex-col items-center gap-1"
            variants={labelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.span
              className="text-[0.65rem] font-black tracking-[0.2em] uppercase"
              style={{ fontFamily: 'var(--font-primary)', color: accent }}
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              LAUNCH
            </motion.span>
            <span
              className="text-[0.4rem] tracking-wider uppercase"
              style={{ color: 'rgba(var(--fg),0.4)' }}
            >
              {activeMode.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Difficulty Cards (Flying) ──────────────

interface DifficultyCardsProps {
  visible: boolean;
  activeMode: GameModeEntry | null;
  onLaunch: (difficulty: string) => void;
}

function DifficultyCards({ visible, activeMode, onLaunch }: DifficultyCardsProps) {
  if (!activeMode) return null;

  const cardPositions = [
    { x: -180, y: 80 },
    { x: 0, y: 80 },
    { x: 180, y: 80 },
  ];

  return (
    <div
      className="absolute z-30"
      style={{ left: CX, top: CY + OUTER_R + 30 }}
    >
      <AnimatePresence>
        {visible &&
          DIFFICULTIES.map((diff, i) => (
            <motion.button
              key={diff.key}
              className="absolute flex flex-col items-center justify-center gap-2 cursor-pointer select-none"
              style={{
                width: 140,
                height: 170,
                left: -70,
                top: -85,
                background: 'var(--bg-surface)',
                border: `2px solid ${diff.accent}`,
                boxShadow: 'var(--shadow-lg)',
              }}
              custom={i}
              variants={cardFlyVariants}
              initial="hidden"
              animate={{
                ...cardFlyVariants.visible(i),
                x: cardPositions[i].x,
                y: cardPositions[i].y,
              }}
              exit="exit"
              whileHover={{
                y: cardPositions[i].y - 12,
                boxShadow: 'var(--shadow-xl)',
                transition: { type: 'spring', stiffness: 400, damping: 20 },
              }}
              whileTap={{
                scale: [1, 0.88, 1.06, 1],
                transition: { duration: 0.3, times: [0, 0.3, 0.7, 1] },
              }}
              onClick={() => onLaunch(diff.key)}
            >
              {/* Geometric accent shape */}
              <div
                className="w-8 h-8 rotate-45"
                style={{
                  border: `2px solid ${diff.accent}`,
                  boxShadow: `0 0 12px ${diff.accent}30`,
                }}
              />
              <span
                className="text-[0.7rem] font-black tracking-[0.2em]"
                style={{
                  fontFamily: 'var(--font-primary)',
                  color: diff.accent,
                }}
              >
                {diff.label}
              </span>
              <span
                className="text-[0.5rem] tracking-[0.15em] uppercase"
                style={{ color: 'rgba(var(--fg),0.35)' }}
              >
                {diff.sublabel}
              </span>
            </motion.button>
          ))}
      </AnimatePresence>
    </div>
  );
}

// ─── State Breadcrumb ───────────────────────

interface BreadcrumbProps {
  phase: VaultPhase;
  activeCategory: GameCategory | null;
  activeMode: GameModeEntry | null;
}

function StateBreadcrumb({ phase, activeCategory, activeMode }: BreadcrumbProps) {
  const accent = activeCategory ? CATEGORY_ACCENTS[activeCategory] : '#666';

  return (
    <div className="h-8 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.p
            key="idle"
            className="text-[0.6rem] uppercase tracking-[0.3em]"
            style={{ color: 'rgba(var(--fg),0.2)', fontFamily: 'var(--font-primary)' }}
            variants={breadcrumbVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            Select a sector
          </motion.p>
        )}
        {phase === 'category-selected' && activeCategory && (
          <motion.p
            key={`cat-${activeCategory}`}
            className="text-[0.6rem] uppercase tracking-[0.2em] flex items-center gap-2"
            style={{ fontFamily: 'var(--font-primary)' }}
            variants={breadcrumbVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <span style={{ color: accent }}>{activeCategory}</span>
            <span style={{ color: 'rgba(var(--fg),0.15)' }}>{'>'}</span>
            <span style={{ color: 'rgba(var(--fg),0.25)' }}>???</span>
          </motion.p>
        )}
        {phase === 'mode-selected' && activeCategory && activeMode && (
          <motion.p
            key={`mode-${activeMode.id}`}
            className="text-[0.6rem] uppercase tracking-[0.2em] flex items-center gap-2"
            style={{ fontFamily: 'var(--font-primary)' }}
            variants={breadcrumbVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <span style={{ color: accent }}>{activeCategory}</span>
            <span style={{ color: 'rgba(var(--fg),0.15)' }}>{'>'}</span>
            <span style={{ color: accent }}>{activeMode.name}</span>
            <span style={{ color: 'rgba(var(--fg),0.15)' }}>{'>'}</span>
            <span
              style={{ color: 'rgba(var(--fg),0.4)' }}
              className="animate-pulse"
            >
              SELECT DIFFICULTY
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Responsive Scale Hook ──────────────────

function useDialScale(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setScale(Math.min(1, (w - 20) / DIAL_SIZE));
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  return scale;
}

// ─── Home Route ─────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = useDialScale(containerRef);

  const [phase, setPhase] = useState<VaultPhase>('idle');
  const [activeCategory, setActiveCategory] = useState<GameCategory | null>(null);
  const [activeMode, setActiveMode] = useState<GameModeEntry | null>(null);

  const modesForCategory = useMemo(
    () => (activeCategory ? GAME_MODES.filter((m) => m.category === activeCategory) : []),
    [activeCategory],
  );

  const selectCategory = useCallback((cat: GameCategory) => {
    setActiveCategory(cat);
    setActiveMode(null);
    setPhase('category-selected');
  }, []);

  const selectMode = useCallback((mode: GameModeEntry) => {
    setActiveMode(mode);
    setPhase('mode-selected');
  }, []);

  const resetToIdle = useCallback(() => {
    if (phase === 'mode-selected') {
      setActiveMode(null);
      setPhase('category-selected');
    } else {
      setActiveCategory(null);
      setActiveMode(null);
      setPhase('idle');
    }
  }, [phase]);

  const launchGame = useCallback(
    (difficulty: string) => {
      if (!activeMode) return;
      // Let squash animation play, then navigate
      setTimeout(() => {
        navigate(`/play/mode/${activeMode.id}?difficulty=${difficulty}`);
      }, 320);
    },
    [activeMode, navigate],
  );

  // Calculate total height needed (dial + cards below)
  const totalHeight = DIAL_SIZE + (phase === 'mode-selected' ? 280 : 40);

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      <CosmicBackground />

      <div ref={containerRef} className="relative z-10 w-full max-w-[700px] mx-auto px-4 py-8 sm:py-12">
        {/* ── Header ── */}
        <motion.header
          className="text-center mb-6 sm:mb-10 select-none"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.h1
            className="text-5xl sm:text-7xl font-black leading-none tracking-tighter"
            style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            NINE
          </motion.h1>
          <p
            className="text-[0.55rem] uppercase tracking-[0.4em] mt-2"
            style={{ color: 'rgba(var(--fg),0.25)', fontFamily: 'var(--font-primary)' }}
          >
            Select Your Protocol
          </p>
          <div className="w-16 h-px bg-white/10 mx-auto mt-3" />
        </motion.header>

        {/* ── Breadcrumb ── */}
        <StateBreadcrumb phase={phase} activeCategory={activeCategory} activeMode={activeMode} />

        {/* ── Vault Dial ── */}
        <div className="flex justify-center mt-4">
          <div
            className="relative"
            style={{
              width: DIAL_SIZE,
              height: totalHeight,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Decorative rings */}
            <svg
              className="absolute inset-0 pointer-events-none"
              viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}
              style={{ width: DIAL_SIZE, height: DIAL_SIZE }}
            >
              {/* Faint outer guide circle */}
              <circle
                cx={CX}
                cy={CY}
                r={OUTER_R}
                fill="none"
                stroke="rgba(var(--fg),0.03)"
                strokeWidth="1"
                strokeDasharray="4 8"
              />
              {/* Faint middle guide circle */}
              <motion.circle
                cx={CX}
                cy={CY}
                r={MIDDLE_R}
                fill="none"
                strokeWidth="1"
                strokeDasharray="3 6"
                animate={{
                  stroke: activeCategory
                    ? `${CATEGORY_ACCENTS[activeCategory]}15`
                    : 'rgba(var(--fg),0.02)',
                }}
                transition={{ duration: 0.4 }}
              />
              {/* Core guide circle */}
              <circle
                cx={CX}
                cy={CY}
                r={CORE_R + 8}
                fill="none"
                stroke="rgba(var(--fg),0.02)"
                strokeWidth="0.5"
              />
            </svg>

            {/* Interactive layers */}
            <OuterRing
              activeCategory={activeCategory}
              onSelect={selectCategory}
              phase={phase}
            />

            <MiddleRing
              modes={modesForCategory}
              activeMode={activeMode}
              activeCategory={activeCategory}
              onSelect={selectMode}
              phase={phase}
            />

            <CoreLock
              phase={phase}
              activeCategory={activeCategory}
              activeMode={activeMode}
              onReset={resetToIdle}
            />

            {/* Difficulty Cards */}
            <DifficultyCards
              visible={phase === 'mode-selected'}
              activeMode={activeMode}
              onLaunch={launchGame}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <motion.footer
          className="mt-8 flex flex-col items-center gap-3 select-none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: phase === 'mode-selected' ? `${280 * scale}px` : '2rem' }}
        >
          <div className="w-8 h-px bg-white/10" />
          <p
            className="text-[0.5rem] uppercase tracking-[0.3em]"
            style={{ color: 'rgba(var(--fg),0.12)', fontFamily: 'var(--font-primary)' }}
          >
            14 Modes · Zero Compromise
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
