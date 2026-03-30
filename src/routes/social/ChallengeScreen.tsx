// ──────────────────────────────────────────────
// S-21 — Challenge Screen
// Pick mode, difficulty, optional wager → send
// ──────────────────────────────────────────────

import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { GAME_MODES, CATEGORY_ACCENTS } from '../../lib/gameModesData';

// ─── Social Accent ──────────────────────────

const SOCIAL = '#3eb8cf';

// ─── Difficulties ───────────────────────────

const DIFFICULTIES = [
  { id: 'trainee', label: 'Trainee', accent: 'var(--electric-lime)' },
  { id: 'operative', label: 'Operative', accent: SOCIAL },
  { id: 'mastermind', label: 'Mastermind', accent: 'var(--neon-magenta)' },
] as const;

const WAGER_OPTIONS = [0, 50, 100, 250, 500] as const;

// ─── Mock opponent lookup ───────────────────

const OPPONENT_NAMES: Record<string, string> = {
  u1: 'SPECTRAL_07', u2: 'CIPHER_X', u3: 'NOVA_PRIME',
  u4: 'SHADOW_9', u6: 'VECTOR_7', u8: 'ZERO_1',
};

// ─── Component ──────────────────────────────

export default function ChallengeScreen() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();

  const opponentName = OPPONENT_NAMES[playerId ?? ''] ?? 'UNKNOWN';

  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState('operative');
  const [wager, setWager] = useState(0);
  const [sent, setSent] = useState(false);

  const mode = useMemo(
    () => GAME_MODES.find((m) => m.id === selectedMode),
    [selectedMode],
  );

  const modeAccent = mode ? CATEGORY_ACCENTS[mode.category] : SOCIAL;

  const handleSend = useCallback(() => {
    setSent(true);
    // Auto-navigate to matchmaking after animation
    setTimeout(() => {
      navigate(`/play/matchmaking?mode=${selectedMode}`);
    }, 1200);
  }, [navigate, selectedMode]);

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #091a1f 0%, #0a0a0f 50%, #060609 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <motion.button
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors mb-6 cursor-pointer"
          onClick={() => navigate(-1)}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.96 }}
        >
          ← Back
        </motion.button>

        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="text-2xl font-black uppercase tracking-[0.15em] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Challenge
          </h1>
          <p className="text-sm" style={{ color: SOCIAL }}>
            vs <span className="font-bold">{opponentName}</span>
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              className="flex flex-col gap-6"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* 1. Pick Game Mode */}
              <div>
                <h2
                  className="text-[0.55rem] font-bold uppercase tracking-[0.25em] mb-3"
                  style={{ fontFamily: 'var(--font-display)', color: `${SOCIAL}99` }}
                >
                  1. Select Mode
                </h2>
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
                >
                  {GAME_MODES.map((m) => {
                    const active = selectedMode === m.id;
                    const accent = CATEGORY_ACCENTS[m.category];
                    return (
                      <motion.button
                        key={m.id}
                        onClick={() => setSelectedMode(m.id)}
                        className="px-3 py-3 text-left cursor-pointer"
                        style={{
                          background: '#0c0c14',
                          border: `2px solid ${active ? accent : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: active ? `3px 3px 0px ${accent}` : 'none',
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}
                        whileHover={{ borderColor: `${accent}60` }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span
                          className="text-[0.55rem] font-bold uppercase tracking-[0.1em] block"
                          style={{
                            fontFamily: 'var(--font-display)',
                            color: active ? accent : 'rgba(255,255,255,0.4)',
                          }}
                        >
                          {m.name}
                        </span>
                        <span className="text-[0.4rem] text-white/15">{m.category}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Pick Difficulty */}
              <div>
                <h2
                  className="text-[0.55rem] font-bold uppercase tracking-[0.25em] mb-3"
                  style={{ fontFamily: 'var(--font-display)', color: `${SOCIAL}99` }}
                >
                  2. Difficulty
                </h2>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => {
                    const active = difficulty === d.id;
                    return (
                      <motion.button
                        key={d.id}
                        onClick={() => setDifficulty(d.id)}
                        className="flex-1 py-3 text-[0.55rem] font-bold uppercase tracking-[0.15em] cursor-pointer"
                        style={{
                          fontFamily: 'var(--font-display)',
                          background: active ? d.accent : '#0c0c14',
                          color: active ? '#0a0a0f' : 'rgba(255,255,255,0.3)',
                          border: `2px solid ${active ? d.accent : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: active ? `3px 3px 0px #fff` : 'none',
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {d.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Wager (optional) */}
              <div>
                <h2
                  className="text-[0.55rem] font-bold uppercase tracking-[0.25em] mb-3"
                  style={{ fontFamily: 'var(--font-display)', color: `${SOCIAL}99` }}
                >
                  3. Wager <span className="text-white/20">(Optional)</span>
                </h2>
                <div className="flex gap-2">
                  {WAGER_OPTIONS.map((w) => {
                    const active = wager === w;
                    return (
                      <motion.button
                        key={w}
                        onClick={() => setWager(w)}
                        className="flex-1 py-2.5 text-[0.55rem] font-bold tabular-nums cursor-pointer"
                        style={{
                          fontFamily: 'var(--font-display)',
                          background: active ? '#0c0c14' : 'transparent',
                          color: active ? 'var(--laser-orange)' : 'rgba(255,255,255,0.2)',
                          border: `1px solid ${active ? 'var(--laser-orange)' : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: active ? '2px 2px 0px var(--laser-orange)' : 'none',
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {w === 0 ? 'None' : `${w} XP`}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Send Challenge */}
              <motion.button
                onClick={handleSend}
                disabled={!selectedMode}
                className="w-full py-4 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: selectedMode ? modeAccent : 'rgba(255,255,255,0.1)',
                  color: selectedMode ? '#0a0a0f' : 'rgba(255,255,255,0.2)',
                  boxShadow: selectedMode ? '4px 4px 0px #fff' : 'none',
                }}
                whileHover={selectedMode ? { boxShadow: '6px 6px 0px #fff', y: -2 } : {}}
                whileTap={selectedMode ? { scale: 0.97 } : {}}
              >
                Send Challenge
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              className="flex flex-col items-center gap-4 py-16 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.span
                className="text-5xl"
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                ⚡
              </motion.span>
              <h2
                className="text-xl font-black uppercase tracking-[0.15em]"
                style={{ fontFamily: 'var(--font-display)', color: SOCIAL }}
              >
                Challenge Sent!
              </h2>
              <p className="text-xs text-white/30">
                Waiting for {opponentName} to accept…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
