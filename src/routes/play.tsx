// ──────────────────────────────────────────────
// NINE — Play Route (mode dispatcher)
// ──────────────────────────────────────────────

import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { VaultBreaker } from '../components/Games/VaultBreaker';
import { TheInterrogation } from '../components/Games/TheInterrogation';
import { ChronosShift } from '../components/Games/ChronosShift';
import { DataSift } from '../components/Games/DataSift';
import { GlyphGrid } from '../components/Games/GlyphGrid';
import { LexiconWeave } from '../components/Games/LexiconWeave';
import { CanvasFracture } from '../components/Games/CanvasFracture';
import { ShatteredGrid } from '../components/Games/ShatteredGrid';
import { RaceMode } from '../components/Games/RaceMode';
import { THEMES } from '../lib/themes';
import type React from 'react';

// ─── Theme CSS Variable Wrapper ─────────────

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = THEMES[0]; // default theme; will be user-selectable later

  const vars = {
    '--color-background': theme.colors.background,
    '--color-grid-lines': theme.colors.gridLines,
    '--color-primary-text': theme.colors.primaryText,
    '--color-accent': theme.colors.accent,
    '--color-error': theme.colors.error,
  } as React.CSSProperties;

  return <div style={vars}>{children}</div>;
}

// ─── Placeholder for unbuilt modes ──────────

function ModePlaceholder({ modeId, onExit }: { modeId: string; onExit: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white gap-6 px-6">
      <motion.div
        className="flex flex-col items-center gap-4 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="text-xs uppercase tracking-[0.3em] text-white/30">
          Loading Mode
        </span>
        <h1 className="text-2xl font-bold tracking-wide text-white/90">
          {modeId}
        </h1>
        <p className="text-sm text-white/40 max-w-xs">
          Game UI for this mode is under construction.
        </p>
      </motion.div>
      <motion.button
        className="px-6 py-3 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/30 transition-colors"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onExit}
      >
        Back to Lobby
      </motion.button>
    </div>
  );
}

// ─── Route ──────────────────────────────────

export default function PlayRoute() {
  const { modeId } = useParams<{ modeId: string }>();
  const navigate = useNavigate();

  const goToLobby = () => navigate('/');

  function renderMode() {
    switch (modeId) {
      case 'vault-breaker':
        return <VaultBreaker onExit={goToLobby} />;
      case 'interrogation':
        return <TheInterrogation onExit={goToLobby} />;
      case 'chronos-shift':
        return <ChronosShift onExit={goToLobby} />;
      case 'data-sift':
        return <DataSift onExit={goToLobby} />;
      case 'glyph-grid':
        return <GlyphGrid onExit={goToLobby} />;
      case 'lexicon-weave':
        return <LexiconWeave onExit={goToLobby} />;
      case 'canvas-fracture':
        return <CanvasFracture onExit={goToLobby} />;
      case 'shattered-grid':
        return <ShatteredGrid onExit={goToLobby} />;
      case 'race':
        return <RaceMode userId="guest" onExit={goToLobby} />;
      default:
        return <ModePlaceholder modeId={modeId ?? 'unknown'} onExit={goToLobby} />;
    }
  }

  return (
    <ThemeProvider>
      {renderMode()}
    </ThemeProvider>
  );
}
