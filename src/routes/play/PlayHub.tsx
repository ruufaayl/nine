// ──────────────────────────────────────────────
// S-09 — Play Hub (Liquid Design)
// ──────────────────────────────────────────────

import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  GAME_MODES,
  CATEGORY_ACCENTS,
  type GameModeEntry,
} from '../../lib/gameModesData';

// ─── Mode Card ──────────────────────────────

interface ModeCardProps {
  mode: GameModeEntry;
  index: number;
  onClick: () => void;
}

function ModeCard({ mode, index, onClick }: ModeCardProps) {
  const accent = CATEGORY_ACCENTS[mode.category];

  return (
    <motion.button
      className="relative text-left w-full cursor-pointer select-none group outline-none"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
    >
      <div
        className="relative overflow-hidden p-5 transition-all duration-200 group-hover:-translate-y-0.5"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Accent glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 30% 0%, ${accent}08, transparent 70%)`,
            borderRadius: 'var(--radius-lg)',
          }}
        />

        {/* Category dot */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: accent }}
          />
          <span
            className="text-[0.6rem] font-semibold uppercase tracking-wider"
            style={{ color: `${accent}99`, fontFamily: 'var(--font-primary)' }}
          >
            {mode.category}
          </span>
        </div>

        {/* Mode name */}
        <h3
          className="text-sm font-bold mb-1.5"
          style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
        >
          {mode.name}
        </h3>

        {/* Description */}
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {mode.description}
        </p>

        {/* Meta */}
        <div
          className="flex items-center gap-3 mt-3 pt-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <span className="text-[0.6rem] font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {mode.playerCount}
          </span>
          <span className="text-[0.6rem] font-medium" style={{ color: 'var(--text-tertiary)' }}>
            ~{mode.avgDuration}
          </span>
        </div>

        {/* Hover arrow */}
        <span
          className="absolute top-5 right-4 text-sm opacity-0 group-hover:opacity-40 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          →
        </span>

        {/* Hover border */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{
            border: `1px solid ${accent}25`,
            borderRadius: 'var(--radius-lg)',
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
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.header
          className="mb-8 select-none"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
          >
            Play
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Choose a game mode • 14 modes available
          </p>
        </motion.header>

        {/* Mode Grid */}
        <div
          className="grid gap-3"
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
      </div>
    </div>
  );
}
