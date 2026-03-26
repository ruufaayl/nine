#!/usr/bin/env npx tsx
// ──────────────────────────────────────────────
// NINE — One-shot migration: add performance indexes
// Run:  npx tsx scripts/add-indexes.ts
// ──────────────────────────────────────────────

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 });

const INDEXES = [
  // Users
  `CREATE INDEX IF NOT EXISTS idx_users_is_guest  ON users (is_guest)`,
  `CREATE INDEX IF NOT EXISTS idx_users_xp        ON users (xp)`,

  // Sessions
  `CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at)`,

  // Scores
  `CREATE INDEX IF NOT EXISTS idx_scores_user_id      ON scores (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_scores_created_at   ON scores (created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_scores_user_created ON scores (user_id, created_at)`,

  // Password resets
  `CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets (user_id)`,
];

async function run() {
  console.log('Applying indexes to database...\n');

  for (const ddl of INDEXES) {
    const name = ddl.match(/idx_\w+/)?.[0] ?? ddl;
    try {
      await sql.unsafe(ddl);
      console.log(`  ✓ ${name}`);
    } catch (err) {
      console.error(`  ✗ ${name}:`, (err as Error).message);
    }
  }

  console.log('\nDone.');
  await sql.end();
}

run();
