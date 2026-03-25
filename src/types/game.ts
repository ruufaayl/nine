// ──────────────────────────────────────────────
// NINE — Core Game Types
// ──────────────────────────────────────────────

export type CellValue = number | null; // 1-9 or null

export interface Cell {
  readonly row: number;
  readonly col: number;
  value: CellValue;
  isGiven: boolean;
  pencilMarks: Set<number>;
  isValid: boolean;
}

/** A single row of 9 cells. */
export type GridRow = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell];

/** A complete 9×9 Sudoku grid. */
export type Grid = [
  GridRow,
  GridRow,
  GridRow,
  GridRow,
  GridRow,
  GridRow,
  GridRow,
  GridRow,
  GridRow,
];

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface GamePuzzle {
  /** The starting grid with holes (unsolved). */
  initial: Grid;
  /** The fully solved grid. */
  solved: Grid;
  difficulty: Difficulty;
}

export interface CharacterTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    gridLines: string;
    primaryText: string;
    accent: string;
    error: string;
  };
}
