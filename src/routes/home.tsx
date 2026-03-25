// ──────────────────────────────────────────────
// NINE — Grand Lobby (Mode Selector)
// ──────────────────────────────────────────────

import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ─── Types ──────────────────────────────────

type GameCategory = 'Core Systems' | 'The Cyphers' | 'The Archives' | 'The Matrices';

interface GameModeEntry {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
}

// ─── Mode Registry ──────────────────────────

const GAME_MODES: readonly GameModeEntry[] = [
  // Core Systems
  { id: 'prime-grid',      name: 'The Prime Grid',    description: 'Classic 9×9 logic. The original test.',          category: 'Core Systems' },
  { id: 'glyph-grid',      name: 'Glyph Grid',        description: 'Wordoku with diagonal constraints.',             category: 'Core Systems' },
  { id: 'shattered-grid',  name: 'Shattered Grid',    description: 'Reassemble fractured polyomino shards.',         category: 'Core Systems' },
  { id: 'canvas-fracture', name: 'Canvas Fracture',   description: 'Slide and rotate tiles into place.',             category: 'Core Systems' },

  // The Cyphers
  { id: 'vault-breaker',   name: 'Vault Breaker',     description: 'Crack the 5-letter code in 6 attempts.',         category: 'The Cyphers' },
  { id: 'cipher-scramble', name: 'Cipher Scramble',   description: 'Unscramble letters. Find every word.',           category: 'The Cyphers' },
  { id: 'lexicon-weave',   name: 'Lexicon Weave',     description: 'Crossword grid. Intersections are law.',         category: 'The Cyphers' },
  { id: 'enigma-weave',    name: 'Enigma Weave',      description: 'Cryptic crossword. Double meanings only.',       category: 'The Cyphers' },

  // The Archives
  { id: 'interrogation',   name: 'The Interrogation', description: 'Timed quiz. Multiplier decays every second.',    category: 'The Archives' },
  { id: 'alias-protocol',  name: 'Alias Protocol',    description: '5 clues. 3 guesses. Identify the subject.',      category: 'The Archives' },
  { id: 'global-override', name: 'Global Override',   description: 'Rapid-fire geo flash. Speed is everything.',     category: 'The Archives' },

  // The Matrices
  { id: 'data-sift',       name: 'Data Sift',         description: 'Find 4 that belong. Reject the noise.',          category: 'The Matrices' },
  { id: 'cinema-lattice',  name: 'Cinema Lattice',    description: 'Fill the actor–genre–decade matrix.',             category: 'The Matrices' },
  { id: 'chronos-shift',   name: 'Chronos Shift',     description: 'Sort events into chronological order.',           category: 'The Matrices' },
] as const;

const CATEGORY_ORDER: readonly GameCategory[] = [
  'Core Systems',
  'The Cyphers',
  'The Archives',
  'The Matrices',
];

const CATEGORY_ACCENTS: Record<GameCategory, string> = {
  'Core Systems': 'rgba(96, 165, 250, 0.7)',   // blue
  'The Cyphers':  'rgba(167, 139, 250, 0.7)',   // violet
  'The Archives': 'rgba(251, 191, 36, 0.7)',    // amber
  'The Matrices': 'rgba(52, 211, 153, 0.7)',    // emerald
};

// ─── Category Icon Glyphs ───────────────────

const CATEGORY_GLYPHS: Record<GameCategory, string> = {
  'Core Systems': '◈',
  'The Cyphers':  '⟁',
  'The Archives': '⧖',
  'The Matrices': '⬡',
};

// ─── Animation Variants ─────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
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

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

// ─── Background Grid ────────────────────────

function BackgroundGrid() {
  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="lobby-grid"
          width="60"
          height="60"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 60 0 L 0 0 0 60"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />
        </pattern>
        <radialGradient id="lobby-fade" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#lobby-grid)" />
      <rect width="100%" height="100%" fill="url(#lobby-fade)" />
    </svg>
  );
}

// ─── Scanline Decoration ────────────────────

function Scanlines() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1] opacity-[0.015]"
      aria-hidden="true"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
      }}
    />
  );
}

// ─── Mode Card ──────────────────────────────

interface ModeCardProps {
  mode: GameModeEntry;
  accent: string;
  index: number;
  onClick: () => void;
}

function ModeCard({ mode, accent, index, onClick }: ModeCardProps) {
  return (
    <motion.button
      className={clsx(
        'group relative flex flex-col items-start gap-3',
        'rounded-xl p-5 text-left w-full',
        'border border-white/[0.06]',
        'bg-white/[0.02] backdrop-blur-sm',
        'cursor-pointer outline-none',
        'focus-visible:ring-1 focus-visible:ring-white/20',
      )}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20px' }}
      whileHover={{
        scale: 1.02,
        borderColor: 'rgba(255,255,255,0.3)',
        transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-label={`Play ${mode.name}`}
    >
      {/* Accent glow on hover */}
      <div
        className={clsx(
          'absolute inset-0 rounded-xl opacity-0',
          'group-hover:opacity-100 transition-opacity duration-300',
        )}
        style={{
          background: `radial-gradient(ellipse at 30% 0%, ${accent}, transparent 70%)`,
          opacity: 0,
        }}
      />
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at 30% 0%, ${accent}, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between w-full">
          <h3
            className={clsx(
              'text-[0.9rem] font-bold tracking-wide',
              'text-white/90 group-hover:text-white',
              'transition-colors duration-150',
            )}
          >
            {mode.name}
          </h3>
          <motion.span
            className="text-[0.65rem] text-white/20 group-hover:text-white/50 transition-colors duration-150"
            aria-hidden="true"
          >
            →
          </motion.span>
        </div>
        <p className="text-[0.75rem] leading-relaxed text-white/35 group-hover:text-white/50 transition-colors duration-150">
          {mode.description}
        </p>
      </div>

      {/* Bottom accent line */}
      <div
        className={clsx(
          'absolute bottom-0 left-4 right-4 h-px',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity duration-300',
        )}
        style={{ background: accent }}
      />
    </motion.button>
  );
}

// ─── Home Route ─────────────────────────────

export default function Home() {
  const navigate = useNavigate();

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    modes: GAME_MODES.filter((m) => m.category === category),
  }));

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <BackgroundGrid />
      <Scanlines />

      <div className="relative z-10 max-w-5xl mx-auto px-5 py-16 sm:py-24">
        {/* ── Header ── */}
        <motion.header
          className="flex flex-col items-center gap-4 mb-20 select-none"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.h1
            className="text-[5rem] sm:text-[6.5rem] font-black leading-none tracking-tighter text-white"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            NINE
          </motion.h1>
          <p className="text-[0.6rem] uppercase tracking-[0.4em] font-medium text-white/30">
            Logic · Deduction · Spatial · Trivia
          </p>
          <div className="w-16 h-px bg-white/10 mt-2" />
        </motion.header>

        {/* ── Category Sections ── */}
        <div className="flex flex-col gap-16">
          {grouped.map(({ category, modes }, sectionIndex) => (
            <motion.section
              key={category}
              custom={sectionIndex}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="text-base opacity-40"
                  style={{ color: CATEGORY_ACCENTS[category] }}
                  aria-hidden="true"
                >
                  {CATEGORY_GLYPHS[category]}
                </span>
                <h2
                  className="text-xs font-semibold uppercase"
                  style={{
                    letterSpacing: '0.2em',
                    color: CATEGORY_ACCENTS[category],
                  }}
                >
                  {category}
                </h2>
                <div
                  className="flex-1 h-px opacity-20"
                  style={{ background: CATEGORY_ACCENTS[category] }}
                />
              </div>

              {/* Mode Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {modes.map((mode, cardIndex) => (
                  <ModeCard
                    key={mode.id}
                    mode={mode}
                    accent={CATEGORY_ACCENTS[category]}
                    index={cardIndex}
                    onClick={() => navigate(`/play/${mode.id}`)}
                  />
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* ── Footer ── */}
        <motion.footer
          className="mt-24 flex flex-col items-center gap-3 select-none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-8 h-px bg-white/10" />
          <p className="text-[0.55rem] uppercase tracking-[0.3em] text-white/15">
            14 Modes · Zero Compromise
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
