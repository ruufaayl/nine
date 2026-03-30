CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."match_result" AS ENUM('win', 'loss', 'draw');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('ongoing', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('friend_request', 'game_invite', 'system');--> statement-breakpoint
CREATE TYPE "public"."rank_tier" AS ENUM('Recruit', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Mastermind');--> statement-breakpoint
CREATE TABLE "daily_challenge_scores" (
	"challenge_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"time_taken_ms" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_challenge_scores_challenge_id_user_id_pk" PRIMARY KEY("challenge_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "daily_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mode_id" varchar(64) NOT NULL,
	"puzzle_seed" varchar(128) NOT NULL,
	"active_date" date NOT NULL,
	CONSTRAINT "daily_challenges_active_date_unique" UNIQUE("active_date")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"user_id_1" uuid NOT NULL,
	"user_id_2" uuid NOT NULL,
	"status" "friendship_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_user_id_1_user_id_2_pk" PRIMARY KEY("user_id_1","user_id_2")
);
--> statement-breakpoint
CREATE TABLE "match_players" (
	"match_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"result" "match_result",
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"time_taken_ms" integer,
	CONSTRAINT "match_players_match_id_user_id_pk" PRIMARY KEY("match_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mode_id" varchar(64) NOT NULL,
	"difficulty" varchar(32) NOT NULL,
	"status" "match_status" DEFAULT 'ongoing' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"sender_id" uuid,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "rank" SET DEFAULT 'Recruit';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_guest" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rank_tier" "rank_tier" DEFAULT 'Recruit' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "games_played" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wins" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "losses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_challenge_scores" ADD CONSTRAINT "daily_challenge_scores_challenge_id_daily_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."daily_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_challenge_scores" ADD CONSTRAINT "daily_challenge_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_1_users_id_fk" FOREIGN KEY ("user_id_1") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_2_users_id_fk" FOREIGN KEY ("user_id_2") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_daily_scores_challenge_id" ON "daily_challenge_scores" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "idx_daily_scores_user_id" ON "daily_challenge_scores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_daily_scores_score" ON "daily_challenge_scores" USING btree ("score");--> statement-breakpoint
CREATE INDEX "idx_daily_challenges_active_date" ON "daily_challenges" USING btree ("active_date");--> statement-breakpoint
CREATE INDEX "idx_daily_challenges_mode_id" ON "daily_challenges" USING btree ("mode_id");--> statement-breakpoint
CREATE INDEX "idx_friendships_user_id_1" ON "friendships" USING btree ("user_id_1");--> statement-breakpoint
CREATE INDEX "idx_friendships_user_id_2" ON "friendships" USING btree ("user_id_2");--> statement-breakpoint
CREATE INDEX "idx_friendships_status" ON "friendships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_match_players_user_id" ON "match_players" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_match_players_match_id" ON "match_players" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "idx_matches_mode_id" ON "matches" USING btree ("mode_id");--> statement-breakpoint
CREATE INDEX "idx_matches_status" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_matches_started_at" ON "matches" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_unread" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_password_resets_user_id" ON "password_resets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_scores_user_id" ON "scores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_scores_created_at" ON "scores" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_scores_user_created" ON "scores" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_users_is_guest" ON "users" USING btree ("is_guest");--> statement-breakpoint
CREATE INDEX "idx_users_xp" ON "users" USING btree ("xp");--> statement-breakpoint
CREATE INDEX "idx_users_total_xp" ON "users" USING btree ("total_xp");--> statement-breakpoint
CREATE INDEX "idx_users_rank_tier" ON "users" USING btree ("rank_tier");