// ──────────────────────────────────────────────
// NINE — SudokuGrid Component
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
  onSelectCell: (row: number, col: number) => void;
  onFillCell: (value: number) => void;
  onTogglePencil: () => void;
}

// ─── Helpers ─────────────────────────────────

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

/** Returns the set of peer keys for the selected cell. */
function getPeerKeys(
  row: number,
  col: number,
): Set<string> {
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
  onSelectCell,
  onFillCell,
  onTogglePencil,
}: SudokuGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive peer keys and matching value once per render
  const peerKeys = selectedCell
    ? getPeerKeys(selectedCell.row, selectedCell.col)
    : new Set<string>();

  const selectedValue = selectedCell
    ? grid[selectedCell.row][selectedCell.col].value
    : null;

  // ── Keyboard navigation ──────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Move selection with arrow keys
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

      // Number keys 1-9
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        onFillCell(Number(e.key));
        return;
      }

      // Backspace / Delete — fill 0 (erases via hook logic of same-value toggle)
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (selectedCell) {
          const cell = grid[selectedCell.row][selectedCell.col];
          if (!cell.isGiven && cell.value !== null) {
            // Dispatch fill with the same value to clear it
            onFillCell(cell.value);
          }
        }
        return;
      }

      // P — toggle pencil mode
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onTogglePencil();
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, grid, onSelectCell, onFillCell, onTogglePencil]);

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
        'border-2 rounded-sm',
      )}
      style={{
        borderColor: 'var(--color-grid-lines)',
        // Make the grid square and responsive
        width: 'min(90vw, 90vh, 540px)',
        height: 'min(90vw, 90vh, 540px)',
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
          const boxIdx = getBoxIndex(r, c);

          return (
            <div
              key={key}
              className="relative"
              style={{
                // Box borders: thick on box boundaries, thin otherwise
                borderRight:
                  c === 8
                    ? 'none'
                    : (c + 1) % 3 === 0
                      ? '2px solid var(--color-grid-lines)'
                      : '1px solid var(--color-grid-lines)',
                borderBottom:
                  r === 8
                    ? 'none'
                    : (r + 1) % 3 === 0
                      ? '2px solid var(--color-grid-lines)'
                      : '1px solid var(--color-grid-lines)',
                opacity: 1,
              }}
              role="gridcell"
              aria-rowindex={r + 1}
              aria-colindex={c + 1}
              data-box={boxIdx}
            >
              <Cell
                cell={cell}
                isSelected={isSelected}
                isPeer={isPeer}
                isMatchingValue={isMatchingValue}
                isError={isError}
                onClick={handleCellClick}
              />
            </div>
          );
        }),
      )}
    </div>
  );
}
