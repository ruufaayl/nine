// ──────────────────────────────────────────────
// S-01 — Splash
// Premium logo reveal → auto-route. Styrene Black,
// solid surface, matches Play Hub visual language.
// ──────────────────────────────────────────────

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';

const REVEAL_MS = 1600;

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const authed = !!localStorage.getItem('nine_session');
      const onboarded = !!localStorage.getItem('nine_onboarded');

      if (authed) {
        navigate('/', { replace: true });
      } else if (onboarded) {
        navigate('/login', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }, REVEAL_MS);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="relative flex flex-col items-center justify-center h-full w-full select-none"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Wordmark */}
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.h1
          className="text-[5.5rem] font-black leading-none tracking-[-0.05em]"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
          }}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          NINE
        </motion.h1>
        <motion.p
          className="mt-3 text-[0.6rem] font-bold uppercase tracking-[0.32em]"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-tertiary)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          Compete · Climb · Connect
        </motion.p>
      </motion.div>

      {/* Progress bar at bottom */}
      <motion.div
        className="absolute bottom-12 w-32 h-[2px] overflow-hidden"
        style={{
          background: 'var(--border-subtle)',
          borderRadius: '9999px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <motion.div
          className="h-full"
          style={{
            background: 'var(--text-primary)',
            transformOrigin: 'left',
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: REVEAL_MS / 1000 - 0.3, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Small version tag */}
      <div
        className="absolute bottom-4 text-[0.55rem] font-bold uppercase tracking-[0.2em] tabular-nums"
        style={{
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-numeric)',
        }}
      >
        v1.0
      </div>
    </div>
  );
}
