// ──────────────────────────────────────────────
// S-10 — Mode Detail (Liquid Design + Offline/PvP)
// ──────────────────────────────────────────────

import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { getModeById, CATEGORY_ACCENTS } from '../../lib/gameModesData';
import { ENTRY_FEES } from '../../lib/economy';

export default function ModeDetail() {
  const { modeId } = useParams<{ modeId: string }>();
  const navigate = useNavigate();
  const mode = getModeById(modeId ?? '');

  if (!mode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="text-5xl">🔍</span>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Mode not found</p>
        <button
          className="text-sm font-medium cursor-pointer"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}
          onClick={() => navigate('/play')}
        >
          ← Back to Play
        </button>
      </div>
    );
  }

  const accent = CATEGORY_ACCENTS[mode.category];
  const entryFee = ENTRY_FEES['medium']; // default

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="relative z-10 w-full max-w-xl mx-auto px-5 py-8">
        {/* Back */}
        <motion.button
          className="flex items-center gap-2 text-sm font-medium mb-6 cursor-pointer"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}
          onClick={() => navigate('/play')}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ color: 'var(--text-secondary)' }}
          whileTap={{ scale: 0.96 }}
        >
          ← Play
        </motion.button>

        {/* Mode Card */}
        <motion.div
          className="overflow-hidden mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
              <span className="text-xs font-semibold" style={{ color: `${accent}99` }}>
                {mode.category}
              </span>
            </div>

            <h1
              className="text-2xl font-extrabold tracking-tight mb-2"
              style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
            >
              {mode.name}
            </h1>

            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              {mode.description}
            </p>

            <div className="flex items-center gap-2 mt-4">
              <span className="pill pill-accent">{mode.playerCount}</span>
              <span className="pill" style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-tertiary)',
              }}>
                ~{mode.avgDuration}
              </span>
            </div>
          </div>

          {/* Rules */}
          <div className="px-6 py-5">
            <h2
              className="text-xs font-semibold mb-4"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}
            >
              How to Play
            </h2>

            <ol className="space-y-3">
              {mode.rules.map((rule, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                >
                  <span
                    className="text-xs font-bold mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center"
                    style={{
                      color: accent,
                      background: `${accent}12`,
                      borderRadius: 'var(--radius-xs)',
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {rule}
                  </span>
                </motion.li>
              ))}
            </ol>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {/* Play Offline */}
          <motion.button
            className="group w-full flex items-center gap-4 p-5 text-left cursor-pointer outline-none"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              fontFamily: 'var(--font-primary)',
            }}
            whileHover={{
              background: 'var(--bg-card-hover)',
              borderColor: 'var(--border-default)',
              y: -1,
            }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate(`/play/game/offline-${Date.now().toString(36)}?mode=${modeId}`)}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(78, 205, 196, 0.1)',
                border: '1px solid rgba(78, 205, 196, 0.2)',
              }}
            >
              <span className="text-lg">🧩</span>
            </div>
            <div>
              <span className="text-sm font-bold block" style={{ color: 'var(--text-primary)' }}>
                Play Offline
              </span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Solo mode • No entry fee
              </span>
            </div>
            <span className="ml-auto text-base opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
              →
            </span>
          </motion.button>

          {/* Play PvP */}
          <motion.button
            className="group w-full flex items-center gap-4 p-5 text-left cursor-pointer outline-none"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              fontFamily: 'var(--font-primary)',
            }}
            whileHover={{
              background: 'var(--bg-card-hover)',
              borderColor: 'var(--border-default)',
              y: -1,
            }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate(`/play/matchmaking?mode=${modeId}`)}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(108, 99, 255, 0.1)',
                border: '1px solid rgba(108, 99, 255, 0.2)',
              }}
            >
              <span className="text-lg">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Play PvP
                </span>
                <span className="pill pill-accent" style={{ fontSize: '0.55rem', padding: '2px 6px' }}>
                  1v1
                </span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Search for opponent • Entry: {entryFee} coins
              </span>
            </div>
            <span className="ml-auto text-base opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: 'var(--text-secondary)' }}>
              →
            </span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
