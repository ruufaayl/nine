// ──────────────────────────────────────────────
// NINE — SudokuGrid Component (Liquid Design)
// ──────────────────────────────────────────────

import { useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Cell } from './Cell';
import { getBoxIndex, getPeers } from '../../lib/sudoku';
import type { Grid } from '../../types/game';

// ─── Types ───────────────────────────────────

interface SudokuGridProps {
  grid: Grid;
  selectedCell: { row: number; col: number } | null;
  errors: Set<string>;
  isPencilMode: boolean;
  foggedCells?: Set<string>;
  lastCorrectCell?: { row: number; col: number } | null;
  lastErrorCell?: { row: number; col: number } | null;
  lockedCells?: Set<string>;
  onSelectCell: (row: number, col: number) => void;
  onFillCell: (value: number) => void;
  onErase: () => void;
  onTogglePencil: () => void;
}

// ─── Helpers ─────────────────────────────────

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function getPeerKeys(row: number, col: number): Set<string> {
  const peers = getPeers(row, col);
  const keys = new Set<string>();
  for (const [pr, pc] of peers) {
    keys.add(cellKey(pr, pc));
  }
  return keys;
}

// ─── Component ───────────────────────────────

export function SudokuGrid({
  grid,
  selectedCell,
  errors,
  isPencilMode,
  foggedCells,
  lastCorrectCell,
  lastErrorCell,
  lockedCells,
  onSelectCell,
  onFillCell,
  onErase,
  onTogglePencil,
}: SudokuGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const peerKeys = selectedCell
    ? getPeerKeys(selectedCell.row, selectedCell.col)
    : new Set<string>();

  const selectedValue = selectedCell
    ? grid[selectedCell.row][selectedCell.col].value
    : null;

  // ── Keyboard navigation ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        selectedCell &&
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      ) {
        e.preventDefault();
        const { row, col } = selectedCell;
        const delta: Record<string, [number, number]> = {
          ArrowUp: [-1, 0],
          ArrowDown: [1, 0],
          ArrowLeft: [0, -1],
          ArrowRight: [0, 1],
        };
        const [dr, dc] = delta[e.key];
        const nextRow = Math.max(0, Math.min(8, row + dr));
        const nextCol = Math.max(0, Math.min(8, col + dc));
        onSelectCell(nextRow, nextCol);
        return;
      }

      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        onFillCell(Number(e.key));
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        onErase();
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onTogglePencil();
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, grid, onSelectCell, onFillCell, onErase, onTogglePencil]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      onSelectCell(row, col);
    },
    [onSelectCell],
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={clsx(
        'relative grid grid-cols-9 grid-rows-9',
        'outline-none focus:outline-none',
        'overflow-hidden',
      )}
      style={{
        width: 'min(88vw, 88vh, 480px)',
        height: 'min(88vw, 88vh, 480px)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
      }}
      role="grid"
      aria-label="Sudoku board"
    >
      {grid.map((rowCells, r) =>
        rowCells.map((cell, c) => {
          const key = cellKey(r, c);
          const isSelected =
            selectedCell?.row === r && selectedCell?.col === c;
          const isPeer = !isSelected && peerKeys.has(key);
          const isMatchingValue =
            !isSelected &&
            selectedValue !== null &&
            cell.value === selectedValue;
          const isError = errors.has(key);
          const isFogged = foggedCells?.has(key) ?? false;
          const isCorrectFlash =
            lastCorrectCell?.row === r && lastCorrectCell?.col === c;
          const isErrorShake =
            lastErrorCell?.row === r && lastErrorCell?.col === c;
          const isLockedByOpponent = lockedCells?.has(key) ?? false;

          // Box boundary borders
          const isBoxRight = c === 2 || c === 5;
          const isBoxBottom = r === 2 || r === 5;
          const isLastCol = c === 8;
          const isLastRow = r === 8;

          return (
            <div
              key={key}
              style={{
                borderRight: !isLastCol
                  ? isBoxRight
                    ? '2px solid var(--border-strong)'
                    : '1px solid var(--border-subtle)'
                  : undefined,
                borderBottom: !isLastRow
                  ? isBoxBottom
                    ? '2px solid var(--border-strong)'
                    : '1px solid var(--border-subtle)'
                  : undefined,
              }}
              role="gridcell"
              aria-rowindex={r + 1}
              aria-colindex={c + 1}
              data-box={getBoxIndex(r, c)}
            >
              <Cell
                cell={cell}
                isSelected={isSelected}
                isPeer={isPeer}
                isMatchingValue={isMatchingValue}
                isError={isError}
                isFogged={isFogged}
                isCorrectFlash={isCorrectFlash}
                isErrorShake={isErrorShake}
                isLockedByOpponent={isLockedByOpponent}
                onClick={handleCellClick}
              />
            </div>
          );
        }),
      )}
    </div>
  );
}
