// ──────────────────────────────────────────────
// NINE — Placeholder Screen (scaffold only)
// ──────────────────────────────────────────────

import { motion } from 'framer-motion';

interface Props {
  id: string;      // e.g. "S-01"
  title: string;   // e.g. "Splash"
  cluster: string; // e.g. "Auth"
  accent: string;  // CSS color / var
}

export function ScreenPlaceholder({ id, title, cluster, accent }: Props) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] gap-6 px-6 select-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Cluster badge */}
      <span
        className="text-[0.5rem] font-bold uppercase tracking-[0.35em] px-3 py-1 rounded-full"
        style={{
          color: accent,
          background: `color-mix(in srgb, ${accent} 8%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`,
        }}
      >
        {cluster} Cluster
      </span>

      {/* Screen ID */}
      <span
        className="font-[var(--font-primary)] text-7xl font-black tabular-nums"
        style={{ color: accent, fontFamily: 'var(--font-primary)' }}
      >
        {id}
      </span>

      {/* Title */}
      <h1
        className="text-2xl font-bold uppercase tracking-[0.2em] text-white/80"
        style={{ fontFamily: 'var(--font-primary)' }}
      >
        {title}
      </h1>

      {/* Build hint */}
      <p className="text-xs text-white/20 tracking-wider">
        PLACEHOLDER — UI NOT YET BUILT
      </p>

      {/* Decorative border frame */}
      <div
        className="absolute inset-4 pointer-events-none rounded-lg"
        style={{
          border: `1px dashed color-mix(in srgb, ${accent} 12%, transparent)`,
        }}
      />
    </motion.div>
  );
}
