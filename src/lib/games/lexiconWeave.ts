// ──────────────────────────────────────────────
// NINE — Lexicon / Enigma Weave (Crossword) Engine
// ──────────────────────────────────────────────

import type {
  ClueDirection,
  CrosswordCell,
  CrosswordClue,
  CrosswordPuzzle,
  CrosswordState,
} from '../../types/trivia_games';

// ─── Grid Helpers ────────────────────────────

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

/**
 * Create an empty crossword grid.
 * All cells default to 'void'. Call `placeWord` to carve input cells.
 */
function createEmptyGrid(width: number, height: number): CrosswordCell[][] {
  const grid: CrosswordCell[][] = [];
  for (let r = 0; r < height; r++) {
    const row: CrosswordCell[] = [];
    for (let c = 0; c < width; c++) {
      row.push({
        type: 'void',
        solution: null,
        playerValue: null,
        clueNumber: null,
        row: r,
        col: c,
      });
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Place a word onto the grid, converting void cells to input cells.
 * Returns true if placement succeeds without conflicts.
 */
function placeWord(
  grid: CrosswordCell[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: ClueDirection,
): boolean {
  const dr = direction === 'down' ? 1 : 0;
  const dc = direction === 'across' ? 1 : 0;
  const upper = word.toUpperCase();

  // Validate placement: check bounds and conflicts
  for (let i = 0; i < upper.length; i++) {
    const r = startRow + dr * i;
    const c = startCol + dc * i;

    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
      return false;
    }

    const existing = grid[r][c];
    if (existing.type === 'input' && existing.solution !== upper[i]) {
      return false; // conflict
    }
  }

  // Place
  for (let i = 0; i < upper.length; i++) {
    const r = startRow + dr * i;
    const c = startCol + dc * i;
    grid[r][c] = {
      ...grid[r][c],
      type: 'input',
      solution: upper[i],
    };
  }

  return true;
}

/**
 * Assign clue numbers to cells that start a word.
 */
function assignClueNumbers(
  grid: CrosswordCell[][],
  clues: CrosswordClue[],
): void {
  for (const clue of clues) {
    const cell = grid[clue.startRow][clue.startCol];
    grid[clue.startRow][clue.startCol] = {
      ...cell,
      clueNumber: clue.number,
    };
  }
}

// ─── Public API ──────────────────────────────

/**
 * Build a crossword puzzle from a clue/answer definition.
 * This is the construction function — takes pre-authored data
 * and produces a validated grid with intersections checked.
 */
export function buildCrosswordPuzzle(
  width: number,
  height: number,
  clueData: readonly {
    number: number;
    direction: ClueDirection;
    text: string;
    startRow: number;
    startCol: number;
    answer: string;
  }[],
  title: string = 'Lexicon Weave',
  isCryptic: boolean = false,
): CrosswordPuzzle {
  const grid = createEmptyGrid(width, height);

  const clues: CrosswordClue[] = clueData.map((cd) => ({
    number: cd.number,
    direction: cd.direction,
    text: cd.text,
    startRow: cd.startRow,
    startCol: cd.startCol,
    length: cd.answer.length,
    answer: cd.answer.toUpperCase(),
  }));

  // Place all words
  for (const clue of clues) {
    const success = placeWord(
      grid,
      clue.answer,
      clue.startRow,
      clue.startCol,
      clue.direction,
    );
    if (!success) {
      throw new Error(
        `Crossword conflict: cannot place "${clue.answer}" at (${clue.startRow},${clue.startCol}) ${clue.direction}`,
      );
    }
  }

  assignClueNumbers(grid, clues);

  return { width, height, grid, clues, isCryptic, title };
}

/**
 * Check that an intersection cell is consistent:
 * the letter placed by the across word must equal the letter placed by the down word.
 * Returns true if the cell at (row, col) has no conflict.
 */
export function checkIntersection(
  grid: CrosswordCell[][],
  row: number,
  col: number,
): boolean {
  const cell = grid[row][col];
  if (cell.type !== 'input' || cell.playerValue === null) return true;
  if (cell.solution === null) return true;

  return cell.playerValue.toUpperCase() === cell.solution;
}

/**
 * Validate all intersection points across the entire grid.
 * Returns an array of conflicting cell coordinates.
 */
export function validateAllIntersections(
  grid: CrosswordCell[][],
): { row: number; col: number }[] {
  const conflicts: { row: number; col: number }[] = [];

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (!checkIntersection(grid, r, c)) {
        conflicts.push({ row: r, col: c });
      }
    }
  }

  return conflicts;
}

/**
 * Create a fresh crossword game state.
 */
export function createCrosswordState(
  puzzle: CrosswordPuzzle,
): CrosswordState {
  return {
    puzzle,
    focusRow: 0,
    focusCol: 0,
    focusDirection: 'across',
    correctCells: new Set<string>(),
    errorCells: new Set<string>(),
    isComplete: false,
    score: 0,
  };
}

/**
 * Place a letter at (row, col) in the crossword.
 * Returns the updated state. Pure function.
 */
export function placeLetter(
  state: CrosswordState,
  row: number,
  col: number,
  letter: string,
): CrosswordState {
  if (state.isComplete) return state;

  const cell = state.puzzle.grid[row][col];
  if (cell.type !== 'input') return state;

  // Deep clone the grid row
  const nextGrid = state.puzzle.grid.map((r) => r.map((c) => ({ ...c })));
  nextGrid[row][col] = {
    ...nextGrid[row][col],
    playerValue: letter.toUpperCase(),
  };

  const nextCorrect = new Set(state.correctCells);
  const key = cellKey(row, col);

  if (nextGrid[row][col].playerValue === nextGrid[row][col].solution) {
    nextCorrect.add(key);
  } else {
    nextCorrect.delete(key);
  }

  // Check completion: all input cells must have correct values
  let isComplete = true;
  for (const gridRow of nextGrid) {
    for (const c of gridRow) {
      if (c.type === 'input' && c.playerValue !== c.solution) {
        isComplete = false;
        break;
      }
    }
    if (!isComplete) break;
  }

  // Score: +10 per correct letter
  const newScore = nextCorrect.size * 10;

  return {
    ...state,
    puzzle: { ...state.puzzle, grid: nextGrid },
    correctCells: nextCorrect,
    isComplete,
    score: newScore,
  };
}

/**
 * Check the grid and reveal errors.
 * Returns the state with errorCells populated.
 */
export function revealErrors(state: CrosswordState): CrosswordState {
  const errors = new Set<string>();

  for (const row of state.puzzle.grid) {
    for (const cell of row) {
      if (
        cell.type === 'input' &&
        cell.playerValue !== null &&
        cell.playerValue !== cell.solution
      ) {
        errors.add(cellKey(cell.row, cell.col));
      }
    }
  }

  return { ...state, errorCells: errors };
}

/**
 * Get the word currently being edited based on focus position and direction.
 */
export function getActiveWord(
  state: CrosswordState,
): CrosswordClue | null {
  const { focusRow, focusCol, focusDirection, puzzle } = state;

  for (const clue of puzzle.clues) {
    if (clue.direction !== focusDirection) continue;

    const dr = clue.direction === 'down' ? 1 : 0;
    const dc = clue.direction === 'across' ? 1 : 0;

    for (let i = 0; i < clue.length; i++) {
      const r = clue.startRow + dr * i;
      const c = clue.startCol + dc * i;
      if (r === focusRow && c === focusCol) return clue;
    }
  }

  return null;
}
