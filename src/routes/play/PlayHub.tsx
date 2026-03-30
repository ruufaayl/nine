// ──────────────────────────────────────────────
// S-09 — Play Hub (14-mode grid)
// ──────────────────────────────────────────────

import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  GAME_MODES,
  CATEGORY_ACCENTS,
  CATEGORY_GLYPHS,
  type GameModeEntry,
} from '../../lib/gameModesData';

// ─── Cosmic Background ──────────────────────

function CosmicBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #12091f 0%, #0a0a0f 50%, #060609 100%)',
        }}
      />
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="hub-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hub-grid)" />
      </svg>
      <div
        className="absolute"
        style={{
          top: '25%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100,0,180,0.05) 0%, transparent 70%)',
          animation: 'pulse-glow 8s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// ─── Mode Card ──────────────────────────────

interface ModeCardProps {
  mode: GameModeEntry;
  index: number;
  onClick: () => void;
}

function ModeCard({ mode, index, onClick }: ModeCardProps) {
  const accent = CATEGORY_ACCENTS[mode.category];
  const glyph = CATEGORY_GLYPHS[mode.category];

  return (
    <motion.button
      className="relative text-left w-full cursor-pointer select-none group"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      onClick={onClick}
    >
      {/* Card body */}
      <div
        className="relative overflow-hidden px-5 py-5 transition-transform duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
        style={{
          background: '#0c0c14',
          border: `2px solid ${accent}`,
          boxShadow: `4px 4px 0px ${accent}`,
        }}
      >
        {/* Category badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-sm" style={{ color: accent }}>{glyph}</span>
          <span
            className="text-[0.45rem] font-bold uppercase tracking-[0.2em]"
            style={{ color: `${accent}88` }}
          >
            {mode.category}
          </span>
        </div>

        {/* Mode name */}
        <h3
          className="text-sm font-black uppercase tracking-[0.1em] mb-1.5"
          style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
        >
          {mode.name}
        </h3>

        {/* Description */}
        <p className="text-[0.65rem] leading-relaxed text-white/35">
          {mode.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.06]">
          <span className="text-[0.5rem] uppercase tracking-widest text-white/20">
            {mode.playerCount}
          </span>
          <span className="text-[0.5rem] uppercase tracking-widest text-white/20">
            ~{mode.avgDuration}
          </span>
        </div>

        {/* Hover arrow */}
        <motion.span
          className="absolute top-5 right-4 text-sm opacity-0 group-hover:opacity-60 transition-opacity"
          style={{ color: accent }}
        >
          →
        </motion.span>

        {/* Corner accent */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4"
          style={{
            background: `linear-gradient(135deg, transparent 50%, ${accent}30 50%)`,
          }}
        />
      </div>
    </motion.button>
  );
}

// ─── Play Hub ───────────────────────────────

export default function PlayHub() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen text-white">
      <CosmicBg />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.header
          className="text-center mb-10 select-none"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-3xl sm:text-4xl font-black tracking-[0.15em] uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Play Hub
          </h1>
          <p
            className="text-[0.55rem] uppercase tracking-[0.4em] mt-2 text-white/25"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Choose Your Protocol · 14 Modes
          </p>
          <div className="w-16 h-px bg-white/10 mx-auto mt-3" />
        </motion.header>

        {/* Mode Grid */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          }}
        >
          {GAME_MODES.map((mode, i) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              index={i}
              onClick={() => navigate(`/play/mode/${mode.id}`)}
            />
          ))}
        </div>

        {/* Footer */}
        <motion.div
          className="mt-12 flex flex-col items-center gap-3 select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="w-8 h-px bg-white/10" />
          <p
            className="text-[0.5rem] uppercase tracking-[0.3em] text-white/12"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            NINE Protocol · Quick Play
          </p>
        </motion.div>
      </div>
    </div>
  );
}
