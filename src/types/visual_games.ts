// ──────────────────────────────────────────────
// NINE — Visual & Spatial Game Types
// ──────────────────────────────────────────────

// ─── Shared ─────────────────────────────────

export interface Coord {
  row: number;
  col: number;
}

// ─── Shattered Grid (Fragments) ─────────────

export interface GridFragment {
  /** Unique fragment identifier. */
  id: string;
  /** The cells this fragment occupies in the solved state (absolute coords). */
  targetCoords: readonly Coord[];
  /** The cells this fragment currently occupies (absolute coords). */
  currentCoords: readonly Coord[];
  /** The value at each coordinate (parallel array with targetCoords). */
  values: readonly number[];
  /** Visual color index for rendering distinct fragments. */
  colorIndex: number;
}

export interface ShatteredGridPuzzle {
  /** Grid width. */
  width: number;
  /** Grid height. */
  height: number;
  /** The original solved matrix (row-major). */
  solution: readonly (readonly number[])[];
  /** The fragments the player must reassemble. */
  fragments: readonly GridFragment[];
}

export interface ShatteredGridState {
  puzzle: ShatteredGridPuzzle;
  /** Mutable fragment placements (same order as puzzle.fragments). */
  fragments: GridFragment[];
  /** Index of the currently selected/dragged fragment, or null. */
  selectedFragmentIndex: number | null;
  /** Number of moves made. */
  moves: number;
  /** Whether the puzzle is solved. */
  isComplete: boolean;
  /** Score: base 1000, decays with moves. */
  score: number;
}

// ─── Canvas Fracture (Art Muddle) ───────────

export type RotationAngle = 0 | 90 | 180 | 270;

export interface FracturedTile {
  /** Original index in the solved grid (0-based, row-major). */
  originalIndex: number;
  /** Current index in the grid (0-based, row-major). */
  currentIndex: number;
  /** Current rotation in degrees. */
  rotation: RotationAngle;
  /** Whether this is the empty slot (sliding puzzle hole). */
  isEmpty: boolean;
}

export interface CanvasFracturePuzzle {
  /** Grid side length (e.g., 4 for a 4×4 / 15-puzzle). */
  size: number;
  /** Total tiles including the empty slot (size × size). */
  totalTiles: number;
  /** Whether rotation is enabled (Art Muddle variant). */
  rotationEnabled: boolean;
}

export interface CanvasFractureState {
  puzzle: CanvasFracturePuzzle;
  /** Row-major grid: tiles[gridIndex] = the tile currently at that position. */
  tiles: FracturedTile[];
  /** Grid index of the empty slot. */
  emptyIndex: number;
  /** Number of moves made. */
  moves: number;
  /** Whether the puzzle is solved. */
  isComplete: boolean;
  /** Score: base 2000, decays with moves. */
  score: number;
}
