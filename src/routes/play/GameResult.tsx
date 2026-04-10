// ──────────────────────────────────────────────
// S-15 — Game Result (Premium Post-Game)
//
// Victory / Defeat with mode color, animated score
// counter, rank progression, trophy/XP breakdown.
// ──────────────────────────────────────────────

import { useParams, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { getModeById } from '../../lib/gameModesData';

// ─── Mode colors ───────────────────────────

const MODE_COLORS: Record<string, string> = {
  'prime-grid': '#4338CA', 'glyph-grid': '#0F766E', 'shattered-grid': '#B91C1C',
  'canvas-fracture': '#9333EA', 'vault-breaker': '#DB2777', 'cipher-scramble': '#F59E0B',
  'lexicon-weave': '#1E40AF', 'enigma-weave': '#7C2D12', 'interrogation': '#EA580C',
  'alias-protocol': '#E11D48', 'global-override': '#047857', 'data-sift': '#FACC15',
  'cinema-lattice': '#0369A1', 'chronos-shift': '#78350F',
};

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// Mock data (real data will come from API)
const MOCK_XP = 320;
const MOCK_RANK_BEFORE = 'Recruit III';
const MOCK_RANK_AFTER = 'Operative I';

export default function GameResult() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const modeId = searchParams.get('mode') ?? 'prime-grid';
  const outcome = searchParams.get('outcome') ?? 'win';
  const score = parseInt(searchParams.get('score') ?? '1250', 10);
  const mode = getModeById(modeId);
  const color = MODE_COLORS[modeId] ?? '#6C63FF';

  const isWin = outcome === 'win';

  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

      {/* ── Outcome Banner ── */}
      <motion.div
        className="relative overflow-hidden"
        style={{
          background: isWin ? color : '#DC2626',
          padding: '48px 24px 36px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Watermark */}
        <div
          className="absolute -right-6 -top-4 select-none pointer-events-none"
          style={{
            fontSize: '200px',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            opacity: 0.06,
            color: '#fff',
            lineHeight: 1,
          }}
        >
          {isWin ? '⚡' : '✕'}
        </div>

        <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />

        {/* Particles on win */}
        {isWin && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 3 + (i % 3) * 2,
                  height: 3 + (i % 3) * 2,
                  background: '#fff',
                  left: `${8 + i * 7.5}%`,
                  top: '-5%',
                }}
                animate={{ y: ['0%', '800%'], opacity: [0.6, 0], x: [0, (i % 2 === 0 ? 20 : -20)] }}
                transition={{ duration: 2.5 + i * 0.3, delay: 0.3 + i * 0.1, repeat: Infinity, repeatDelay: 3 }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 text-center">
          {/* Outcome glyph */}
          <motion.div
            className="text-5xl mb-4"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
          >
            {isWin ? '⚡' : '✕'}
          </motion.div>

          {/* Victory / Defeat */}
          <motion.h1
            className="text-4xl font-black uppercase tracking-[0.08em] mb-2"
            style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ease: EASE }}
          >
            {isWin ? 'Victory' : 'Defeat'}
          </motion.h1>

          <motion.p
            className="text-[0.6rem] font-semibold uppercase tracking-[0.15em]"
            style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {mode?.name ?? modeId} · Match #{gameId?.slice(-6) ?? '------'}
          </motion.p>
        </div>
      </motion.div>

      {/* ── Content ── */}
      <div className="w-full max-w-lg mx-auto px-5 py-6 flex flex-col gap-5">

        {/* Score */}
        <motion.div
          className="text-center py-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, ease: EASE }}
        >
          <motion.span
            className="text-5xl font-black tabular-nums"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
          >
            {score.toLocaleString()}
          </motion.span>
          <p
            className="text-[0.55rem] font-semibold uppercase tracking-[0.15em] mt-1"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            Final Score
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-3 gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, ease: EASE }}
        >
          <StatTile label="XP Earned" value={`+${MOCK_XP}`} color={color} />
          <StatTile label="Trophies" value={isWin ? '+25' : '-12'} color={isWin ? '#34C759' : '#EF4444'} />
          <StatTile label="Time" value="4:32" color="var(--text-secondary)" />
        </motion.div>

        {/* Rank progression */}
        <motion.div
          className="flex items-center justify-center gap-3 py-4 px-5"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, ease: EASE }}
        >
          <span
            className="text-[0.6rem] font-semibold"
            style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            {MOCK_RANK_BEFORE}
          </span>
          <motion.span
            className="text-sm"
            style={{ color: color }}
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            →
          </motion.span>
          <span
            className="text-[0.6rem] font-bold"
            style={{ color: color, fontFamily: 'var(--font-display)' }}
          >
            {MOCK_RANK_AFTER}
          </span>
          <span
            className="text-[0.5rem] font-bold uppercase tracking-[0.1em] px-2 py-0.5"
            style={{
              background: `${color}12`,
              color: color,
              border: `1px solid ${color}25`,
              borderRadius: 'var(--radius-full)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Rank Up!
          </span>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col gap-3 pt-2 pb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, ease: EASE }}
        >
          {/* Rematch */}
          <motion.button
            className="w-full py-4 cursor-pointer relative overflow-hidden"
            style={{
              background: color,
              border: 'none',
              borderRadius: 'var(--radius-md)',
            }}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/play/matchmaking?mode=${modeId}`)}
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              <span className="text-lg" style={{ lineHeight: 1 }}>⚡</span>
              <span
                className="text-[0.8rem] font-black uppercase tracking-[0.08em]"
                style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
              >
                Rematch
              </span>
            </div>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
              }}
            />
          </motion.button>

          {/* Review */}
          <motion.button
            className="w-full py-3.5 cursor-pointer"
            style={{
              background: 'none',
              border: '2px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
            }}
            whileHover={{ y: -1, borderColor: color }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/play/review/${gameId}?mode=${modeId}`)}
          >
            <span
              className="text-[0.75rem] font-bold uppercase tracking-[0.08em]"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Review Game
            </span>
          </motion.button>

          {/* Play Hub */}
          <motion.button
            className="w-full py-3 cursor-pointer"
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-body)',
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/play')}
          >
            <span
              className="text-[0.7rem] font-semibold"
              style={{ color: 'var(--text-tertiary)' }}
            >
              ← Back to Play Hub
            </span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Stat Tile ─────────────────────────────

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center py-4"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <span
        className="text-lg font-black tabular-nums"
        style={{ fontFamily: 'var(--font-numeric)', color }}
      >
        {value}
      </span>
      <span
        className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] mt-0.5"
        style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </span>
    </div>
  );
}
