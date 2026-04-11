// ──────────────────────────────────────────────
// S-13 — Active Game (Dispatcher + Pause + Leave)
//
// Pause menu with leave confirmation:
// - Offline: "No stats will be saved" → confirm
// - Online: "You'll forfeit the match" → confirm
// Network disconnect overlay for online matches.
// ──────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { getModeById } from '../../lib/gameModesData';

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

// ─── Mode colors ───────────────────────────

const MODE_COLORS: Record<string, string> = {
  'prime-grid': '#4338CA', 'glyph-grid': '#0F766E', 'shattered-grid': '#B91C1C',
  'canvas-fracture': '#9333EA', 'vault-breaker': '#DB2777', 'cipher-scramble': '#F59E0B',
  'lexicon-weave': '#1E40AF', 'enigma-weave': '#7C2D12', 'interrogation': '#EA580C',
  'alias-protocol': '#E11D48', 'global-override': '#047857', 'data-sift': '#FACC15',
  'cinema-lattice': '#0369A1', 'chronos-shift': '#78350F',
};

// ─── Pause Menu ────────────────────────────

interface PauseMenuProps {
  visible: boolean;
  isOnline: boolean;
  confirmingQuit: boolean;
  color: string;
  onResume: () => void;
  onRestart: () => void;
  onQuitRequest: () => void;
  onQuitConfirm: () => void;
  onQuitCancel: () => void;
}

function PauseMenu({
  visible, isOnline, confirmingQuit, color,
  onResume, onRestart, onQuitRequest, onQuitConfirm, onQuitCancel,
}: PauseMenuProps) {
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
            {!confirmingQuit ? (
              <div className="flex flex-col items-center gap-6 w-full">
                <h2
                  className="text-2xl font-extrabold tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                >
                  Paused
                </h2>

                <div className="w-12 h-px" style={{ background: 'var(--border-default)' }} />

                <div className="flex flex-col gap-3 w-full">
                  <button
                    className="w-full py-3.5 text-sm font-semibold cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-display)',
                      background: color,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                    }}
                    onClick={onResume}
                  >
                    Resume
                  </button>

                  {!isOnline && (
                    <button
                      className="w-full py-3.5 text-sm font-semibold cursor-pointer"
                      style={{
                        fontFamily: 'var(--font-display)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                      }}
                      onClick={onRestart}
                    >
                      Restart
                    </button>
                  )}

                  <button
                    className="w-full py-3.5 text-sm font-semibold cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-display)',
                      background: 'transparent',
                      color: '#EF4444',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 'var(--radius-md)',
                    }}
                    onClick={onQuitRequest}
                  >
                    {isOnline ? 'Forfeit & Leave' : 'Quit Game'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 w-full">
                <span className="text-3xl">{isOnline ? '⚠️' : '🚪'}</span>

                <h2
                  className="text-lg font-extrabold tracking-tight text-center"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                >
                  {isOnline ? 'Forfeit Match?' : 'Leave Game?'}
                </h2>

                <p
                  className="text-[0.7rem] text-center leading-relaxed"
                  style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
                >
                  {isOnline
                    ? 'Leaving now counts as a loss. You\u2019ll lose trophies and the match entry fee.'
                    : 'No stats will be saved for this match. Your progress will be lost.'}
                </p>

                <div className="flex flex-col gap-3 w-full">
                  <button
                    className="w-full py-3.5 text-sm font-bold cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-display)',
                      background: '#EF4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                    }}
                    onClick={onQuitConfirm}
                  >
                    {isOnline ? 'Forfeit & Leave' : 'Leave Game'}
                  </button>

                  <button
                    className="w-full py-3.5 text-sm font-semibold cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-display)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                    }}
                    onClick={onQuitCancel}
                  >
                    Keep Playing
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Disconnect Overlay ────────────────────

function DisconnectOverlay({ visible, color }: { visible: boolean; color: string }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center"
          style={{
            background: 'rgba(12, 12, 15, 0.85)',
            backdropFilter: 'blur(12px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.span
              className="text-4xl"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              📡
            </motion.span>
            <h2
              className="text-lg font-black uppercase tracking-[0.06em]"
              style={{ fontFamily: 'var(--font-display)', color: '#F59E0B' }}
            >
              Opponent Disconnected
            </h2>
            <p
              className="text-[0.65rem] font-semibold"
              style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              Waiting for reconnection…
            </p>
            <motion.div
              className="w-32 h-0.5 mt-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <motion.div
                className="h-full"
                style={{ background: color }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
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
  const difficulty = searchParams.get('difficulty') ?? 'medium';
  const color = MODE_COLORS[modeId] ?? '#6C63FF';

  const isOnline = !gameId?.startsWith('offline-');

  const [isPaused, setIsPaused] = useState(false);
  const [confirmingQuit, setConfirmingQuit] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  // TODO: Wire to real WebSocket events for online matches
  // For now, opponentDisconnected is controlled by state only

  const handleExit = useCallback(() => {
    navigate(`/play/result/${gameId}?mode=${modeId}&outcome=win&score=0`, { replace: true });
  }, [navigate, gameId, modeId]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    setConfirmingQuit(false);
  }, []);

  const handleRestart = useCallback(() => {
    setIsPaused(false);
    setConfirmingQuit(false);
    navigate(`/play/game/${gameId}?mode=${modeId}&difficulty=${difficulty}`, { replace: true });
  }, [navigate, gameId, modeId, difficulty]);

  const handleQuitRequest = useCallback(() => setConfirmingQuit(true), []);
  const handleQuitCancel = useCallback(() => setConfirmingQuit(false), []);

  const handleQuitConfirm = useCallback(() => {
    if (isOnline) {
      // Online: forfeit — navigate to result as loss
      navigate(`/play/result/${gameId}?mode=${modeId}&outcome=loss&score=0`, { replace: true });
    } else {
      // Offline: no stats, just leave
      navigate('/play', { replace: true });
    }
  }, [navigate, gameId, modeId, isOnline]);

  // Close pause menu if pressing back
  useEffect(() => {
    if (!isPaused) return;
    const handler = (e: PopStateEvent) => {
      e.preventDefault();
      setIsPaused(false);
      setConfirmingQuit(false);
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [isPaused]);

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
      {/* Pause button */}
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
        isOnline={isOnline}
        confirmingQuit={confirmingQuit}
        color={color}
        onResume={handleResume}
        onRestart={handleRestart}
        onQuitRequest={handleQuitRequest}
        onQuitConfirm={handleQuitConfirm}
        onQuitCancel={handleQuitCancel}
      />

      {/* Opponent disconnect overlay (online only) */}
      {isOnline && <DisconnectOverlay visible={opponentDisconnected} color={color} />}
    </div>
  );
}

// ─── Placeholder ────────────────────────────

function GamePlaceholder({ modeId, onExit }: { modeId: string; onExit: () => void }) {
  const color = MODE_COLORS[modeId] ?? '#6C63FF';
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
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
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
          fontFamily: 'var(--font-display)',
          background: color,
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
