// ──────────────────────────────────────────────
// S-13 — Active Game (Dispatcher + Pause)
// ──────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { getModeById, CATEGORY_ACCENTS } from '../../lib/gameModesData';

// ── Game Components ──
import { VaultBreaker } from '../../components/Games/VaultBreaker';
import { TheInterrogation } from '../../components/Games/TheInterrogation';
import { ChronosShift } from '../../components/Games/ChronosShift';
import { DataSift } from '../../components/Games/DataSift';
import { GlyphGrid } from '../../components/Games/GlyphGrid';
import { LexiconWeave } from '../../components/Games/LexiconWeave';
import { CanvasFracture } from '../../components/Games/CanvasFracture';
import { ShatteredGrid } from '../../components/Games/ShatteredGrid';
import { PrimeGrid } from '../../components/Games/PrimeGrid';

// ─── Pause Menu (Offline only) ──────────────

interface PauseMenuProps {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

function PauseMenu({ visible, onResume, onRestart, onQuit }: PauseMenuProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: 'rgba(12, 12, 15, 0.92)',
            backdropFilter: 'blur(16px)',
          }}
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
            <h2
              className="text-2xl font-extrabold tracking-tight"
              style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
            >
              Paused
            </h2>

            <div className="w-12 h-px" style={{ background: 'var(--border-default)' }} />

            <div className="flex flex-col gap-3 w-full">
              <motion.button
                className="w-full py-3.5 text-sm font-semibold cursor-pointer"
                style={{
                  fontFamily: 'var(--font-primary)',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                }}
                whileHover={{ opacity: 0.9, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onResume}
              >
                Resume
              </motion.button>

              <motion.button
                className="w-full py-3.5 text-sm font-semibold cursor-pointer"
                style={{
                  fontFamily: 'var(--font-primary)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                }}
                whileHover={{ background: 'var(--bg-card-hover)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onRestart}
              >
                Restart
              </motion.button>

              <motion.button
                className="w-full py-3.5 text-sm font-semibold cursor-pointer"
                style={{
                  fontFamily: 'var(--font-primary)',
                  background: 'transparent',
                  color: 'var(--accent-error)',
                  border: '1px solid rgba(255,107,107,0.2)',
                  borderRadius: 'var(--radius-md)',
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
  const accent = mode ? CATEGORY_ACCENTS[mode.category] : '#6C63FF';

  const [isPaused, setIsPaused] = useState(false);

  const handleExit = useCallback(() => {
    navigate(`/play/result/${gameId}?mode=${modeId}&outcome=win&score=0`);
  }, [navigate, gameId, modeId]);

  const handleResume = useCallback(() => setIsPaused(false), []);
  const handleRestart = useCallback(() => {
    setIsPaused(false);
    navigate(`/play/game/${gameId}?mode=${modeId}`, { replace: true });
  }, [navigate, gameId, modeId]);
  const handleQuit = useCallback(() => navigate('/play'), [navigate]);

  function renderGame() {
    switch (modeId) {
      case 'prime-grid':
        return <PrimeGrid onExit={handleExit} />;
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
      default:
        return <GamePlaceholder modeId={modeId} onExit={handleExit} />;
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Pause button (offline only) */}
      <motion.button
        className="fixed top-16 right-4 z-50 w-10 h-10 flex items-center justify-center cursor-pointer"
        style={{
          background: 'rgba(12, 12, 15, 0.7)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          backdropFilter: 'blur(8px)',
        }}
        whileHover={{ borderColor: 'var(--border-default)' }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsPaused(true)}
        aria-label="Pause game"
      >
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>⏸</span>
      </motion.button>

      {renderGame()}

      <PauseMenu
        visible={isPaused}
        onResume={handleResume}
        onRestart={handleRestart}
        onQuit={handleQuit}
      />
    </div>
  );
}

// ─── Placeholder ────────────────────────────

function GamePlaceholder({ modeId, onExit }: { modeId: string; onExit: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-6 px-6"
      style={{ background: 'var(--bg-primary)' }}
    >
      <motion.div
        className="flex flex-col items-center gap-4 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-4xl">🔧</span>
        <h1
          className="text-xl font-extrabold tracking-tight"
          style={{ fontFamily: 'var(--font-primary)', color: 'var(--text-primary)' }}
        >
          {modeId}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          This game mode is under construction.
        </p>
      </motion.div>
      <motion.button
        className="px-6 py-3 text-sm font-semibold cursor-pointer"
        style={{
          fontFamily: 'var(--font-primary)',
          background: 'var(--accent-primary)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-md)',
        }}
        whileHover={{ opacity: 0.9 }}
        whileTap={{ scale: 0.97 }}
        onClick={onExit}
      >
        Exit
      </motion.button>
    </div>
  );
}
