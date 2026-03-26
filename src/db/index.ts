// ──────────────────────────────────────────────
// NINE — Database Connection (Drizzle + postgres)
// Optimised for Vercel Serverless (short-lived processes)
// ──────────────────────────────────────────────

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

/**
 * Serverless-optimised postgres client.
 *
 * Key settings:
 *  - max: 1          → one connection per serverless instance (no contention)
 *  - idle_timeout: 20 → reuse the connection across warm invocations
 *  - connect_timeout: 5 → fail fast on unreachable DB
 *  - prepare: false   → CRITICAL: skips the PREPARE round-trip so every
 *                        query is a single Simple-Query message instead of
 *                        Parse → Bind → Execute.  On a remote DB with
 *                        ~80-120 ms RTT this saves 80-120 ms **per query**.
 */
const client = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 5,
  prepare: false,
  ssl: 'require',
});

/** Drizzle ORM instance — import this everywhere. */
export const db = drizzle(client, { schema });
