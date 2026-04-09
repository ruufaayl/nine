// ──────────────────────────────────────────────
// S-01 — Splash (logo reveal + token auto-route)
// ──────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

const REVEAL_MS = 2200;

export default function Splash() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'logo' | 'tagline' | 'routing'>('logo');

  // Phase timeline: logo → tagline → routing
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 900);
    const t2 = setTimeout(() => setPhase('routing'), REVEAL_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Simulate token check once reveal completes
  useEffect(() => {
    if (phase !== 'routing') return;

    const timer = setTimeout(() => {
      const hasToken = !!localStorage.getItem('nine_session');
      navigate(hasToken ? '/' : '/login', { replace: true });
    }, 400);

    return () => clearTimeout(timer);
  }, [phase, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen select-none">
      {/* Background pulse */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,0,255,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Logo assembly */}
      <div className="relative flex flex-col items-center gap-5">
        {/* Outer ring — draws in */}
        <motion.div
          className="absolute w-40 h-40 rounded-full"
          style={{ border: '2px solid var(--accent-primary)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.15 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Inner ring */}
        <motion.div
          className="absolute w-28 h-28 rounded-full"
          style={{ border: '1px dashed rgba(255,255,255,0.08)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: 360 }}
          transition={{ duration: 1.2, ease: 'easeOut', rotate: { duration: 20, repeat: Infinity, ease: 'linear' } }}
        />

        {/* NINE wordmark */}
        <motion.h1
          className="text-6xl sm:text-7xl font-black tracking-[-0.02em] text-white relative z-10"
          style={{ fontFamily: 'var(--font-primary)' }}
          initial={{ opacity: 0, scale: 0.7, filter: 'blur(12px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          NINE
        </motion.h1>

        {/* Tagline reveal */}
        <AnimatePresence>
          {(phase === 'tagline' || phase === 'routing') && (
            <motion.p
              className="text-[0.5rem] uppercase tracking-[0.5em] text-white/25"
              style={{ fontFamily: 'var(--font-primary)' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              Protocol Initiated
            </motion.p>
          )}
        </AnimatePresence>

        {/* Scan line */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-32 h-px"
          style={{ background: 'var(--accent-primary)' }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.4, delay: 0.3, ease: 'easeInOut' }}
        />
      </div>

      {/* Loading bar at bottom */}
      <motion.div
        className="fixed bottom-12 w-48 h-0.5 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <motion.div
          className="h-full"
          style={{ background: 'var(--accent-primary)' }}
          initial={{ scaleX: 0, transformOrigin: 'left' }}
          animate={{ scaleX: 1 }}
          transition={{ duration: REVEAL_MS / 1000, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}
