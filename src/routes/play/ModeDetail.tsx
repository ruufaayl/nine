// ──────────────────────────────────────────────
// S-10 — Mode Detail (rules + Find Match CTA)
// ──────────────────────────────────────────────

import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { getModeById, CATEGORY_ACCENTS, CATEGORY_GLYPHS } from '../../lib/gameModesData';

export default function ModeDetail() {
  const { modeId } = useParams<{ modeId: string }>();
  const navigate = useNavigate();
  const mode = getModeById(modeId ?? '');

  if (!mode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-white/50">
        <span className="text-6xl">⚠</span>
        <p className="text-sm uppercase tracking-widest">Mode not found</p>
        <button
          className="text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
          onClick={() => navigate('/play')}
        >
          ← Back to Play Hub
        </button>
      </div>
    );
  }

  const accent = CATEGORY_ACCENTS[mode.category];
  const glyph = CATEGORY_GLYPHS[mode.category];

  return (
    <div className="relative min-h-screen text-white">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #12091f 0%, #0a0a0f 50%, #060609 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-5 py-8">
        {/* Back nav */}
        <motion.button
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors mb-8"
          onClick={() => navigate('/play')}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileTap={{ scale: 0.96 }}
        >
          ← Play Hub
        </motion.button>

        {/* Mode Card */}
        <motion.div
          className="relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            background: '#0c0c14',
            border: `2px solid ${accent}`,
            boxShadow: `6px 6px 0px ${accent}`,
          }}
        >
          {/* Header section */}
          <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl" style={{ color: accent }}>{glyph}</span>
              <span
                className="text-[0.5rem] font-bold uppercase tracking-[0.25em]"
                style={{ color: `${accent}88` }}
              >
                {mode.category}
              </span>
            </div>

            <h1
              className="text-2xl sm:text-3xl font-black uppercase tracking-[0.12em] mb-2"
              style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
            >
              {mode.name}
            </h1>

            <p className="text-sm text-white/40 leading-relaxed">
              {mode.description}
            </p>

            {/* Meta chips */}
            <div className="flex items-center gap-3 mt-4">
              <span
                className="text-[0.5rem] font-bold uppercase tracking-[0.15em] px-3 py-1"
                style={{
                  border: `1px solid ${accent}40`,
                  color: accent,
                  background: `${accent}08`,
                }}
              >
                {mode.playerCount}
              </span>
              <span
                className="text-[0.5rem] font-bold uppercase tracking-[0.15em] px-3 py-1"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                ~{mode.avgDuration}
              </span>
            </div>
          </div>

          {/* Rules section */}
          <div className="px-6 py-5">
            <h2
              className="text-[0.6rem] font-bold uppercase tracking-[0.25em] mb-4"
              style={{ color: `${accent}99`, fontFamily: 'var(--font-display)' }}
            >
              Rules of Engagement
            </h2>

            <ol className="space-y-3">
              {mode.rules.map((rule, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                >
                  <span
                    className="text-[0.55rem] font-black tabular-nums mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center"
                    style={{
                      color: accent,
                      border: `1px solid ${accent}30`,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs text-white/50 leading-relaxed">
                    {rule}
                  </span>
                </motion.li>
              ))}
            </ol>
          </div>

          {/* Corner accents */}
          <div
            className="absolute top-0 right-0 w-6 h-6"
            style={{ background: `linear-gradient(225deg, ${accent}20, transparent 50%)` }}
          />
          <div
            className="absolute bottom-0 left-0 w-6 h-6"
            style={{ background: `linear-gradient(45deg, ${accent}20, transparent 50%)` }}
          />
        </motion.div>

        {/* Find Match CTA */}
        <motion.div
          className="mt-8 flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <motion.button
            className="w-full max-w-sm py-4 text-sm font-black uppercase tracking-[0.2em] cursor-pointer"
            style={{
              fontFamily: 'var(--font-display)',
              background: accent,
              color: '#0a0a0f',
              border: 'none',
              boxShadow: `4px 4px 0px #fff`,
            }}
            whileHover={{
              boxShadow: `6px 6px 0px #fff, 0 0 30px ${accent}40`,
              y: -2,
            }}
            whileTap={{ scale: 0.97, boxShadow: `2px 2px 0px #fff` }}
            onClick={() => navigate(`/play/matchmaking?mode=${modeId}`)}
          >
            Find Match
          </motion.button>

          <button
            className="text-[0.55rem] uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors"
            onClick={() => navigate('/play')}
          >
            Cancel
          </button>
        </motion.div>
      </div>
    </div>
  );
}
