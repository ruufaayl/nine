// ──────────────────────────────────────────────
// NINE — Cinema Lattice (Movie Matrix) Engine
// ──────────────────────────────────────────────

import type {
  CinemaAnswer,
  CinemaEntity,
  CinemaLatticeCell,
  CinemaLatticeGrid,
  CinemaLatticePuzzle,
  CinemaLatticeState,
} from '../../types/expanded_games';

// ─── Movie Database ──────────────────────────

interface MovieRecord {
  title: string;
  year: number;
  directors: readonly string[];
  actors: readonly string[];
  genres: readonly string[];
}

const MOVIE_DB: readonly MovieRecord[] = [
  { title: 'Inception', year: 2010, directors: ['Christopher Nolan'], actors: ['Leonardo DiCaprio', 'Tom Hardy', 'Cillian Murphy'], genres: ['Sci-Fi', 'Action'] },
  { title: 'The Dark Knight', year: 2008, directors: ['Christopher Nolan'], actors: ['Christian Bale', 'Heath Ledger', 'Gary Oldman', 'Cillian Murphy'], genres: ['Action', 'Crime'] },
  { title: 'Interstellar', year: 2014, directors: ['Christopher Nolan'], actors: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'], genres: ['Sci-Fi', 'Drama'] },
  { title: 'Oppenheimer', year: 2023, directors: ['Christopher Nolan'], actors: ['Cillian Murphy', 'Robert Downey Jr.', 'Matt Damon'], genres: ['Drama', 'History'] },
  { title: 'The Revenant', year: 2015, directors: ['Alejandro Iñárritu'], actors: ['Leonardo DiCaprio', 'Tom Hardy'], genres: ['Drama', 'Adventure'] },
  { title: 'Mad Max: Fury Road', year: 2015, directors: ['George Miller'], actors: ['Tom Hardy', 'Charlize Theron'], genres: ['Action', 'Sci-Fi'] },
  { title: 'The Wolf of Wall Street', year: 2013, directors: ['Martin Scorsese'], actors: ['Leonardo DiCaprio', 'Margot Robbie', 'Jonah Hill'], genres: ['Crime', 'Comedy'] },
  { title: 'Goodfellas', year: 1990, directors: ['Martin Scorsese'], actors: ['Robert De Niro', 'Ray Liotta', 'Joe Pesci'], genres: ['Crime', 'Drama'] },
  { title: 'The Departed', year: 2006, directors: ['Martin Scorsese'], actors: ['Leonardo DiCaprio', 'Matt Damon', 'Jack Nicholson'], genres: ['Crime', 'Thriller'] },
  { title: 'Shutter Island', year: 2010, directors: ['Martin Scorsese'], actors: ['Leonardo DiCaprio', 'Mark Ruffalo'], genres: ['Thriller', 'Mystery'] },
  { title: 'Iron Man', year: 2008, directors: ['Jon Favreau'], actors: ['Robert Downey Jr.', 'Gwyneth Paltrow'], genres: ['Action', 'Sci-Fi'] },
  { title: 'The Avengers', year: 2012, directors: ['Joss Whedon'], actors: ['Robert Downey Jr.', 'Chris Evans', 'Scarlett Johansson', 'Mark Ruffalo'], genres: ['Action', 'Sci-Fi'] },
  { title: 'Fight Club', year: 1999, directors: ['David Fincher'], actors: ['Brad Pitt', 'Edward Norton'], genres: ['Drama', 'Thriller'] },
  { title: 'Se7en', year: 1995, directors: ['David Fincher'], actors: ['Brad Pitt', 'Morgan Freeman'], genres: ['Crime', 'Thriller'] },
  { title: 'The Curious Case of Benjamin Button', year: 2008, directors: ['David Fincher'], actors: ['Brad Pitt', 'Cate Blanchett'], genres: ['Drama', 'Fantasy'] },
  { title: 'Gone Girl', year: 2014, directors: ['David Fincher'], actors: ['Ben Affleck', 'Rosamund Pike'], genres: ['Thriller', 'Mystery'] },
  { title: 'Barbie', year: 2023, directors: ['Greta Gerwig'], actors: ['Margot Robbie', 'Ryan Gosling'], genres: ['Comedy', 'Fantasy'] },
  { title: 'Once Upon a Time in Hollywood', year: 2019, directors: ['Quentin Tarantino'], actors: ['Leonardo DiCaprio', 'Brad Pitt', 'Margot Robbie'], genres: ['Drama', 'Comedy'] },
  { title: 'Pulp Fiction', year: 1994, directors: ['Quentin Tarantino'], actors: ['John Travolta', 'Samuel L. Jackson', 'Uma Thurman'], genres: ['Crime', 'Drama'] },
  { title: 'Django Unchained', year: 2012, directors: ['Quentin Tarantino'], actors: ['Jamie Foxx', 'Leonardo DiCaprio', 'Christoph Waltz'], genres: ['Drama', 'Western'] },
  { title: 'The Dark Knight Rises', year: 2012, directors: ['Christopher Nolan'], actors: ['Christian Bale', 'Tom Hardy', 'Anne Hathaway'], genres: ['Action', 'Crime'] },
  { title: 'Dunkirk', year: 2017, directors: ['Christopher Nolan'], actors: ['Tom Hardy', 'Cillian Murphy', 'Mark Ruffalo'], genres: ['Action', 'Drama'] },
];

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

/** Find all movies matching a row entity AND a col entity. */
function findIntersection(
  row: CinemaEntity,
  col: CinemaEntity,
): CinemaAnswer[] {
  return MOVIE_DB.filter((movie) => {
    const matchesRow = entityMatchesMovie(row, movie);
    const matchesCol = entityMatchesMovie(col, movie);
    return matchesRow && matchesCol;
  }).map((m) => ({ movieTitle: m.title, year: m.year }));
}

function entityMatchesMovie(entity: CinemaEntity, movie: MovieRecord): boolean {
  switch (entity.type) {
    case 'director':
      return movie.directors.includes(entity.name);
    case 'actor':
      return movie.actors.includes(entity.name);
    case 'genre':
      return movie.genres.includes(entity.name);
    case 'decade': {
      const decade = parseInt(entity.name, 10);
      return movie.year >= decade && movie.year < decade + 10;
    }
  }
}

/**
 * Build entity pool from the movie database.
 */
function buildEntityPool(): { directors: CinemaEntity[]; actors: CinemaEntity[] } {
  const directorSet = new Set<string>();
  const actorSet = new Set<string>();

  for (const movie of MOVIE_DB) {
    for (const d of movie.directors) directorSet.add(d);
    for (const a of movie.actors) actorSet.add(a);
  }

  const directors: CinemaEntity[] = [...directorSet].map((name) => ({
    id: `dir-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    type: 'director' as const,
  }));

  const actors: CinemaEntity[] = [...actorSet].map((name) => ({
    id: `act-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    type: 'actor' as const,
  }));

  return { directors, actors };
}

// ─── Public API ──────────────────────────────

/**
 * Generate a Cinema Lattice puzzle.
 * Selects 3 directors for rows and 3 actors for columns,
 * ensuring every intersection has at least one valid movie.
 */
export function generateCinemaLattice(): CinemaLatticePuzzle {
  const { directors, actors } = buildEntityPool();

  // Try random combinations until we find a valid 3×3
  const maxAttempts = 200;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rowCandidates = shuffle([...directors]).slice(0, 3);
    const colCandidates = shuffle([...actors]).slice(0, 3);

    let valid = true;
    const gridRows: CinemaLatticeCell[][] = [];

    for (const rowEntity of rowCandidates) {
      const gridRow: CinemaLatticeCell[] = [];
      for (const colEntity of colCandidates) {
        const answers = findIntersection(rowEntity, colEntity);
        if (answers.length === 0) {
          valid = false;
          break;
        }
        gridRow.push({
          rowEntity,
          colEntity,
          validAnswers: answers,
          playerAnswer: null,
          isCorrect: null,
        });
      }
      if (!valid) break;
      gridRows.push(gridRow);
    }

    if (valid && gridRows.length === 3) {
      return {
        rowEntities: rowCandidates as unknown as CinemaLatticePuzzle['rowEntities'],
        colEntities: colCandidates as unknown as CinemaLatticePuzzle['colEntities'],
        grid: gridRows as unknown as CinemaLatticeGrid,
      };
    }
  }

  // Fallback: guaranteed valid combo (Nolan × DiCaprio/Hardy/Murphy)
  const fallbackRows: CinemaEntity[] = [
    { id: 'dir-nolan', name: 'Christopher Nolan', type: 'director' },
    { id: 'dir-scorsese', name: 'Martin Scorsese', type: 'director' },
    { id: 'dir-fincher', name: 'David Fincher', type: 'director' },
  ];
  const fallbackCols: CinemaEntity[] = [
    { id: 'act-dicaprio', name: 'Leonardo DiCaprio', type: 'actor' },
    { id: 'act-hardy', name: 'Tom Hardy', type: 'actor' },
    { id: 'act-pitt', name: 'Brad Pitt', type: 'actor' },
  ];

  const gridRows: CinemaLatticeCell[][] = [];
  for (const rowEntity of fallbackRows) {
    const gridRow: CinemaLatticeCell[] = [];
    for (const colEntity of fallbackCols) {
      gridRow.push({
        rowEntity,
        colEntity,
        validAnswers: findIntersection(rowEntity, colEntity),
        playerAnswer: null,
        isCorrect: null,
      });
    }
    gridRows.push(gridRow);
  }

  return {
    rowEntities: fallbackRows as unknown as CinemaLatticePuzzle['rowEntities'],
    colEntities: fallbackCols as unknown as CinemaLatticePuzzle['colEntities'],
    grid: gridRows as unknown as CinemaLatticeGrid,
  };
}

/**
 * Create a fresh game state.
 */
export function createCinemaLatticeState(
  puzzle: CinemaLatticePuzzle,
  maxGuesses: number = 9,
): CinemaLatticeState {
  return {
    puzzle,
    correctCount: 0,
    guessesRemaining: maxGuesses,
    solved: false,
  };
}

/**
 * Submit a movie guess for a specific cell.
 * Pure function — returns the next state.
 */
export function submitCinemaGuess(
  state: CinemaLatticeState,
  row: number,
  col: number,
  guess: string,
): CinemaLatticeState {
  if (state.solved || state.guessesRemaining <= 0) return state;

  const cell = state.puzzle.grid[row][col];
  if (cell.isCorrect === true) return state; // already solved

  const normalizedGuess = guess.trim().toLowerCase();
  const isCorrect = cell.validAnswers.some(
    (a) => a.movieTitle.toLowerCase() === normalizedGuess,
  );

  // Deep clone the grid
  const nextGrid = state.puzzle.grid.map((r) =>
    r.map((c) => ({ ...c })),
  ) as unknown as CinemaLatticeGrid;

  nextGrid[row][col] = {
    ...nextGrid[row][col],
    playerAnswer: guess.trim(),
    isCorrect,
  };

  const nextCorrect = state.correctCount + (isCorrect ? 1 : 0);
  const nextGuessesRemaining = state.guessesRemaining - 1;

  return {
    puzzle: { ...state.puzzle, grid: nextGrid },
    correctCount: nextCorrect,
    guessesRemaining: nextGuessesRemaining,
    solved: nextCorrect === 9,
  };
}

/**
 * Normalize a movie title for fuzzy comparison.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check a guess with fuzzy matching (ignores punctuation, case).
 */
export function fuzzyMatchTitle(
  guess: string,
  validAnswers: readonly CinemaAnswer[],
): boolean {
  const normalized = normalizeTitle(guess);
  return validAnswers.some(
    (a) => normalizeTitle(a.movieTitle) === normalized,
  );
}
