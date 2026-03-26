// ──────────────────────────────────────────────
// NINE — Database Schema (Drizzle ORM / PostgreSQL)
// ──────────────────────────────────────────────

import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ─── Users ──────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 32 }).unique().notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    passwordHash: text('password_hash').notNull(),
    isGuest: boolean('is_guest').default(false).notNull(),
    xp: integer('xp').default(0).notNull(),
    rank: varchar('rank', { length: 32 }).default('Stone').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_users_is_guest').on(table.isGuest),
    index('idx_users_xp').on(table.xp),
  ],
);

// ─── Scores ─────────────────────────────────

export const scores = pgTable(
  'scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    modeId: varchar('mode_id', { length: 64 }).notNull(),
    score: integer('score').notNull(),
    timeMs: integer('time_ms').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_scores_user_id').on(table.userId),
    index('idx_scores_created_at').on(table.createdAt),
    index('idx_scores_user_created').on(table.userId, table.createdAt),
  ],
);

// ─── Sessions ───────────────────────────────

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_sessions_user_id').on(table.userId),
    index('idx_sessions_expires_at').on(table.expiresAt),
  ],
);

// ─── Password Resets ────────────────────────

export const passwordResets = pgTable(
  'password_resets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    token: varchar('token', { length: 64 }).unique().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_password_resets_user_id').on(table.userId),
  ],
);

// ─── Relations ──────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  scores: many(scores),
  sessions: many(sessions),
  passwordResets: many(passwordResets),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  user: one(users, {
    fields: [scores.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}));

// ─── Type Exports ───────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type PasswordReset = typeof passwordResets.$inferSelect;
export type NewPasswordReset = typeof passwordResets.$inferInsert;
