// ──────────────────────────────────────────────
// NINE — Glyph Grid (Wordoku) Engine
// ──────────────────────────────────────────────

import type {
  GlyphCell,
  GlyphGrid,
  GlyphGridPuzzle,
  GlyphRow,
} from '../../types/expanded_games';

// ─── Constants ───────────────────────────────

const SIZE = 9;
const BOX = 3;

/** Curated heterograms (9-letter words with no repeating letters). */
const HETEROGRAMS: readonly string[] = [
  'TURBOFANS',
  'NIGHTMARE',
  'ALCHEMY',
  'WOMANIZER',
  'SUBTROPIC',
  'DUMPLINGS',
  'THUMBSCRE',
  'EXORCISM',
  'AMBIGUITY',
  'KRYPTONSE',
  // Filtered at runtime to exactly 9 unique letters
];

// ─── Internal helpers ────────────────────────

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function getValidHeterogram(): string {
  const candidates = HETEROGRAMS.filter((w) => {
    const upper = w.toUpperCase();
    return upper.length === 9 && new Set(upper).size === 9;
  });
  return candidates[Math.floor(Math.random() * candidates.length)].toUpperCase();
}

/** Check whether placing `charIdx` at (row, col) is valid on the numeric board. */
function isValidPlacement(
  board: number[][],
  row: number,
  col: number,
  val: number,
): boolean {
  for (let c = 0; c < SIZE; c++) {
    if (board[row][c] === val) return false;
  }
  for (let r = 0; r < SIZE; r++) {
    if (board[r][col] === val) return false;
  }
  const startR = ((row / BOX) | 0) * BOX;
  const startC = ((col / BOX) | 0) * BOX;
  for (let r = startR; r < startR + BOX; r++) {
    for (let c = startC; c < startC + BOX; c++) {
      if (board[r][c] === val) return false;
    }
  }
  return true;
}

/**
 * Fill the board via backtracking with shuffled candidates.
 * Constraint: the main diagonal (r,r) must spell the heterogram in order,
 * so diagonal cells are pre-seeded before solving.
 */
function fillBoard(board: number[][]): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== 0) continue;

      const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const val of candidates) {
        if (isValidPlacement(board, r, c, val)) {
          board[r][c] = val;
          if (fillBoard(board)) return true;
          board[r][c] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

function numBoardToGlyphGrid(
  board: number[][],
  givenBoard: number[][],
  charMap: readonly string[],
): GlyphGrid {
  const rows: GlyphRow[] = [];
  for (let r = 0; r < SIZE; r++) {
    const row: GlyphCell[] = [];
    for (let c = 0; c < SIZE; c++) {
      const val = board[r][c];
      row.push({
        row: r,
        col: c,
        value: val === 0 ? null : charMap[val - 1],
        isGiven: givenBoard[r][c] !== 0,
        pencilMarks: new Set<string>(),
        isValid: true,
      });
    }
    rows.push(row as GlyphRow);
  }
  return rows as unknown as GlyphGrid;
}

// ─── Public API ──────────────────────────────

/**
 * Generate a Glyph Grid puzzle.
 * The main diagonal spells the heterogram in order.
 */
export function generateGlyphGrid(holesToRemove: number = 45): GlyphGridPuzzle {
  const heterogram = getValidHeterogram();
  const charMap = [...heterogram] as unknown as readonly [
    string, string, string, string, string, string, string, string, string,
  ];

  // Build numeric board with diagonal pre-seeded
  const board: number[][] = Array.from({ length: SIZE }, () =>
    new Array<number>(SIZE).fill(0),
  );

  // Seed diagonal: position (i, i) = i+1 (maps to charMap[i])
  for (let i = 0; i < SIZE; i++) {
    board[i][i] = i + 1;
  }

  fillBoard(board);

  // Clone for puzzle with holes
  const puzzle = board.map((row) => row.slice());

  // Remove cells
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number]),
  );

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= holesToRemove) break;
    // Never remove diagonal cells (they spell the word)
    if (r === c) continue;
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      removed++;
    }
  }

  const solvedGrid = numBoardToGlyphGrid(board, board, charMap);
  const initialGrid = numBoardToGlyphGrid(puzzle, puzzle, charMap);

  return {
    heterogram,
    charMap,
    initial: initialGrid,
    solved: solvedGrid,
    diagonalWord: heterogram,
  };
}

/** Validate placing a character at (row, col) in a GlyphGrid. */
export function validateGlyphMove(
  grid: GlyphGrid,
  row: number,
  col: number,
  char: string,
): boolean {
  for (let c = 0; c < SIZE; c++) {
    if (c !== col && grid[row][c].value === char) return false;
  }
  for (let r = 0; r < SIZE; r++) {
    if (r !== row && grid[r][col].value === char) return false;
  }
  const startR = ((row / BOX) | 0) * BOX;
  const startC = ((col / BOX) | 0) * BOX;
  for (let r = startR; r < startR + BOX; r++) {
    for (let c = startC; c < startC + BOX; c++) {
      if ((r !== row || c !== col) && grid[r][c].value === char) return false;
    }
  }
  return true;
}
