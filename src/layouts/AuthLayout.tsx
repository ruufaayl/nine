// ──────────────────────────────────────────────
// NINE — Auth Layout (no navigation visible)
// Clean minimalist — Manrope liquid design
// ──────────────────────────────────────────────

import { Outlet } from 'react-router';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Ambient soft glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent-primary) 5%, transparent), transparent)',
        }}
      />

      {/* Floating NINE wordmark */}
      <motion.div
        className="fixed top-6 left-6 z-10"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <span
          className="text-lg font-extrabold tracking-tight"
          style={{
            fontFamily: 'var(--font-primary)',
            color: 'var(--text-secondary)',
          }}
        >
          NINE
        </span>
      </motion.div>

      {/* Route content */}
      <Outlet />
    </div>
  );
}
