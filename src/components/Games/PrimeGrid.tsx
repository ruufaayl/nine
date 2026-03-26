// ──────────────────────────────────────────────
// NINE — Prime Grid Hub (Solo / PvP Selector)
// ──────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import clsx from 'clsx';
import { GameScreen } from '../Game/GameScreen';
import { RaceMode } from './RaceMode';

// ─── Types ──────────────────────────────────

type Variant = 'menu' | 'solo-classic' | 'pvp-race';

interface PrimeGridProps {
  onExit: () => void;
}

// ─── Animation Variants ─────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

// ─── Protocol Card ──────────────────────────

interface ProtocolCardProps {
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  glyph: string;
  index: number;
  tag?: string;
  onClick: () => void;
}

function ProtocolCard({
  title,
  subtitle,
  description,
  accent,
  glyph,
  index,
  tag,
  onClick,
}: ProtocolCardProps) {
  return (
    <motion.button
      className={clsx(
        'group relative flex flex-col items-start gap-4',
        'rounded-2xl p-7 text-left w-full max-w-sm',
        'border border-white/[0.06]',
        'bg-white/[0.02] backdrop-blur-sm',
        'cursor-pointer outline-none',
        'focus-visible:ring-1 focus-visible:ring-white/20',
      )}
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.03,
        borderColor: 'rgba(255,255,255,0.25)',
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Accent glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at 30% 0%, ${accent}, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-3 w-full">
        {/* Top row: glyph + tag */}
        <div className="flex items-center justify-between w-full">
          <span className="text-2xl opacity-50" style={{ color: accent }}>
            {glyph}
          </span>
          {tag && (
            <span
              className="text-[0.5rem] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-full"
              style={{
                color: accent,
                background: `${accent}15`,
                border: `1px solid ${accent}30`,
              }}
            >
              {tag}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-black tracking-wide text-white/90 group-hover:text-white transition-colors">
            {title}
          </h3>
          <span
            className="text-[0.6rem] uppercase tracking-[0.2em] font-semibold"
            style={{ color: accent, opacity: 0.6 }}
          >
            {subtitle}
          </span>
        </div>

        <p className="text-[0.75rem] leading-relaxed text-white/30 group-hover:text-white/50 transition-colors">
          {description}
        </p>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: accent }}
      />
    </motion.button>
  );
}

// ─── Main Component ─────────────────────────

export function PrimeGrid({ onExit }: PrimeGridProps) {
  const [variant, setVariant] = useState<Variant>('menu');

  const goToMenu = useCallback(() => setVariant('menu'), []);

  // ── Solo Mode ──
  if (variant === 'solo-classic') {
    return (
      <GameScreen
        difficulty="medium"
        characterId="jade-serpent"
        mode="classic"
        onExit={goToMenu}
      />
    );
  }

  // ── PvP Race ──
  if (variant === 'pvp-race') {
    return <RaceMode onExit={goToMenu} />;
  }

  // ── Menu ──
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white overflow-hidden px-5">
      {/* Background grid */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        aria-hidden="true"
      >
        <defs>
          <pattern id="pg-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pg-grid)" />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 max-w-2xl w-full">
        {/* Header */}
        <motion.header
          className="flex flex-col items-center gap-3 select-none"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1
            className="text-5xl sm:text-6xl font-black tracking-tight text-white"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            PRIME GRID
          </motion.h1>
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-white/25">
            Select your protocol
          </p>
          <div className="w-12 h-px bg-white/10 mt-1" />
        </motion.header>

        {/* Protocol Cards */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <ProtocolCard
            title="Solo Protocol"
            subtitle="Classic 9×9"
            description="Solve the grid at your own pace. No pressure, no opponent — pure logic against the numbers."
            accent="rgba(96, 165, 250, 0.8)"
            glyph="◈"
            index={0}
            onClick={() => setVariant('solo-classic')}
          />
          <ProtocolCard
            title="Live Match"
            subtitle="1v1 Race"
            description="Connect to the Valkey matchmaker. First to solve wins. You'll see your opponent's ghost progress in real time."
            accent="rgba(168, 85, 247, 0.8)"
            glyph="⚡"
            index={1}
            tag="PvP"
            onClick={() => setVariant('pvp-race')}
          />
        </div>

        {/* Back */}
        <motion.button
          className="text-[0.6rem] uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
          whileTap={{ scale: 0.95 }}
          onClick={onExit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          ← Back to Grand Lobby
        </motion.button>
      </div>
    </div>
  );
}
