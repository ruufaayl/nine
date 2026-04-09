// ──────────────────────────────────────────────
// S-15 — Game Result (post-game screen)
// ──────────────────────────────────────────────

import { useParams, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { getModeById, CATEGORY_ACCENTS } from '../../lib/gameModesData';

// ─── Constants ──────────────────────────────

const MOCK_XP_EARNED = 320;
const MOCK_RANK_BEFORE = 'Recruit III';
const MOCK_RANK_AFTER = 'Operative I';

// ─── Stat Card ──────────────────────────────

function StatCard({
  label, value, accent, delay = 0,
}: {
  label: string; value: string; accent: string; delay?: number;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1.5 py-4 px-3"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <span
        className="text-lg font-black tabular-nums"
        style={{ fontFamily: 'var(--font-primary)', color: accent }}
      >
        {value}
      </span>
      <span className="text-[0.45rem] uppercase tracking-[0.25em] text-white/25">
        {label}
      </span>
    </motion.div>
  );
}

// ─── Game Result ────────────────────────────

export default function GameResult() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const modeId = searchParams.get('mode') ?? 'prime-grid';
  const outcome = searchParams.get('outcome') ?? 'win';
  const score = parseInt(searchParams.get('score') ?? '1250', 10);
  const mode = getModeById(modeId);
  const accent = mode ? CATEGORY_ACCENTS[mode.category] : '#00FFFF';

  const isWin = outcome === 'win';
  const outcomeColor = isWin ? accent : '#ff6b6b';

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'var(--bg-primary)',
        }}
      />

      {/* Win celebration particles */}
      {isWin && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: accent,
                left: `${15 + i * 10}%`,
                top: '-5%',
              }}
              animate={{
                y: ['0vh', '110vh'],
                x: [0, (i % 2 === 0 ? 30 : -30)],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 3 + i * 0.4,
                delay: 0.5 + i * 0.15,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Outcome Banner */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {/* Outcome glyph */}
          <motion.span
            className="text-6xl block mb-4"
            animate={isWin
              ? { rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }
              : { opacity: [0.5, 1, 0.5] }
            }
            transition={isWin
              ? { delay: 0.3, duration: 0.6 }
              : { duration: 2, repeat: Infinity }
            }
          >
            {isWin ? '⚡' : '✕'}
          </motion.span>

          {/* Outcome text */}
          <h1
            className="text-4xl sm:text-5xl font-black uppercase tracking-[0.15em] mb-2"
            style={{
              fontFamily: 'var(--font-primary)',
              color: outcomeColor,
              textShadow: `0 0 40px ${outcomeColor}40`,
            }}
          >
            {isWin ? 'Victory' : 'Defeat'}
          </h1>

          <p className="text-[0.55rem] uppercase tracking-[0.3em] text-white/25">
            {mode?.name ?? modeId} · Match #{gameId?.slice(-6) ?? '------'}
          </p>
        </motion.div>

        {/* Score display */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span
            className="text-5xl font-black tabular-nums"
            style={{
              fontFamily: 'var(--font-primary)',
              color: '#fff',
              textShadow: `0 0 20px ${accent}30`,
            }}
          >
            {score.toLocaleString()}
          </span>
          <p className="text-[0.5rem] uppercase tracking-[0.3em] text-white/25 mt-1">
            Final Score
          </p>
        </motion.div>

        {/* Stats grid */}
        <div
          className="grid grid-cols-3 gap-3 w-full max-w-sm mb-8"
        >
          <StatCard label="XP Earned" value={`+${MOCK_XP_EARNED}`} accent={accent} delay={0.4} />
          <StatCard label="Delta" value={isWin ? '+25' : '-12'} accent={outcomeColor} delay={0.5} />
          <StatCard label="Time" value="4:32" accent="rgba(255,255,255,0.5)" delay={0.6} />
        </div>

        {/* Rank change */}
        <motion.div
          className="flex items-center gap-3 mb-10 px-5 py-3"
          style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${accent}20`,
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <span className="text-[0.5rem] uppercase tracking-widest text-white/30">
            {MOCK_RANK_BEFORE}
          </span>
          <motion.span
            className="text-sm"
            style={{ color: accent }}
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            →
          </motion.span>
          <span
            className="text-[0.5rem] font-bold uppercase tracking-widest"
            style={{ color: accent }}
          >
            {MOCK_RANK_AFTER}
          </span>
          <span
            className="text-[0.45rem] uppercase tracking-widest px-2 py-0.5 ml-1"
            style={{
              background: `${accent}15`,
              color: accent,
              border: `1px solid ${accent}30`,
            }}
          >
            Rank Up!
          </span>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.button
            className="flex-1 py-3.5 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer"
            style={{
              fontFamily: 'var(--font-primary)',
              background: accent,
              color: 'var(--bg-primary)',
              boxShadow: 'var(--shadow-md)',
            }}
            whileHover={{ boxShadow: 'var(--shadow-lg)', y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/play/matchmaking?mode=${modeId}`)}
          >
            Rematch
          </motion.button>

          <motion.button
            className="flex-1 py-3.5 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer"
            style={{
              fontFamily: 'var(--font-primary)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: 'var(--shadow-sm)',
            }}
            whileHover={{ borderColor: 'rgba(255,255,255,0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/play')}
          >
            Play Hub
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
