// ──────────────────────────────────────────────
// NINE — Race Mode Screen (1v1 PvP)
// ──────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import clsx from 'clsx';
import { useRaceMode } from '../../hooks/useRaceMode';
import { useGameState } from '../../hooks/useGameState';
import { SudokuGrid } from '../Board/SudokuGrid';
import { NumberPad } from '../Board/NumberPad';
import { GhostGrid } from '../Board/GhostGrid';
import { getBoxIndex } from '../../lib/sudoku';

// ─── Types ──────────────────────────────────

interface RaceModeProps {
  userId: string;
  onExit: () => void;
}

// ─── Search Radar ───────────────────────────

function SearchRadar({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white gap-8 px-6">
      {/* Radar */}
      <div className="relative w-32 h-32">
        {/* Concentric rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-purple-500/20"
            style={{
              margin: `${i * 12}px`,
            }}
            animate={{ opacity: [0.15, 0.4, 0.15] }}
            transition={{
              repeat: Infinity,
              duration: 2,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Sweep line */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-1/2 h-px origin-left"
          style={{
            background: 'linear-gradient(90deg, rgba(168,85,247,0.8), transparent)',
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        />

        {/* Center dot */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 rounded-full bg-purple-500"
          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-3 text-center">
        <motion.span
          className="text-sm font-bold uppercase tracking-[0.2em] text-white/60"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Connecting to Matchmaker...
        </motion.span>
        <span className="text-[0.55rem] uppercase tracking-[0.3em] text-white/20">
          Valkey Queue · Searching for Opponents
        </span>
      </div>

      {/* Cancel */}
      <motion.button
        className="px-6 py-3 rounded-lg border border-white/10 text-xs font-semibold uppercase tracking-widest text-white/40"
        whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.3)' }}
        whileTap={{ scale: 0.97 }}
        onClick={onCancel}
      >
        Cancel
      </motion.button>
    </div>
  );
}

// ─── Match Result Overlay ───────────────────

interface ResultOverlayProps {
  result: 'won' | 'lost';
  elapsed: number;
  xp: number;
  onExit: () => void;
  onRematch: () => void;
}

function ResultOverlay({ result, elapsed, xp, onExit, onRematch }: ResultOverlayProps) {
  const isWin = result === 'won';
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex flex-col items-center gap-5 px-8 py-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md max-w-xs w-full text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <motion.span
          className="text-6xl"
          animate={{ rotate: isWin ? [0, -10, 10, -5, 5, 0] : [0, -3, 3, -2, 2, 0] }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {isWin ? '◈' : '✕'}
        </motion.span>

        <h2
          className="text-3xl font-black tracking-widest uppercase"
          style={{ color: isWin ? 'var(--color-accent)' : 'var(--color-error)' }}
        >
          {isWin ? 'Victory' : 'Defeated'}
        </h2>

        <p
          className="text-sm uppercase tracking-widest opacity-60"
          style={{ color: 'var(--color-primary-text)' }}
        >
          Time: {timeStr}
        </p>

        {isWin && (
          <motion.p
            className="text-xl font-black tabular-nums"
            style={{ color: 'var(--color-accent)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 400 }}
          >
            +{xp} XP
          </motion.p>
        )}

        <div className="flex gap-3 w-full mt-2">
          <motion.button
            className="flex-1 py-3 rounded-lg border border-white/10 text-sm font-semibold text-white/60"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onExit}
          >
            Lobby
          </motion.button>
          <motion.button
            className="flex-1 py-3 rounded-lg text-sm font-bold"
            style={{
              background: isWin ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)',
              color: isWin ? 'var(--color-background)' : 'var(--color-primary-text)',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRematch}
          >
            Rematch
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────

export function RaceMode({ userId, onExit }: RaceModeProps) {
  const {
    matchState,
    matchResult,
    matchInfo,
    opponentProgress,
    opponentCellCount,
    opponentBoxCompletions,
    latestBoxFlash,
    findMatch,
    cancelMatch,
    sendCellFill,
    sendBoxComplete,
    sendGameWon,
    resetRace,
  } = useRaceMode(userId);

  const {
    currentGrid,
    selectedCell,
    isPencilMode,
    errors,
    isComplete,
    activeTheme,
    xp,
    foggedCells,
    initGame,
    selectCell,
    fillCell,
    togglePencil,
    resetGame,
  } = useGameState();

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCellCountRef = useRef(0);
  const sentBoxesRef = useRef(new Set<number>());

  // ── Init the puzzle when match starts ──
  useEffect(() => {
    if (matchState === 'playing' && matchInfo) {
      initGame('medium', 'jade-serpent', 'classic');
      setElapsed(0);
      prevCellCountRef.current = 0;
      sentBoxesRef.current = new Set();
    }
  }, [matchState, matchInfo, initGame]);

  // ── Elapsed timer during play ──
  useEffect(() => {
    if (matchState !== 'playing' || isComplete) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [matchState, isComplete]);

  // ── Detect cell fills and broadcast ──
  useEffect(() => {
    if (matchState !== 'playing' || !currentGrid) return;

    // Count filled non-given cells
    let filledCount = 0;
    for (const row of currentGrid) {
      for (const cell of row) {
        if (cell.value !== null && !cell.isGiven) filledCount++;
      }
    }

    // Detect newly filled cells
    if (filledCount > prevCellCountRef.current && selectedCell) {
      sendCellFill(selectedCell.row, selectedCell.col);

      // Check if a box was completed
      const boxIdx = getBoxIndex(selectedCell.row, selectedCell.col);
      if (!sentBoxesRef.current.has(boxIdx)) {
        const boxStartRow = Math.floor(boxIdx / 3) * 3;
        const boxStartCol = (boxIdx % 3) * 3;
        let boxFilled = true;

        for (let r = boxStartRow; r < boxStartRow + 3; r++) {
          for (let c = boxStartCol; c < boxStartCol + 3; c++) {
            if (currentGrid[r][c].value === null) {
              boxFilled = false;
              break;
            }
          }
          if (!boxFilled) break;
        }

        if (boxFilled) {
          sendBoxComplete(boxIdx);
          sentBoxesRef.current.add(boxIdx);
        }
      }
    }

    prevCellCountRef.current = filledCount;
  }, [matchState, currentGrid, selectedCell, sendCellFill, sendBoxComplete]);

  // ── Detect win and broadcast ──
  useEffect(() => {
    if (isComplete && matchState === 'playing') {
      sendGameWon(elapsed * 1000, xp);
    }
  }, [isComplete, matchState, elapsed, xp, sendGameWon]);

  // ── Erase handler ──
  const handleErase = useCallback(() => {
    if (!currentGrid || !selectedCell) return;
    const cell = currentGrid[selectedCell.row][selectedCell.col];
    if (!cell.isGiven && cell.value !== null) {
      fillCell(cell.value);
    }
  }, [currentGrid, selectedCell, fillCell]);

  // ── Handle rematch ──
  const handleRematch = useCallback(() => {
    resetRace();
    findMatch('prime-grid');
  }, [resetRace, findMatch]);

  // ── Theme vars ──
  const themeVars = activeTheme
    ? ({
        '--color-background': activeTheme.colors.background,
        '--color-grid-lines': activeTheme.colors.gridLines,
        '--color-primary-text': activeTheme.colors.primaryText,
        '--color-accent': activeTheme.colors.accent,
        '--color-error': activeTheme.colors.error,
      } as React.CSSProperties)
    : {};

  // ── IDLE: find match button ──
  if (matchState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white gap-8 px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.h1
            className="text-5xl font-black tracking-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            RACE
          </motion.h1>
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-white/25">
            1v1 · First to solve wins
          </p>
        </div>

        <motion.button
          className="px-8 py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em]"
          style={{ background: '#a855f7', color: '#0a0a0f' }}
          whileHover={{ scale: 1.05, opacity: 0.9 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => findMatch('prime-grid')}
        >
          Find Match
        </motion.button>

        <motion.button
          className="text-[0.6rem] uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
          whileTap={{ scale: 0.95 }}
          onClick={onExit}
        >
          ← Back to Lobby
        </motion.button>
      </div>
    );
  }

  // ── SEARCHING: radar UI ──
  if (matchState === 'searching') {
    return <SearchRadar onCancel={() => { cancelMatch(); onExit(); }} />;
  }

  // ── PLAYING / FINISHED: split-screen race ──
  return (
    <div
      className="relative flex flex-col min-h-screen overflow-hidden"
      style={{ background: 'var(--color-background)', ...themeVars }}
    >
      {/* Header */}
      <motion.header
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'var(--color-grid-lines)' }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <motion.button
          className="text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-primary-text)' }}
          whileTap={{ scale: 0.94 }}
          onClick={onExit}
        >
          ← Exit
        </motion.button>

        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-xs font-black uppercase tracking-[0.15em]"
            style={{ color: '#a855f7' }}
          >
            RACE MODE
          </span>
          <span className="text-[0.5rem] uppercase tracking-widest text-white/20">
            vs {matchInfo?.opponentId?.slice(0, 8) ?? '???'}
          </span>
        </div>

        {/* Timer */}
        <span
          className="text-xs font-mono font-bold tabular-nums"
          style={{ color: 'var(--color-primary-text)', opacity: 0.5 }}
        >
          {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
          {String(elapsed % 60).padStart(2, '0')}
        </span>
      </motion.header>

      {/* Main content: Your Grid + Ghost */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 px-4 py-4">
        {/* Your board (primary) */}
        <div className="flex flex-col items-center gap-4">
          {currentGrid && (
            <>
              <SudokuGrid
                grid={currentGrid}
                selectedCell={selectedCell}
                errors={errors}
                isPencilMode={isPencilMode}
                foggedCells={foggedCells}
                onSelectCell={selectCell}
                onFillCell={fillCell}
                onTogglePencil={togglePencil}
              />
              <NumberPad
                grid={currentGrid}
                isPencilMode={isPencilMode}
                onFillCell={fillCell}
                onErase={handleErase}
                onTogglePencil={togglePencil}
              />
            </>
          )}
        </div>

        {/* Opponent ghost (secondary) */}
        <div className="lg:self-start lg:pt-4">
          <GhostGrid
            filledCells={opponentProgress}
            completedBoxes={opponentBoxCompletions}
            latestBoxFlash={latestBoxFlash}
            opponentCellCount={opponentCellCount}
          />
        </div>
      </div>

      {/* Match Result Overlay */}
      <AnimatePresence>
        {matchState === 'finished' && matchResult && (
          <ResultOverlay
            result={matchResult}
            elapsed={elapsed}
            xp={xp}
            onExit={onExit}
            onRematch={handleRematch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
