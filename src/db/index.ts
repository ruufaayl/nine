// ──────────────────────────────────────────────
// NINE — Database Connection (Drizzle + postgres)
// ──────────────────────────────────────────────

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

/**
 * Raw postgres client.
 * Tuned for a long-running server behind DigitalOcean managed PG.
 */
const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: 'require',
});

/** Drizzle ORM instance — import this everywhere. */
export const db = drizzle(client, { schema });
