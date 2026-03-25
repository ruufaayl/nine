// ──────────────────────────────────────────────
// NINE — Shattered Grid (Polyomino) UI Component
// ──────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion, type PanInfo, type Variants } from 'framer-motion';
import clsx from 'clsx';
import { useShatteredGrid } from '../../hooks/useShatteredGrid';
import type { Coord, GridFragment } from '../../types/visual_games';

// ─── Types ──────────────────────────────────

interface ShatteredGridProps {
  onExit: () => void;
}

// ─── Constants ──────────────────────────────

const CELL_SIZE = 56; // px per grid cell
const SNAP_THRESHOLD = CELL_SIZE * 0.6;

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
}

function AssemblyBoard({ width, height, placedFragments, flashFragmentIndex }: BoardProps) {
  return (
    <div
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

            {/* Flash overlay on successful snap */}
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
  onSelect: () => void;
  onSnap: (anchorRow: number, anchorCol: number) => void;
}

function DragFragment({
  frag,
  index,
  isSelected,
  gridWidth,
  gridHeight,
  onSelect,
  onSnap,
}: DragFragmentProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Compute bounding box of fragment cells for rendering
  const minRow = Math.min(...frag.currentCoords.map((c) => c.row));
  const minCol = Math.min(...frag.currentCoords.map((c) => c.col));
  const maxRow = Math.max(...frag.currentCoords.map((c) => c.row));
  const maxCol = Math.max(...frag.currentCoords.map((c) => c.col));
  const fragWidth = (maxCol - minCol + 1) * CELL_SIZE;
  const fragHeight = (maxRow - minRow + 1) * CELL_SIZE;

  const handleDragEnd = useCallback(
    (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);

      // Calculate where the anchor (first cell) would land
      const offsetX = info.offset.x;
      const offsetY = info.offset.y;

      // Snap to nearest grid position
      const baseCoord = frag.currentCoords[0];
      const newCol = baseCoord.col + Math.round(offsetX / CELL_SIZE);
      const newRow = baseCoord.row + Math.round(offsetY / CELL_SIZE);

      // Validate within bounds
      const allInBounds = frag.currentCoords.every((c) => {
        const nr = c.row - baseCoord.row + newRow;
        const nc = c.col - baseCoord.col + newCol;
        return nr >= 0 && nr < gridHeight && nc >= 0 && nc < gridWidth;
      });

      if (allInBounds && (Math.abs(offsetX) > SNAP_THRESHOLD || Math.abs(offsetY) > SNAP_THRESHOLD)) {
        onSnap(newRow, newCol);
      }
    },
    [frag, gridWidth, gridHeight, onSnap],
  );

  return (
    <motion.div
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
      {/* Glow when dragging */}
      {isDragging && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: '0 0 20px rgba(var(--accent-rgb, 74,144,226), 0.4)',
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
          className="text-[0.6rem] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors"
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

      {/* Assembly Board (center) */}
      <div className="flex items-center justify-center px-5 py-6">
        <AssemblyBoard
          width={gridWidth}
          height={gridHeight}
          placedFragments={placedFragments}
          flashFragmentIndex={flashFragmentIndex}
        />
      </div>

      {/* Fragment Dock (bottom) */}
      <div className="w-full px-5 pb-8">
        <div className="flex flex-col gap-2">
          <span
            className="text-[0.55rem] uppercase tracking-[0.25em] text-center"
            style={{ color: 'var(--color-accent)', opacity: 0.4 }}
          >
            Drag fragments to the board
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
                onSelect={() => handleFragSelect(index)}
                onSnap={(anchorRow, anchorCol) => handleFragSnap(index, anchorRow, anchorCol)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Completion Overlay */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <motion.div
              className="flex flex-col items-center gap-5 px-8 py-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md max-w-xs w-full text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <span
                className="text-2xl font-black tracking-wide"
                style={{ color: 'var(--color-accent)' }}
              >
                GRID REASSEMBLED
              </span>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex flex-col items-center gap-1 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-lg font-black tabular-nums" style={{ color: 'var(--color-primary-text)' }}>
                    {moves}
                  </span>
                  <span className="text-[0.5rem] uppercase tracking-widest text-white/30">Moves</span>
                </div>
                <div className="flex flex-col items-center gap-1 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-lg font-black tabular-nums" style={{ color: 'var(--color-accent)' }}>
                    {score.toLocaleString()}
                  </span>
                  <span className="text-[0.5rem] uppercase tracking-widest text-white/30">Score</span>
                </div>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <motion.button
                  className="flex-1 py-3 rounded-lg border border-white/10 text-sm font-semibold text-white/60"
                  whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onExit}
                >
                  Lobby
                </motion.button>
                <motion.button
                  className="flex-1 py-3 rounded-lg text-sm font-bold"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-background)' }}
                  whileHover={{ scale: 1.03, opacity: 0.9 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => reset()}
                >
                  Again
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
