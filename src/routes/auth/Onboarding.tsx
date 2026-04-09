// ──────────────────────────────────────────────
// S-05 — Onboarding (3-step wizard)
// Set username → Pick avatar → Choose difficulty
// ──────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Data ───────────────────────────────────

const AVATARS = [
  { id: 'phantom',   glyph: '◈', label: 'Phantom' },
  { id: 'spectre',   glyph: '⟁', label: 'Spectre' },
  { id: 'cipher',    glyph: '⧖', label: 'Cipher' },
  { id: 'nexus',     glyph: '⬡', label: 'Nexus' },
  { id: 'vector',    glyph: '◇', label: 'Vector' },
  { id: 'nova',      glyph: '✦', label: 'Nova' },
] as const;

const DIFFICULTIES = [
  { id: 'trainee',     label: 'Trainee',     desc: 'Guided experience. Perfect for learning.', accent: 'var(--accent-success)' },
  { id: 'operative',   label: 'Operative',   desc: 'Standard challenge. The real NINE experience.', accent: 'var(--accent-secondary)' },
  { id: 'mastermind',  label: 'Mastermind',  desc: 'Maximum difficulty. No mercy.', accent: 'var(--accent-primary)' },
] as const;

type Step = 0 | 1 | 2;

const STEP_TITLES = ['Set Callsign', 'Choose Avatar', 'Select Difficulty'] as const;

// ─── Slide animation ────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

// ─── Component ──────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState(1);

  // Form state
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('phantom');
  const [difficulty, setDifficulty] = useState('operative');
  const [usernameError, setUsernameError] = useState('');

  const goNext = useCallback(() => {
    if (step === 0) {
      const trimmed = username.trim();
      if (trimmed.length < 3) { setUsernameError('Min 3 characters.'); return; }
      if (trimmed.length > 20) { setUsernameError('Max 20 characters.'); return; }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setUsernameError('Letters, numbers, underscores only.'); return; }
      setUsernameError('');
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, 2) as Step);
  }, [step, username]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0) as Step);
  }, []);

  const handleComplete = useCallback(() => {
    // Save onboarding data to localStorage
    const profile = { username: username.trim(), avatar, difficulty, xp: 0, rank: 'Recruit' };
    localStorage.setItem('nine_profile', JSON.stringify(profile));
    navigate('/', { replace: true });
  }, [username, avatar, difficulty, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 select-none">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center text-[0.55rem] font-bold"
              style={{
                fontFamily: 'var(--font-primary)',
                background: i <= step ? 'var(--accent-primary)' : 'transparent',
                color: i <= step ? 'var(--bg-primary)' : 'rgba(255,255,255,0.2)',
                border: `2px solid ${i <= step ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`,
                transition: 'all 0.3s',
              }}
            >
              {i + 1}
            </div>
            {i < 2 && (
              <div
                className="w-8 h-px"
                style={{
                  background: i < step ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step title */}
      <motion.h2
        key={step}
        className="text-xl font-black uppercase tracking-[0.15em] text-white mb-1"
        style={{ fontFamily: 'var(--font-primary)' }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {STEP_TITLES[step]}
      </motion.h2>
      <p className="text-[0.5rem] uppercase tracking-[0.3em] text-white/20 mb-8">
        Step {step + 1} of 3
      </p>

      {/* Step content */}
      <div className="relative w-full max-w-sm" style={{ minHeight: 200 }}>
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-[0.5rem] uppercase tracking-[0.25em] text-white/30 mb-1.5">
                  Callsign
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
                  maxLength={20}
                  className="w-full px-4 py-3.5 text-sm text-white bg-transparent outline-none uppercase tracking-wider"
                  style={{
                    border: `2px solid ${usernameError ? '#ff6b6b' : 'rgba(255,255,255,0.1)'}`,
                    fontFamily: 'var(--font-primary)',
                  }}
                  placeholder="AGENT_ZERO"
                  autoFocus
                />
                {usernameError && (
                  <p className="text-[0.55rem] text-[#ff6b6b] mt-1">{usernameError}</p>
                )}
                <p className="text-[0.45rem] text-white/15 mt-2 tracking-wider">
                  {username.length}/20 — This is your public identity.
                </p>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="grid grid-cols-3 gap-3"
            >
              {AVATARS.map((a) => {
                const selected = avatar === a.id;
                return (
                  <motion.button
                    key={a.id}
                    onClick={() => setAvatar(a.id)}
                    className="flex flex-col items-center gap-2 py-5 cursor-pointer"
                    style={{
                      background: 'var(--bg-surface)',
                      border: `2px solid ${selected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                      transition: 'all 0.2s',
                    }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span
                      className="text-2xl"
                      style={{ color: selected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.3)' }}
                    >
                      {a.glyph}
                    </span>
                    <span
                      className="text-[0.45rem] uppercase tracking-[0.2em]"
                      style={{
                        fontFamily: 'var(--font-primary)',
                        color: selected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {a.label}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3"
            >
              {DIFFICULTIES.map((d) => {
                const selected = difficulty === d.id;
                return (
                  <motion.button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className="flex items-center gap-4 px-5 py-4 text-left cursor-pointer w-full"
                    style={{
                      background: 'var(--bg-surface)',
                      border: `2px solid ${selected ? d.accent : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                      transition: 'all 0.2s',
                    }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        background: selected ? d.accent : 'transparent',
                        border: `2px solid ${selected ? d.accent : 'rgba(255,255,255,0.15)'}`,
                        transition: 'all 0.2s',
                      }}
                    />
                    <div>
                      <span
                        className="text-sm font-bold uppercase tracking-[0.1em] block"
                        style={{
                          fontFamily: 'var(--font-primary)',
                          color: selected ? d.accent : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {d.label}
                      </span>
                      <span className="text-[0.55rem] text-white/25">{d.desc}</span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-4 mt-10 w-full max-w-sm">
        {step > 0 && (
          <motion.button
            onClick={goBack}
            className="px-6 py-3 text-[0.6rem] font-bold uppercase tracking-[0.2em] cursor-pointer"
            style={{
              fontFamily: 'var(--font-primary)',
              color: 'rgba(255,255,255,0.4)',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: 'var(--shadow-sm)',
            }}
            whileHover={{ borderColor: 'rgba(255,255,255,0.25)' }}
            whileTap={{ scale: 0.97 }}
          >
            Back
          </motion.button>
        )}

        <motion.button
          onClick={step === 2 ? handleComplete : goNext}
          className="flex-1 py-3 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer"
          style={{
            fontFamily: 'var(--font-primary)',
            background: step === 2 ? 'var(--accent-success)' : 'var(--accent-primary)',
            color: 'var(--bg-primary)',
            boxShadow: 'var(--shadow-md)',
          }}
          whileHover={{ boxShadow: 'var(--shadow-lg)', y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          {step === 2 ? 'Launch NINE' : 'Continue'}
        </motion.button>
      </div>
    </div>
  );
}
