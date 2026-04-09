// ──────────────────────────────────────────────
// NINE — Shattered Grid (Polyomino) UI Component
// Drag fragments from the dock onto the board.
// Best-of-5 rounds — fastest total time wins.
// ──────────────────────────────────────────────

import { useCallback, useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion, type PanInfo, type Variants } from 'framer-motion';
import clsx from 'clsx';
import { useShatteredGrid } from '../../hooks/useShatteredGrid';
import type { Coord, GridFragment } from '../../types/visual_games';

// ─── Types ──────────────────────────────────

interface ShatteredGridProps {
  onExit: () => void;
}

// ─── Constants ──────────────────────────────

const CELL_SIZE = 56;
const TOTAL_ROUNDS = 5;

const FRAGMENT_COLORS = [
  'rgba(74,144,226,0.25)',
  'rgba(157,111,211,0.25)',
  'rgba(0,204,51,0.25)',
  'rgba(212,165,116,0.25)',
  'rgba(255,107,107,0.25)',
  'rgba(255,193,7,0.25)',
];

const FRAGMENT_BORDERS = [
  'rgba(74,144,226,0.5)',
  'rgba(157,111,211,0.5)',
  'rgba(0,204,51,0.5)',
  'rgba(212,165,116,0.5)',
  'rgba(255,107,107,0.5)',
  'rgba(255,193,7,0.5)',
];

// ─── Animation Variants ─────────────────────

const flashVariants: Variants = {
  idle: { opacity: 0 },
  flash: {
    opacity: [0, 0.8, 0],
    transition: { duration: 0.15, ease: 'easeOut' as const },
  },
};

// ─── Assembly Board ─────────────────────────

interface BoardProps {
  width: number;
  height: number;
  placedFragments: { frag: GridFragment; index: number }[];
  flashFragmentIndex: number | null;
  boardRef: React.RefObject<HTMLDivElement | null>;
}

function AssemblyBoard({ width, height, placedFragments, flashFragmentIndex, boardRef }: BoardProps) {
  return (
    <div
      ref={boardRef}
      className="relative rounded-lg border border-white/[0.06] overflow-hidden"
      style={{
        width: width * CELL_SIZE,
        height: height * CELL_SIZE,
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      {/* Grid lines */}
      {Array.from({ length: width * height }, (_, i) => {
        const r = Math.floor(i / width);
        const c = i % width;
        return (
          <div
            key={i}
            className="absolute border-r border-b border-white/[0.04]"
            style={{
              left: c * CELL_SIZE,
              top: r * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          />
        );
      })}

      {/* Placed fragments */}
      {placedFragments.map(({ frag, index }) =>
        frag.currentCoords.map((coord, ci) => (
          <motion.div
            key={`${frag.id}-${ci}`}
            className="absolute rounded-[2px] flex items-center justify-center text-xs font-bold tabular-nums"
            style={{
              left: coord.col * CELL_SIZE + 1,
              top: coord.row * CELL_SIZE + 1,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              background: FRAGMENT_COLORS[frag.colorIndex % FRAGMENT_COLORS.length],
              border: `1px solid ${FRAGMENT_BORDERS[frag.colorIndex % FRAGMENT_BORDERS.length]}`,
              color: 'rgba(255,255,255,0.5)',
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {frag.values[ci]}

            {flashFragmentIndex === index && (
              <motion.div
                className="absolute inset-0 rounded-[2px]"
                style={{ background: 'white' }}
                variants={flashVariants}
                initial="idle"
                animate="flash"
              />
            )}
          </motion.div>
        )),
      )}
    </div>
  );
}

// ─── Draggable Fragment ─────────────────────

interface DragFragmentProps {
  frag: GridFragment;
  index: number;
  isSelected: boolean;
  gridWidth: number;
  gridHeight: number;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onSnap: (anchorRow: number, anchorCol: number) => void;
}

function DragFragment({
  frag,
  index,
  isSelected,
  gridWidth,
  gridHeight,
  boardRef,
  onSelect,
  onSnap,
}: DragFragmentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fragRef = useRef<HTMLDivElement | null>(null);

  // Compute bounding box of fragment cells for rendering
  const minRow = Math.min(...frag.currentCoords.map((c) => c.row));
  const minCol = Math.min(...frag.currentCoords.map((c) => c.col));
  const maxRow = Math.max(...frag.currentCoords.map((c) => c.row));
  const maxCol = Math.max(...frag.currentCoords.map((c) => c.col));
  const fragWidth = (maxCol - minCol + 1) * CELL_SIZE;
  const fragHeight = (maxRow - minRow + 1) * CELL_SIZE;

  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);

      const board = boardRef.current;
      const fragEl = fragRef.current;
      if (!board || !fragEl) return;

      const boardRect = board.getBoundingClientRect();
      const fragRect = fragEl.getBoundingClientRect();

      // The first cell of the fragment in the visual element is at (0,0) offset
      // relative to the fragment's bounding box. But the first cell might not
      // be at minRow/minCol. We need the offset of currentCoords[0] within the bbox.
      const baseCoord = frag.currentCoords[0];
      const cellOffsetX = (baseCoord.col - minCol) * CELL_SIZE;
      const cellOffsetY = (baseCoord.row - minRow) * CELL_SIZE;

      // Screen position of the first cell's center after drag
      const cellCenterX = fragRect.left + cellOffsetX + CELL_SIZE / 2;
      const cellCenterY = fragRect.top + cellOffsetY + CELL_SIZE / 2;

      // Convert to grid coordinates relative to the board
      const gridCol = Math.round((cellCenterX - boardRect.left) / CELL_SIZE - 0.5);
      const gridRow = Math.round((cellCenterY - boardRect.top) / CELL_SIZE - 0.5);

      // Validate ALL cells of the fragment would be within bounds
      const allInBounds = frag.currentCoords.every((c) => {
        const nr = c.row - baseCoord.row + gridRow;
        const nc = c.col - baseCoord.col + gridCol;
        return nr >= 0 && nr < gridHeight && nc >= 0 && nc < gridWidth;
      });

      // Check the fragment is actually over the board (not just in-bounds arithmetically)
      const overBoard =
        cellCenterX >= boardRect.left - CELL_SIZE &&
        cellCenterX <= boardRect.right + CELL_SIZE &&
        cellCenterY >= boardRect.top - CELL_SIZE &&
        cellCenterY <= boardRect.bottom + CELL_SIZE;

      if (allInBounds && overBoard) {
        onSnap(gridRow, gridCol);
      }
    },
    [frag, gridWidth, gridHeight, boardRef, onSnap, minCol, minRow],
  );

  return (
    <motion.div
      ref={fragRef}
      className={clsx(
        'relative cursor-grab active:cursor-grabbing',
        'rounded-lg',
      )}
      style={{
        width: fragWidth,
        height: fragHeight,
      }}
      drag
      dragMomentum={false}
      dragSnapToOrigin
      onDragStart={() => {
        setIsDragging(true);
        onSelect();
      }}
      onDragEnd={handleDragEnd}
      animate={{
        scale: isDragging ? 1.05 : 1,
        zIndex: isDragging ? 50 : 1,
      }}
      whileHover={{ scale: 1.02 }}
    >
      {isDragging && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: '0 0 20px rgba(74,144,226, 0.4)',
          }}
        />
      )}

      {frag.currentCoords.map((coord, ci) => (
        <div
          key={ci}
          className="absolute rounded-[2px] flex items-center justify-center text-xs font-bold tabular-nums"
          style={{
            left: (coord.col - minCol) * CELL_SIZE,
            top: (coord.row - minRow) * CELL_SIZE,
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
            background: FRAGMENT_COLORS[frag.colorIndex % FRAGMENT_COLORS.length],
            border: `1px solid ${FRAGMENT_BORDERS[frag.colorIndex % FRAGMENT_BORDERS.length]}`,
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          {frag.values[ci]}
        </div>
      ))}
    </motion.div>
  );
}

// ─── Timer Display ──────────────────────────

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const centis = Math.floor((ms % 1000) / 10);
  return `${mins}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

// ─── Main Component ─────────────────────────

export function ShatteredGrid({ onExit }: ShatteredGridProps) {
  const {
    fragments,
    gridWidth,
    gridHeight,
    selectedFragmentIndex,
    moves,
    isComplete,
    score,
    flashFragmentIndex,
    completionPulse,
    placedFragments,
    dockFragments,
    selectFragment,
    snapTo,
    clearFlash,
    reset,
  } = useShatteredGrid(4);

  const boardRef = useRef<HTMLDivElement | null>(null);

  // ── Round & Timer State ──
  const [round, setRound] = useState(1);
  const [roundTimes, setRoundTimes] = useState<number[]>([]);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [matchComplete, setMatchComplete] = useState(false);

  // Tick timer
  useEffect(() => {
    if (matchComplete) return;
    const id = setInterval(() => {
      setElapsed(Date.now() - roundStartTime);
    }, 33);
    return () => clearInterval(id);
  }, [roundStartTime, matchComplete]);

  // Handle round completion
  useEffect(() => {
    if (!isComplete || matchComplete) return;

    const roundTime = Date.now() - roundStartTime;
    const newTimes = [...roundTimes, roundTime];
    setRoundTimes(newTimes);

    if (round >= TOTAL_ROUNDS) {
      setMatchComplete(true);
    }
  }, [isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextRound = useCallback(() => {
    setRound((r) => r + 1);
    setRoundStartTime(Date.now());
    setElapsed(0);
    reset();
  }, [reset]);

  const handleRestart = useCallback(() => {
    setRound(1);
    setRoundTimes([]);
    setRoundStartTime(Date.now());
    setElapsed(0);
    setMatchComplete(false);
    reset();
  }, [reset]);

  const totalTime = roundTimes.reduce((sum, t) => sum + t, 0);

  const handleFragSelect = useCallback(
    (index: number) => {
      selectFragment(index);
    },
    [selectFragment],
  );

  const handleFragSnap = useCallback(
    (fragIndex: number, anchorRow: number, anchorCol: number) => {
      snapTo(fragIndex, anchorRow, anchorCol);
    },
    [snapTo],
  );

  return (
    <div
      className="relative flex flex-col items-center min-h-screen overflow-hidden"
      style={{ background: 'var(--color-background)' }}
    >
      {/* Header */}
      <header className="w-full max-w-2xl flex items-center justify-between px-5 pt-5 pb-3">
        <motion.button
          className="text-[0.6rem] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors cursor-pointer"
          whileTap={{ scale: 0.95 }}
          onClick={onExit}
        >
          ← Lobby
        </motion.button>
        <h1
          className="text-sm font-black uppercase tracking-[0.15em]"
          style={{ color: 'var(--color-primary-text)' }}
        >
          Shattered Grid
        </h1>
        <span className="text-xs tabular-nums text-white/30">{moves} moves</span>
      </header>

      {/* Round & Timer Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between px-5 pb-3">
        <div className="flex items-center gap-3">
          {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full transition-colors duration-200"
              style={{
                background:
                  i < roundTimes.length
                    ? 'var(--accent-success)'
                    : i === round - 1
                      ? 'var(--accent-secondary)'
                      : 'rgba(255,255,255,0.1)',
                boxShadow:
                  i === round - 1 && !matchComplete
                    ? '0 0 8px var(--accent-secondary)'
                    : 'none',
              }}
            />
          ))}
          <span className="text-[0.5rem] uppercase tracking-widest text-white/25 ml-1">
            Round {round}/{TOTAL_ROUNDS}
          </span>
        </div>
        <span
          className="text-sm font-black tabular-nums"
          style={{ fontFamily: 'var(--font-primary)', color: 'var(--accent-secondary)' }}
        >
          {formatTime(isComplete ? (roundTimes[roundTimes.length - 1] ?? elapsed) : elapsed)}
        </span>
      </div>

      {/* Assembly Board (center) */}
      <div className="flex items-center justify-center px-5 py-6">
        <AssemblyBoard
          width={gridWidth}
          height={gridHeight}
          placedFragments={placedFragments}
          flashFragmentIndex={flashFragmentIndex}
          boardRef={boardRef}
        />
      </div>

      {/* Fragment Dock (bottom) */}
      <div className="w-full px-5 pb-8">
        <div className="flex flex-col gap-2">
          <span
            className="text-[0.55rem] uppercase tracking-[0.25em] text-center"
            style={{ color: 'var(--color-accent)', opacity: 0.4 }}
          >
            Drag fragments onto the board
          </span>
          <div className="flex flex-wrap gap-4 justify-center items-center min-h-[80px] p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
            {dockFragments.length === 0 && !isComplete && (
              <span className="text-xs text-white/20">All placed — verify positions</span>
            )}
            {dockFragments.map(({ frag, index }) => (
              <DragFragment
                key={frag.id}
                frag={frag}
                index={index}
                isSelected={selectedFragmentIndex === index}
                gridWidth={gridWidth}
                gridHeight={gridHeight}
                boardRef={boardRef}
                onSelect={() => handleFragSelect(index)}
                onSnap={(anchorRow, anchorCol) => handleFragSnap(index, anchorRow, anchorCol)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Round Complete Overlay */}
      <AnimatePresence>
        {isComplete && !matchComplete && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.div
              className="flex flex-col items-center gap-5 px-8 py-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md max-w-xs w-full text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <span
                className="text-xl font-black tracking-wide uppercase"
                style={{ color: 'var(--color-accent)' }}
              >
                Round {round} Complete!
              </span>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex flex-col items-center gap-1 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-lg font-black tabular-nums" style={{ color: 'var(--color-primary-text)' }}>
                    {moves}
                  </span>
                  <span className="text-[0.5rem] uppercase tracking-widest text-white/30">Moves</span>
                </div>
                <div className="flex flex-col items-center gap-1 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-lg font-black tabular-nums" style={{ color: 'var(--accent-secondary)' }}>
                    {formatTime(roundTimes[roundTimes.length - 1] ?? 0)}
                  </span>
                  <span className="text-[0.5rem] uppercase tracking-widest text-white/30">Time</span>
                </div>
              </div>

              <motion.button
                className="w-full py-3 rounded-lg text-sm font-bold cursor-pointer"
                style={{ background: 'var(--color-accent)', color: 'var(--color-background)' }}
                whileHover={{ scale: 1.03, opacity: 0.9 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNextRound}
              >
                Round {round + 1} →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Complete Overlay */}
      <AnimatePresence>
        {matchComplete && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <motion.div
              className="flex flex-col items-center gap-5 px-8 py-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md max-w-sm w-full text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <span
                className="text-2xl font-black tracking-wide"
                style={{ color: 'var(--color-accent)' }}
              >
                MATCH COMPLETE
              </span>

              {/* Round breakdown */}
              <div className="w-full flex flex-col gap-1">
                {roundTimes.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03]"
                  >
                    <span className="text-[0.5rem] uppercase tracking-widest text-white/30">
                      Round {i + 1}
                    </span>
                    <span className="text-xs font-bold tabular-nums text-white/60">
                      {formatTime(t)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total time */}
              <div className="flex flex-col items-center gap-1 py-4 w-full rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span
                  className="text-2xl font-black tabular-nums"
                  style={{ color: 'var(--accent-secondary)' }}
                >
                  {formatTime(totalTime)}
                </span>
                <span className="text-[0.5rem] uppercase tracking-widest text-white/30">Total Time</span>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <motion.button
                  className="flex-1 py-3 rounded-lg border border-white/10 text-sm font-semibold text-white/60 cursor-pointer"
                  whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onExit}
                >
                  Lobby
                </motion.button>
                <motion.button
                  className="flex-1 py-3 rounded-lg text-sm font-bold cursor-pointer"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-background)' }}
                  whileHover={{ scale: 1.03, opacity: 0.9 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRestart}
                >
                  Play Again
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
