// ──────────────────────────────────────────────
// S-05 — Onboarding (Welcome Carousel)
// 3 solid-color slides introducing the app,
// then routes to login. No account creation here.
// ──────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightIcon } from '../../components/Auth/BrandIcons';

// ─── Slides ────────────────────────────────

const SLIDES = [
  {
    bg: '#4338CA',
    glyph: '◈',
    title: 'Compete',
    subtitle: '14 puzzle modes. Real-time 1v1.',
    desc: 'From classic Sudoku to cryptic ciphers — every match is a battle of speed and strategy.',
  },
  {
    bg: '#0F766E',
    glyph: '⬡',
    title: 'Climb',
    subtitle: 'Trophies. Ranks. Seasons.',
    desc: 'Earn trophies, climb the leaderboard, unlock rewards every season. Your skill, your legacy.',
  },
  {
    bg: '#B91C1C',
    glyph: '⟁',
    title: 'Connect',
    subtitle: 'Friends. Clans. Glory.',
    desc: 'Challenge friends, join a clan, share your wins. Every puzzle is better with rivals.',
  },
] as const;

// ─── Animation ─────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

// ─── Component ─────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      localStorage.setItem('nine_onboarded', '1');
      navigate('/login', { replace: true });
      return;
    }
    setDirection(1);
    setIndex((i) => i + 1);
  }, [isLast, navigate]);

  const goBack = useCallback(() => {
    if (index === 0) return;
    setDirection(-1);
    setIndex((i) => i - 1);
  }, [index]);

  const skip = useCallback(() => {
    localStorage.setItem('nine_onboarded', '1');
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden select-none">
      {/* ── Slide background ─────────────────── */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex flex-col"
          style={{ background: slide.bg }}
        >
          {/* Top section — glyph + visual */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* Large glyph */}
            <motion.span
              className="text-[12rem] leading-none select-none"
              style={{
                color: 'rgba(255,255,255,0.08)',
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {slide.glyph}
            </motion.span>

            {/* Title overlay on glyph */}
            <motion.h1
              className="absolute text-6xl font-black tracking-[-0.04em] text-white"
              style={{ fontFamily: 'var(--font-display)' }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {slide.title}
            </motion.h1>
          </div>

          {/* Bottom section — text + controls */}
          <div className="px-7 pb-8">
            <motion.p
              className="text-lg font-bold text-white mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {slide.subtitle}
            </motion.p>
            <motion.p
              className="text-sm leading-relaxed mb-10"
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'var(--font-body)',
                maxWidth: '85%',
              }}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              {slide.desc}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Controls (overlay, always visible) ─ */}
      <div className="absolute bottom-0 inset-x-0 px-7 pb-8 z-10 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: i === index ? 24 : 8,
                  height: 8,
                  background: i === index ? '#fff' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.3s ease',
                  borderRadius: '999px',
                }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {!isLast && (
              <motion.button
                onClick={skip}
                className="text-[0.7rem] font-semibold uppercase tracking-[0.15em] cursor-pointer px-3 py-2"
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'var(--font-body)',
                  background: 'transparent',
                  border: 'none',
                }}
                whileTap={{ scale: 0.95 }}
              >
                Skip
              </motion.button>
            )}
            <motion.button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-3 cursor-pointer"
              style={{
                background: '#fff',
                color: '#0a0a0a',
                borderRadius: '999px',
                border: 'none',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <span>{isLast ? 'Get Started' : 'Next'}</span>
              <ArrowRightIcon size={14} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Back (top-left, after slide 0) ──── */}
      {index > 0 && (
        <motion.button
          onClick={goBack}
          className="absolute top-5 left-5 z-10 w-9 h-9 flex items-center justify-center cursor-pointer"
          style={{
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Previous slide"
        >
          <span className="text-sm">←</span>
        </motion.button>
      )}
    </div>
  );
}
