// ──────────────────────────────────────────────
// NINE — Database Schema (Drizzle ORM / PostgreSQL)
// Full 28-screen relational schema
// ──────────────────────────────────────────────

import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────

export const rankTierEnum = pgEnum('rank_tier', [
  'Recruit',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Mastermind',
]);

export const matchStatusEnum = pgEnum('match_status', [
  'ongoing',
  'completed',
  'abandoned',
]);

export const matchResultEnum = pgEnum('match_result', [
  'win',
  'loss',
  'draw',
]);

export const gameOutcomeEnum = pgEnum('game_outcome', [
  'win',
  'loss',
  'game_over',    // 3 mistakes
  'forfeit',      // disconnected / quit
  'timeout',      // ran out of time
]);

export const escrowStatusEnum = pgEnum('escrow_status', [
  'held',         // money locked during match
  'awarded',      // given to winner
  'refunded',     // returned (server error, etc)
]);

export const friendshipStatusEnum = pgEnum('friendship_status', [
  'pending',
  'accepted',
  'blocked',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'friend_request',
  'game_invite',
  'system',
]);

// ─── Users ───────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 32 }).unique().notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    passwordHash: text('password_hash').notNull(),
    avatarUrl: varchar('avatar_url', { length: 255 }),
    bio: text('bio'),
    isGuest: boolean('is_guest').default(false).notNull(),
    rankTier: rankTierEnum('rank_tier').default('Recruit').notNull(),
    totalXp: integer('total_xp').default(0).notNull(),
    gamesPlayed: integer('games_played').default(0).notNull(),
    wins: integer('wins').default(0).notNull(),
    losses: integer('losses').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    // ── Economy ──
    coins: integer('coins').default(5000).notNull(),
    trophies: integer('trophies').default(0).notNull(),
    level: integer('level').default(1).notNull(),

    // ── Legacy aliases (existing code reads these) ──
    xp: integer('xp').default(0).notNull(),
    rank: varchar('rank', { length: 32 }).default('Recruit').notNull(),
  },
  (table) => [
    index('idx_users_is_guest').on(table.isGuest),
    index('idx_users_xp').on(table.xp),
    index('idx_users_total_xp').on(table.totalXp),
    index('idx_users_rank_tier').on(table.rankTier),
    index('idx_users_trophies').on(table.trophies),
    index('idx_users_coins').on(table.coins),
  ],
);

// ─── Scores (legacy — preserved for existing API routes) ──

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

// ─── Sessions ────────────────────────────────

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

// ─── Password Resets ─────────────────────────

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

// ─── Matches ─────────────────────────────────

export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modeId: varchar('mode_id', { length: 64 }).notNull(),
    difficulty: varchar('difficulty', { length: 32 }).notNull(),
    status: matchStatusEnum('status').default('ongoing').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_matches_mode_id').on(table.modeId),
    index('idx_matches_status').on(table.status),
    index('idx_matches_started_at').on(table.startedAt),
  ],
);

// ─── Match Players (Join Table) ──────────────

export const matchPlayers = pgTable(
  'match_players',
  {
    matchId: uuid('match_id')
      .references(() => matches.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    score: integer('score').default(0).notNull(),
    result: matchResultEnum('result'),
    xpEarned: integer('xp_earned').default(0).notNull(),
    timeTakenMs: integer('time_taken_ms'),
  },
  (table) => [
    primaryKey({ columns: [table.matchId, table.userId] }),
    index('idx_match_players_user_id').on(table.userId),
    index('idx_match_players_match_id').on(table.matchId),
  ],
);

// ─── Friendships ─────────────────────────────

export const friendships = pgTable(
  'friendships',
  {
    userId1: uuid('user_id_1')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    userId2: uuid('user_id_2')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    status: friendshipStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId1, table.userId2] }),
    index('idx_friendships_user_id_1').on(table.userId1),
    index('idx_friendships_user_id_2').on(table.userId2),
    index('idx_friendships_status').on(table.status),
  ],
);

// ─── Notifications ───────────────────────────

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: notificationTypeEnum('type').notNull(),
    senderId: uuid('sender_id')
      .references(() => users.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_notifications_user_id').on(table.userId),
    index('idx_notifications_is_read').on(table.isRead),
    index('idx_notifications_user_unread').on(table.userId, table.isRead),
    index('idx_notifications_created_at').on(table.createdAt),
  ],
);

// ─── Daily Challenges ────────────────────────

export const dailyChallenges = pgTable(
  'daily_challenges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modeId: varchar('mode_id', { length: 64 }).notNull(),
    puzzleSeed: varchar('puzzle_seed', { length: 128 }).notNull(),
    activeDate: date('active_date').unique().notNull(),
  },
  (table) => [
    index('idx_daily_challenges_active_date').on(table.activeDate),
    index('idx_daily_challenges_mode_id').on(table.modeId),
  ],
);

// ─── Daily Challenge Scores ──────────────────

export const dailyChallengeScores = pgTable(
  'daily_challenge_scores',
  {
    challengeId: uuid('challenge_id')
      .references(() => dailyChallenges.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    score: integer('score').notNull(),
    timeTakenMs: integer('time_taken_ms').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.challengeId, table.userId] }),
    index('idx_daily_scores_challenge_id').on(table.challengeId),
    index('idx_daily_scores_user_id').on(table.userId),
    index('idx_daily_scores_score').on(table.score),
  ],
);

// ─── Game Results (immutable history) ────────

export const gameResults = pgTable(
  'game_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    matchId: uuid('match_id')
      .references(() => matches.id, { onDelete: 'set null' }),
    modeId: varchar('mode_id', { length: 64 }).notNull(),
    difficulty: varchar('difficulty', { length: 32 }).notNull(),
    outcome: gameOutcomeEnum('outcome').notNull(),
    score: integer('score').default(0).notNull(),
    mistakes: integer('mistakes').default(0).notNull(),
    timeMs: integer('time_ms').notNull(),
    xpEarned: integer('xp_earned').default(0).notNull(),
    coinsEarned: integer('coins_earned').default(0).notNull(),
    trophyDelta: integer('trophy_delta').default(0).notNull(),
    isPvp: boolean('is_pvp').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_game_results_user_id').on(table.userId),
    index('idx_game_results_mode_id').on(table.modeId),
    index('idx_game_results_created_at').on(table.createdAt),
    index('idx_game_results_user_mode').on(table.userId, table.modeId),
  ],
);

// ─── Match Escrow (anti-exploit wagering) ────

export const matchEscrow = pgTable(
  'match_escrow',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id')
      .references(() => matches.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    amount: integer('amount').notNull(),
    status: escrowStatusEnum('status').default('held').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_escrow_match_id').on(table.matchId),
    index('idx_escrow_user_id').on(table.userId),
    index('idx_escrow_status').on(table.status),
  ],
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Relations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const usersRelations = relations(users, ({ many }) => ({
  scores: many(scores),
  sessions: many(sessions),
  passwordResets: many(passwordResets),
  matchPlayers: many(matchPlayers),
  sentFriendships: many(friendships, { relationName: 'sentFriendships' }),
  receivedFriendships: many(friendships, { relationName: 'receivedFriendships' }),
  notifications: many(notifications, { relationName: 'userNotifications' }),
  sentNotifications: many(notifications, { relationName: 'senderNotifications' }),
  dailyChallengeScores: many(dailyChallengeScores),
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

export const matchesRelations = relations(matches, ({ many }) => ({
  players: many(matchPlayers),
}));

export const matchPlayersRelations = relations(matchPlayers, ({ one }) => ({
  match: one(matches, {
    fields: [matchPlayers.matchId],
    references: [matches.id],
  }),
  user: one(users, {
    fields: [matchPlayers.userId],
    references: [users.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  sender: one(users, {
    fields: [friendships.userId1],
    references: [users.id],
    relationName: 'sentFriendships',
  }),
  receiver: one(users, {
    fields: [friendships.userId2],
    references: [users.id],
    relationName: 'receivedFriendships',
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: 'userNotifications',
  }),
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
    relationName: 'senderNotifications',
  }),
}));

export const dailyChallengesRelations = relations(dailyChallenges, ({ many }) => ({
  scores: many(dailyChallengeScores),
}));

export const dailyChallengeScoresRelations = relations(dailyChallengeScores, ({ one }) => ({
  challenge: one(dailyChallenges, {
    fields: [dailyChallengeScores.challengeId],
    references: [dailyChallenges.id],
  }),
  user: one(users, {
    fields: [dailyChallengeScores.userId],
    references: [users.id],
  }),
}));

// ─── Game Results Relations ──────────────────

export const gameResultsRelations = relations(gameResults, ({ one }) => ({
  user: one(users, {
    fields: [gameResults.userId],
    references: [users.id],
  }),
  match: one(matches, {
    fields: [gameResults.matchId],
    references: [matches.id],
  }),
}));

export const matchEscrowRelations = relations(matchEscrow, ({ one }) => ({
  match: one(matches, {
    fields: [matchEscrow.matchId],
    references: [matches.id],
  }),
  user: one(users, {
    fields: [matchEscrow.userId],
    references: [users.id],
  }),
}));

// ─── Type Exports ────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type PasswordReset = typeof passwordResets.$inferSelect;
export type NewPasswordReset = typeof passwordResets.$inferInsert;

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;

export type MatchPlayer = typeof matchPlayers.$inferSelect;
export type NewMatchPlayer = typeof matchPlayers.$inferInsert;

export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type NewDailyChallenge = typeof dailyChallenges.$inferInsert;

export type DailyChallengeScore = typeof dailyChallengeScores.$inferSelect;
export type NewDailyChallengeScore = typeof dailyChallengeScores.$inferInsert;

export type GameResult = typeof gameResults.$inferSelect;
export type NewGameResult = typeof gameResults.$inferInsert;

export type MatchEscrow = typeof matchEscrow.$inferSelect;
export type NewMatchEscrow = typeof matchEscrow.$inferInsert;
