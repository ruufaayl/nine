// ──────────────────────────────────────────────
// NINE — Spatial & Visual Logic Engine
// ──────────────────────────────────────────────
// Pure functions only. No DOM, no React, no side effects.

import type {
  CanvasFracturePuzzle,
  CanvasFractureState,
  Coord,
  FracturedTile,
  GridFragment,
  RotationAngle,
  ShatteredGridPuzzle,
  ShatteredGridState,
} from '../../types/visual_games';

// ═══════════════════════════════════════════════
//  SHATTERED GRID (Fragments / Polyomino Assembly)
// ═══════════════════════════════════════════════

// ─── Helpers ─────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function coordKey(r: number, c: number): string {
  return `${r},${c}`;
}

/**
 * Flood-fill from a seed cell within an `available` set.
 * Grows a contiguous polyomino of up to `maxSize` cells.
 */
function growPolyomino(
  seed: Coord,
  available: Set<string>,
  maxSize: number,
): Coord[] {
  const piece: Coord[] = [seed];
  available.delete(coordKey(seed.row, seed.col));

  const frontier: Coord[] = [...getNeighbors(seed)];

  while (piece.length < maxSize && frontier.length > 0) {
    // Pick a random frontier cell
    const idx = (Math.random() * frontier.length) | 0;
    const candidate = frontier[idx];
    frontier[idx] = frontier[frontier.length - 1];
    frontier.pop();

    const key = coordKey(candidate.row, candidate.col);
    if (!available.has(key)) continue;

    piece.push(candidate);
    available.delete(key);

    // Add new neighbors to frontier
    for (const n of getNeighbors(candidate)) {
      if (available.has(coordKey(n.row, n.col))) {
        frontier.push(n);
      }
    }
  }

  return piece;
}

function getNeighbors(c: Coord): Coord[] {
  return [
    { row: c.row - 1, col: c.col },
    { row: c.row + 1, col: c.col },
    { row: c.row, col: c.col - 1 },
    { row: c.row, col: c.col + 1 },
  ];
}

// ─── Generator ───────────────────────────────

/**
 * Split a 2D matrix into 4–6 random contiguous polyomino fragments.
 * Each fragment is a connected group of cells covering the entire grid
 * with no overlaps.
 */
export function fractureSolutionGrid(
  solution: readonly (readonly number[])[],
  targetFragments: number = 5,
): GridFragment[] {
  const height = solution.length;
  const width = solution[0].length;
  const totalCells = width * height;
  const fragmentCount = Math.max(4, Math.min(6, targetFragments));

  // Build available set
  const available = new Set<string>();
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      available.add(coordKey(r, c));
    }
  }

  // Pick spread-out seeds
  const allCoords: Coord[] = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      allCoords.push({ row: r, col: c });
    }
  }
  shuffle(allCoords);

  const fragments: GridFragment[] = [];
  const idealSize = Math.ceil(totalCells / fragmentCount);

  for (let i = 0; i < fragmentCount; i++) {
    // Find a seed that's still available
    let seed: Coord | null = null;
    for (const coord of allCoords) {
      if (available.has(coordKey(coord.row, coord.col))) {
        seed = coord;
        break;
      }
    }

    if (!seed) break;

    // Last fragment gets all remaining cells
    const isLast = i === fragmentCount - 1;
    const maxSize = isLast ? available.size : idealSize;

    const cells = growPolyomino(seed, available, maxSize);

    const values = cells.map((c) => solution[c.row][c.col]);

    fragments.push({
      id: `frag-${i}`,
      targetCoords: cells.map((c) => ({ ...c })),
      currentCoords: cells.map((c) => ({ ...c })),
      values,
      colorIndex: i,
    });
  }

  // If any cells remain (edge case), attach them to the last fragment
  if (available.size > 0) {
    const last = fragments[fragments.length - 1];
    const extraCoords: Coord[] = [];
    const extraValues: number[] = [];

    for (const key of available) {
      const [rStr, cStr] = key.split(',');
      const r = Number(rStr);
      const c = Number(cStr);
      extraCoords.push({ row: r, col: c });
      extraValues.push(solution[r][c]);
    }

    fragments[fragments.length - 1] = {
      ...last,
      targetCoords: [...last.targetCoords, ...extraCoords],
      currentCoords: [...last.currentCoords, ...extraCoords],
      values: [...last.values, ...extraValues],
    };
  }

  return fragments;
}

/**
 * Generate a complete Shattered Grid puzzle.
 * Creates a numbered matrix and fractures it.
 */
export function generateShatteredGrid(
  size: number = 4,
  fragmentCount: number = 5,
): ShatteredGridPuzzle {
  // Build a simple numbered matrix
  const solution: number[][] = [];
  let val = 1;
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      row.push(val++);
    }
    solution.push(row);
  }

  const fragments = fractureSolutionGrid(solution, fragmentCount);

  return { width: size, height: size, solution, fragments };
}

/**
 * Create initial game state with fragments displaced from target.
 * Each fragment gets a fixed large negative offset so it's clearly
 * "not placed" (outside the board). The UI renders dock fragments
 * using their bounding box, so the actual offset values just need
 * to differ from targetCoords.
 */
export function createShatteredGridState(
  puzzle: ShatteredGridPuzzle,
): ShatteredGridState {
  const displaced = puzzle.fragments.map((frag, i) => {
    // Place each fragment at a unique negative row band so they don't overlap
    // and are clearly not at their target positions.
    const offsetRow = -(puzzle.height + 2 + i * (puzzle.height + 1));
    return {
      ...frag,
      currentCoords: frag.targetCoords.map((c) => ({
        row: c.row + offsetRow,
        col: c.col,
      })),
    };
  });

  // Shuffle order so fragments aren't in solution order
  shuffle(displaced);

  return {
    puzzle,
    fragments: displaced,
    selectedFragmentIndex: null,
    moves: 0,
    isComplete: false,
    score: 0,
  };
}

/**
 * Move a fragment by a row/col delta.
 * Pure function.
 */
export function moveFragment(
  state: ShatteredGridState,
  fragmentIndex: number,
  deltaRow: number,
  deltaCol: number,
): ShatteredGridState {
  if (state.isComplete) return state;
  if (fragmentIndex < 0 || fragmentIndex >= state.fragments.length) return state;

  const frag = state.fragments[fragmentIndex];
  const nextCoords = frag.currentCoords.map((c) => ({
    row: c.row + deltaRow,
    col: c.col + deltaCol,
  }));

  const nextFragments = state.fragments.map((f, i) =>
    i === fragmentIndex ? { ...f, currentCoords: nextCoords } : f,
  );

  const nextMoves = state.moves + 1;
  const isComplete = checkAssemblyComplete(nextFragments);
  const score = isComplete ? Math.max(100, 1000 - (nextMoves - state.fragments.length) * 25) : 0;

  return {
    ...state,
    fragments: nextFragments,
    moves: nextMoves,
    isComplete,
    score,
  };
}

/**
 * Snap a fragment to specific absolute coordinates.
 * Used for drag-and-drop placement.
 * Pure function.
 */
export function snapFragment(
  state: ShatteredGridState,
  fragmentIndex: number,
  anchorRow: number,
  anchorCol: number,
): ShatteredGridState {
  if (state.isComplete) return state;
  if (fragmentIndex < 0 || fragmentIndex >= state.fragments.length) return state;

  const frag = state.fragments[fragmentIndex];
  // Compute offset from first cell's current position to the new anchor
  const baseRow = frag.currentCoords[0].row;
  const baseCol = frag.currentCoords[0].col;
  const dr = anchorRow - baseRow;
  const dc = anchorCol - baseCol;

  return moveFragment(state, fragmentIndex, dr, dc);
}

/**
 * Validate that all fragments are in their correct absolute positions
 * with no overlaps.
 */
export function validateAssembly(
  fragments: readonly GridFragment[],
): { valid: boolean; overlaps: Coord[]; misplaced: string[] } {
  const occupied = new Map<string, string>(); // coordKey → fragment id
  const overlaps: Coord[] = [];
  const misplaced: string[] = [];

  for (const frag of fragments) {
    // Check if current matches target
    const isCorrect = frag.currentCoords.length === frag.targetCoords.length &&
      frag.currentCoords.every((c, i) =>
        c.row === frag.targetCoords[i].row && c.col === frag.targetCoords[i].col,
      );

    if (!isCorrect) {
      misplaced.push(frag.id);
    }

    // Check overlaps
    for (const c of frag.currentCoords) {
      const key = coordKey(c.row, c.col);
      if (occupied.has(key)) {
        overlaps.push(c);
      } else {
        occupied.set(key, frag.id);
      }
    }
  }

  return {
    valid: overlaps.length === 0 && misplaced.length === 0,
    overlaps,
    misplaced,
  };
}

/**
 * Quick check: are all fragments at their target positions?
 */
function checkAssemblyComplete(fragments: readonly GridFragment[]): boolean {
  return fragments.every((frag) =>
    frag.currentCoords.length === frag.targetCoords.length &&
    frag.currentCoords.every((c, i) =>
      c.row === frag.targetCoords[i].row && c.col === frag.targetCoords[i].col,
    ),
  );
}

/**
 * Select a fragment by index.
 */
export function selectFragment(
  state: ShatteredGridState,
  fragmentIndex: number | null,
): ShatteredGridState {
  return { ...state, selectedFragmentIndex: fragmentIndex };
}

// ═══════════════════════════════════════════════
//  CANVAS FRACTURE (Sliding Tile / Art Muddle)
// ═══════════════════════════════════════════════

// ─── Helpers ─────────────────────────────────

/**
 * Check if two grid indices are orthogonally adjacent in a grid of `size` columns.
 */
function isAdjacent(indexA: number, indexB: number, size: number): boolean {
  const rowA = (indexA / size) | 0;
  const colA = indexA % size;
  const rowB = (indexB / size) | 0;
  const colB = indexB % size;

  const dr = Math.abs(rowA - rowB);
  const dc = Math.abs(colA - colB);

  // Exactly one step in one direction, zero in the other
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/**
 * Check if a sliding puzzle configuration is solvable.
 * Uses inversion count parity.
 */
function isSolvable(tiles: readonly FracturedTile[], size: number): boolean {
  // Count inversions among non-empty tiles (by originalIndex)
  const values = tiles.filter((t) => !t.isEmpty).map((t) => t.originalIndex);
  let inversions = 0;

  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      if (values[i] > values[j]) inversions++;
    }
  }

  if (size % 2 === 1) {
    // Odd grid: solvable if inversions are even
    return inversions % 2 === 0;
  }

  // Even grid: solvable if (inversions + row of empty from bottom) is odd
  const emptyTile = tiles.find((t) => t.isEmpty);
  if (!emptyTile) return false;
  const emptyRow = (emptyTile.currentIndex / size) | 0;
  const emptyRowFromBottom = size - 1 - emptyRow;

  return (inversions + emptyRowFromBottom) % 2 === 1;
}

// ─── Generator ───────────────────────────────

/**
 * Generate a Canvas Fracture puzzle (sliding tile).
 * Produces a solvable shuffled grid.
 */
export function generateCanvasFracture(
  size: number = 4,
  rotationEnabled: boolean = false,
): CanvasFracturePuzzle {
  return {
    size,
    totalTiles: size * size,
    rotationEnabled,
  };
}

/**
 * Create an initial shuffled game state.
 * Guarantees solvability via inversion parity check.
 */
export function createCanvasFractureState(
  puzzle: CanvasFracturePuzzle,
): CanvasFractureState {
  const { size, totalTiles } = puzzle;
  const emptyOriginalIndex = totalTiles - 1; // last tile is empty

  // Build solved tiles
  const solvedTiles: FracturedTile[] = [];
  for (let i = 0; i < totalTiles; i++) {
    solvedTiles.push({
      originalIndex: i,
      currentIndex: i,
      rotation: 0,
      isEmpty: i === emptyOriginalIndex,
    });
  }

  // Shuffle until solvable and not already solved
  let tiles: FracturedTile[];
  do {
    const indices = Array.from({ length: totalTiles }, (_, i) => i);
    shuffle(indices);

    tiles = solvedTiles.map((tile, i) => ({
      ...solvedTiles[indices[i]],
      currentIndex: i,
    }));

    // Optionally randomize rotations
    if (puzzle.rotationEnabled) {
      const angles: RotationAngle[] = [0, 90, 180, 270];
      tiles = tiles.map((t) =>
        t.isEmpty ? t : { ...t, rotation: angles[(Math.random() * 4) | 0] },
      );
    }
  } while (
    !isSolvable(tiles, size) ||
    checkCanvasComplete(tiles)
  );

  const emptyIndex = tiles.findIndex((t) => t.isEmpty);

  return {
    puzzle,
    tiles,
    emptyIndex,
    moves: 0,
    isComplete: false,
    score: 0,
  };
}

/**
 * Move a tile into the empty slot.
 * Enforces orthogonal adjacency — returns unchanged state if invalid.
 * Pure function.
 */
export function moveTile(
  state: CanvasFractureState,
  tileIndex: number,
): CanvasFractureState {
  if (state.isComplete) return state;

  const { tiles, emptyIndex, puzzle } = state;
  const { size } = puzzle;

  // Validate: tile must be adjacent to empty
  if (!isAdjacent(tileIndex, emptyIndex, size)) return state;

  // Tile at the clicked position
  const clickedTile = tiles[tileIndex];
  const emptyTile = tiles[emptyIndex];

  if (!clickedTile || clickedTile.isEmpty) return state;

  // Swap: clicked tile moves to empty position, empty moves to clicked position
  const nextTiles = tiles.map((t) => ({ ...t }));
  nextTiles[emptyIndex] = { ...clickedTile, currentIndex: emptyIndex };
  nextTiles[tileIndex] = { ...emptyTile, currentIndex: tileIndex };

  const nextMoves = state.moves + 1;
  const isComplete = checkCanvasComplete(nextTiles);
  const score = isComplete
    ? Math.max(200, 2000 - (nextMoves - puzzle.totalTiles) * 15)
    : 0;

  return {
    ...state,
    tiles: nextTiles,
    emptyIndex: tileIndex,
    moves: nextMoves,
    isComplete,
    score,
  };
}

/**
 * Rotate a tile 90° clockwise.
 * Only valid when rotationEnabled is true.
 * Pure function.
 */
export function rotateTile(
  state: CanvasFractureState,
  tileIndex: number,
): CanvasFractureState {
  if (state.isComplete) return state;
  if (!state.puzzle.rotationEnabled) return state;

  const tile = state.tiles[tileIndex];
  if (!tile || tile.isEmpty) return state;

  const nextRotation = ((tile.rotation + 90) % 360) as RotationAngle;

  const nextTiles = state.tiles.map((t, i) =>
    i === tileIndex ? { ...t, rotation: nextRotation } : t,
  );

  const nextMoves = state.moves + 1;
  const isComplete = checkCanvasComplete(nextTiles);
  const score = isComplete
    ? Math.max(200, 2000 - (nextMoves - state.puzzle.totalTiles) * 15)
    : 0;

  return {
    ...state,
    tiles: nextTiles,
    moves: nextMoves,
    isComplete,
    score,
  };
}

/**
 * Check if every tile is at its target index with rotation 0.
 */
export function checkCanvasComplete(tiles: readonly FracturedTile[]): boolean {
  return tiles.every(
    (tile) => tile.originalIndex === tile.currentIndex && tile.rotation === 0,
  );
}

/**
 * Get the neighbors of the empty slot (valid move targets).
 */
export function getMovableTiles(state: CanvasFractureState): number[] {
  const { emptyIndex, puzzle } = state;
  const { size, totalTiles } = puzzle;
  const movable: number[] = [];

  for (let i = 0; i < totalTiles; i++) {
    if (i !== emptyIndex && isAdjacent(i, emptyIndex, size)) {
      movable.push(i);
    }
  }

  return movable;
}

/**
 * Get statistics for a completed puzzle.
 */
export function getCanvasFractureStats(state: CanvasFractureState): {
  moves: number;
  score: number;
  efficiency: number;
} {
  // Minimum possible moves for an N-puzzle is hard to compute exactly,
  // so we use totalTiles as a rough baseline
  const baseline = state.puzzle.totalTiles;
  const efficiency = state.moves > 0
    ? Math.min(1, baseline / state.moves)
    : 0;

  return {
    moves: state.moves,
    score: state.score,
    efficiency: Math.round(efficiency * 100) / 100,
  };
}
