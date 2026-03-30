// ──────────────────────────────────────────────
// S-13 — Active Game + S-14 — Pause Menu Overlay
// Game dispatcher with integrated pause overlay
// ──────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { getModeById, CATEGORY_ACCENTS } from '../../lib/gameModesData';
import { THEMES } from '../../lib/themes';
import type React from 'react';

// ── Game Components ──
import { VaultBreaker } from '../../components/Games/VaultBreaker';
import { TheInterrogation } from '../../components/Games/TheInterrogation';
import { ChronosShift } from '../../components/Games/ChronosShift';
import { DataSift } from '../../components/Games/DataSift';
import { GlyphGrid } from '../../components/Games/GlyphGrid';
import { LexiconWeave } from '../../components/Games/LexiconWeave';
import { CanvasFracture } from '../../components/Games/CanvasFracture';
import { ShatteredGrid } from '../../components/Games/ShatteredGrid';
import { RaceMode } from '../../components/Games/RaceMode';
import { PrimeGrid } from '../../components/Games/PrimeGrid';

// ─── Theme CSS Variable Wrapper ─────────────

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = THEMES[0];
  const vars = {
    '--color-background': theme.colors.background,
    '--color-grid-lines': theme.colors.gridLines,
    '--color-primary-text': theme.colors.primaryText,
    '--color-accent': theme.colors.accent,
    '--color-error': theme.colors.error,
  } as React.CSSProperties;

  return <div style={vars}>{children}</div>;
}

// ─── S-14 Pause Menu (Overlay) ──────────────

interface PauseMenuProps {
  visible: boolean;
  accent: string;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

function PauseMenu({ visible, accent, onResume, onRestart, onQuit }: PauseMenuProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="flex flex-col items-center gap-6 w-full max-w-xs px-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Title */}
            <h2
              className="text-2xl font-black uppercase tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-display)', color: accent }}
            >
              Paused
            </h2>

            <div className="w-12 h-px" style={{ background: `${accent}30` }} />

            {/* Buttons */}
            <div className="flex flex-col gap-3 w-full">
              <motion.button
                className="w-full py-3.5 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: accent,
                  color: '#0a0a0f',
                  boxShadow: `4px 4px 0px #fff`,
                }}
                whileHover={{ boxShadow: `6px 6px 0px #fff` }}
                whileTap={{ scale: 0.97 }}
                onClick={onResume}
              >
                Resume
              </motion.button>

              <motion.button
                className="w-full py-3.5 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer"
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.5)',
                  border: '2px solid rgba(255,255,255,0.12)',
                  boxShadow: '4px 4px 0px rgba(255,255,255,0.06)',
                  fontFamily: 'var(--font-display)',
                }}
                whileHover={{ borderColor: 'rgba(255,255,255,0.3)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onRestart}
              >
                Restart
              </motion.button>

              <motion.button
                className="w-full py-3.5 text-sm font-bold uppercase tracking-[0.15em] cursor-pointer"
                style={{
                  background: 'transparent',
                  color: '#ff6b6b',
                  border: '2px solid rgba(255,107,107,0.2)',
                  boxShadow: '4px 4px 0px rgba(255,107,107,0.08)',
                  fontFamily: 'var(--font-display)',
                }}
                whileHover={{ borderColor: 'rgba(255,107,107,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onQuit}
              >
                Quit Game
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Active Game ────────────────────────────

export default function ActiveGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modeId = searchParams.get('mode') ?? 'prime-grid';
  const mode = getModeById(modeId);
  const accent = mode ? CATEGORY_ACCENTS[mode.category] : '#00FFFF';

  const [isPaused, setIsPaused] = useState(false);

  const handleExit = useCallback(() => {
    // Go to result screen on exit
    navigate(`/play/result/${gameId}?mode=${modeId}&outcome=win&score=1250`);
  }, [navigate, gameId, modeId]);

  const handleResume = useCallback(() => setIsPaused(false), []);
  const handleRestart = useCallback(() => {
    setIsPaused(false);
    // Force re-mount by navigating to self
    navigate(`/play/game/${gameId}?mode=${modeId}`, { replace: true });
  }, [navigate, gameId, modeId]);
  const handleQuit = useCallback(() => navigate('/play'), [navigate]);

  // Render the appropriate game component
  function renderGame() {
    switch (modeId) {
      case 'vault-breaker':
        return <VaultBreaker onExit={handleExit} />;
      case 'interrogation':
        return <TheInterrogation onExit={handleExit} />;
      case 'chronos-shift':
        return <ChronosShift onExit={handleExit} />;
      case 'data-sift':
        return <DataSift onExit={handleExit} />;
      case 'glyph-grid':
        return <GlyphGrid onExit={handleExit} />;
      case 'lexicon-weave':
        return <LexiconWeave onExit={handleExit} />;
      case 'canvas-fracture':
        return <CanvasFracture onExit={handleExit} />;
      case 'shattered-grid':
        return <ShatteredGrid onExit={handleExit} />;
      case 'prime-grid':
        return <PrimeGrid onExit={handleExit} />;
      case 'race':
        return <RaceMode onExit={handleExit} />;
      default:
        return <GamePlaceholder modeId={modeId} accent={accent} onExit={handleExit} />;
    }
  }

  return (
    <ThemeProvider>
      <div className="relative min-h-screen">
        {/* Pause button — fixed overlay */}
        <motion.button
          className="fixed top-16 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer"
          style={{
            background: 'rgba(10,10,15,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
          }}
          whileHover={{ borderColor: 'rgba(255,255,255,0.3)' }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsPaused(true)}
          aria-label="Pause game"
        >
          <span className="text-white/60 text-sm">⏸</span>
        </motion.button>

        {/* Game content */}
        {renderGame()}

        {/* Pause overlay */}
        <PauseMenu
          visible={isPaused}
          accent={accent}
          onResume={handleResume}
          onRestart={handleRestart}
          onQuit={handleQuit}
        />
      </div>
    </ThemeProvider>
  );
}

// ─── Placeholder for unbuilt modes ──────────

function GamePlaceholder({
  modeId, accent, onExit,
}: {
  modeId: string; accent: string; onExit: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white gap-6 px-6">
      <motion.div
        className="flex flex-col items-center gap-4 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-4xl" style={{ color: accent }}>◈</span>
        <h1
          className="text-xl font-black uppercase tracking-[0.15em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {modeId}
        </h1>
        <p className="text-xs text-white/30 max-w-xs">
          Game UI for this mode is under construction. Exit to see the result screen.
        </p>
      </motion.div>
      <motion.button
        className="px-6 py-3 text-[0.6rem] font-bold uppercase tracking-[0.2em] cursor-pointer"
        style={{
          background: accent,
          color: '#0a0a0f',
          boxShadow: '4px 4px 0px #fff',
          fontFamily: 'var(--font-display)',
        }}
        whileHover={{ boxShadow: '6px 6px 0px #fff' }}
        whileTap={{ scale: 0.97 }}
        onClick={onExit}
      >
        End Game
      </motion.button>
    </div>
  );
}
