// ──────────────────────────────────────────────
// NINE — Sudoku Engine (pure, synchronous)
// ──────────────────────────────────────────────

import type {
  Cell,
  CellValue,
  Difficulty,
  GamePuzzle,
  Grid,
  GridRow,
} from '../types/game';

// ─── Constants ───────────────────────────────

const SIZE = 9;
const BOX = 3;
const EMPTY = 0;

/** Number of cells to remove per difficulty. [min, max] */
const HOLES: Record<Difficulty, [number, number]> = {
  easy: [36, 40],
  medium: [41, 48],
  hard: [49, 53],
  expert: [54, 58],
};

// ─── Internal helpers ────────────────────────

/** Fisher-Yates in-place shuffle. Returns the same array. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/** Create a fresh 9×9 board filled with 0. */
function emptyBoard(): number[][] {
  const board: number[][] = [];
  for (let r = 0; r < SIZE; r++) {
    board.push(new Array<number>(SIZE).fill(EMPTY));
  }
  return board;
}

/** Deep-clone a 9×9 number board. */
function cloneBoard(board: number[][]): number[][] {
  const copy: number[][] = [];
  for (let r = 0; r < SIZE; r++) {
    copy.push(board[r].slice());
  }
  return copy;
}

/**
 * Check whether placing `val` at (row, col) is valid on `board`.
 * Assumes the cell is currently EMPTY.
 */
function isValidPlacement(
  board: number[][],
  row: number,
  col: number,
  val: number,
): boolean {
  // Row check
  for (let c = 0; c < SIZE; c++) {
    if (board[row][c] === val) return false;
  }
  // Column check
  for (let r = 0; r < SIZE; r++) {
    if (board[r][col] === val) return false;
  }
  // Box check
  const boxR = (row / BOX) | 0;
  const boxC = (col / BOX) | 0;
  const startR = boxR * BOX;
  const startC = boxC * BOX;
  for (let r = startR; r < startR + BOX; r++) {
    for (let c = startC; c < startC + BOX; c++) {
      if (board[r][c] === val) return false;
    }
  }
  return true;
}

/**
 * Fill `board` completely using backtracking with randomised candidate order.
 * Mutates `board` in place. Returns true on success.
 */
function fillBoard(board: number[][]): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) continue;

      const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const val of candidates) {
        if (isValidPlacement(board, r, c, val)) {
          board[r][c] = val;
          if (fillBoard(board)) return true;
          board[r][c] = EMPTY;
        }
      }
      return false; // trigger backtrack
    }
  }
  return true; // all cells filled
}

/**
 * Count solutions of `board` up to `limit`.
 * Returns as soon as `limit` solutions are found.
 */
function countSolutions(board: number[][], limit: number): number {
  // Find first empty cell
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) continue;

      let count = 0;
      for (let val = 1; val <= SIZE; val++) {
        if (isValidPlacement(board, r, c, val)) {
          board[r][c] = val;
          count += countSolutions(board, limit - count);
          board[r][c] = EMPTY;
          if (count >= limit) return count;
        }
      }
      return count;
    }
  }
  return 1; // board is full → one solution
}

/** Returns true when the board has exactly one solution. */
function hasUniqueSolution(board: number[][]): boolean {
  return countSolutions(cloneBoard(board), 2) === 1;
}

/** Random int in [min, max]. */
function randRange(min: number, max: number): number {
  return min + ((Math.random() * (max - min + 1)) | 0);
}

/**
 * Convert a raw number[][] board into a typed Grid of Cell objects.
 * `givenBoard` marks which cells are givens.
 */
function toGrid(board: number[][], givenBoard: number[][]): Grid {
  const rows: GridRow[] = [];
  for (let r = 0; r < SIZE; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < SIZE; c++) {
      const val = board[r][c];
      row.push({
        row: r,
        col: c,
        value: val === EMPTY ? null : val,
        isGiven: givenBoard[r][c] !== EMPTY,
        pencilMarks: new Set<number>(),
        isValid: true,
      });
    }
    rows.push(row as GridRow);
  }
  return rows as unknown as Grid;
}

// ─── Public API ──────────────────────────────

/**
 * Return the 0-8 index of the 3×3 box that contains (row, col).
 *
 *   0 | 1 | 2
 *   ---------
 *   3 | 4 | 5
 *   ---------
 *   6 | 7 | 8
 */
export function getBoxIndex(row: number, col: number): number {
  return ((row / BOX) | 0) * BOX + ((col / BOX) | 0);
}

/**
 * Return coordinates of every peer of (row, col) — i.e. all cells
 * sharing the same row, column, or 3×3 box, excluding (row, col) itself.
 */
export function getPeers(
  row: number,
  col: number,
): ReadonlyArray<[number, number]> {
  const seen = new Set<number>(); // encode as row*9+col
  const peers: [number, number][] = [];
  const key = row * SIZE + col;

  // Same row
  for (let c = 0; c < SIZE; c++) {
    const k = row * SIZE + c;
    if (k !== key && !seen.has(k)) {
      seen.add(k);
      peers.push([row, c]);
    }
  }
  // Same column
  for (let r = 0; r < SIZE; r++) {
    const k = r * SIZE + col;
    if (k !== key && !seen.has(k)) {
      seen.add(k);
      peers.push([r, col]);
    }
  }
  // Same box
  const startR = ((row / BOX) | 0) * BOX;
  const startC = ((col / BOX) | 0) * BOX;
  for (let r = startR; r < startR + BOX; r++) {
    for (let c = startC; c < startC + BOX; c++) {
      const k = r * SIZE + c;
      if (k !== key && !seen.has(k)) {
        seen.add(k);
        peers.push([r, c]);
      }
    }
  }

  return peers;
}

/**
 * Check whether placing `value` at (row, col) is valid according to
 * standard Sudoku rules (no duplicate in row, column, or 3×3 box).
 *
 * The cell at (row, col) is treated as empty for the purposes of the check,
 * regardless of its current value.
 */
export function validateMove(
  grid: Grid,
  row: number,
  col: number,
  value: number,
): boolean {
  // Row
  for (let c = 0; c < SIZE; c++) {
    if (c !== col && grid[row][c].value === value) return false;
  }
  // Column
  for (let r = 0; r < SIZE; r++) {
    if (r !== row && grid[r][col].value === value) return false;
  }
  // Box
  const startR = ((row / BOX) | 0) * BOX;
  const startC = ((col / BOX) | 0) * BOX;
  for (let r = startR; r < startR + BOX; r++) {
    for (let c = startC; c < startC + BOX; c++) {
      if (r !== row && c !== col && grid[r][c].value === value) return false;
    }
  }
  return true;
}

/**
 * Check whether the 3×3 box at `boxIndex` (0-8) is fully and correctly
 * filled — all nine values 1-9 present with no nulls or duplicates.
 */
export function isBoxComplete(grid: Grid, boxIndex: number): boolean {
  const startR = ((boxIndex / BOX) | 0) * BOX;
  const startC = (boxIndex % BOX) * BOX;
  const seen = new Set<number>();

  for (let r = startR; r < startR + BOX; r++) {
    for (let c = startC; c < startC + BOX; c++) {
      const v = grid[r][c].value;
      if (v === null || v < 1 || v > SIZE || seen.has(v)) return false;
      seen.add(v);
    }
  }
  return seen.size === SIZE;
}

/**
 * Generate a Sudoku puzzle synchronously.
 *
 * 1. Build a fully solved grid via randomised backtracking.
 * 2. Remove cells (count determined by difficulty) while preserving
 *    a unique solution.
 *
 * Returns a `GamePuzzle` containing the playable grid, the solution,
 * and the difficulty tag.
 */
export function generatePuzzle(difficulty: Difficulty): GamePuzzle {
  // Step 1 — create a solved board
  const solved = emptyBoard();
  fillBoard(solved);

  // Step 2 — remove cells
  const puzzle = cloneBoard(solved);
  const [minHoles, maxHoles] = HOLES[difficulty];
  const targetHoles = randRange(minHoles, maxHoles);

  // Build a shuffled list of all 81 cell positions
  const positions: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= targetHoles) break;

    const backup = puzzle[r][c];
    puzzle[r][c] = EMPTY;

    if (hasUniqueSolution(puzzle)) {
      removed++;
    } else {
      puzzle[r][c] = backup; // restore — removal would create ambiguity
    }
  }

  // Step 3 — convert to typed grids
  const solvedGrid = toGrid(solved, solved);
  const initialGrid = toGrid(puzzle, puzzle);

  return {
    initial: initialGrid,
    solved: solvedGrid,
    difficulty,
  };
}
