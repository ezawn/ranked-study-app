-- Arena tables.
--
-- The same DDL `prisma db push` would apply, written out so it can be run
-- directly in the Neon SQL editor when the CLI is not cooperating. Nothing
-- here touches an existing table: it creates four enum types and nine new
-- tables, and adds foreign keys from the new tables to User, Match, Question
-- and CosmeticItem. No column on User, FlashcardSet, Quiz, Question or any
-- other existing model is altered, renamed or dropped.
--
-- Safe to run more than once: every statement is guarded, so a partial run
-- can simply be re-run rather than unpicked.
--
-- Names follow Prisma's conventions exactly — quoted PascalCase tables,
-- camelCase columns, `Table_field_key` for uniques and `Table_field_idx` for
-- indexes — so a later `prisma db push` or `migrate` sees the schema it
-- expects rather than a near-miss it wants to "fix".

BEGIN;

-- ---------------------------------------------------------------- enums --

DO $$ BEGIN
  CREATE TYPE "ArenaMatchStatus" AS ENUM ('STARTING', 'LIVE', 'COMPLETE', 'ABANDONED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "QueueStatus" AS ENUM ('SEARCHING', 'MATCHED', 'CANCELLED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MatchOutcome" AS ENUM ('WIN', 'LOSS', 'DRAW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CosmeticCategory" AS ENUM
    ('HAT', 'CHESTPIECE', 'LEGGINGS', 'SHOES', 'GLOVES', 'WEAPON', 'PET', 'ACCESSORY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --------------------------------------------------------------- tables --

CREATE TABLE IF NOT EXISTS "ArenaProfile" (
  "id"               TEXT NOT NULL,
  "userId"           TEXT NOT NULL,
  "elo"              INTEGER NOT NULL DEFAULT 1000,
  "peakElo"          INTEGER NOT NULL DEFAULT 1000,
  "rankKey"          TEXT NOT NULL DEFAULT 'student',
  "peakRankKey"      TEXT NOT NULL DEFAULT 'student',
  "matchesPlayed"    INTEGER NOT NULL DEFAULT 0,
  "wins"             INTEGER NOT NULL DEFAULT 0,
  "losses"           INTEGER NOT NULL DEFAULT 0,
  "draws"            INTEGER NOT NULL DEFAULT 0,
  "currentWinStreak" INTEGER NOT NULL DEFAULT 0,
  "bestWinStreak"    INTEGER NOT NULL DEFAULT 0,
  "totalAnswered"    INTEGER NOT NULL DEFAULT 0,
  "totalCorrect"     INTEGER NOT NULL DEFAULT 0,
  "totalResponseMs"  INTEGER NOT NULL DEFAULT 0,
  "regionCode"       TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArenaProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Match" (
  "id"          TEXT NOT NULL,
  "status"      "ArenaMatchStatus" NOT NULL DEFAULT 'STARTING',
  "subject"     TEXT,
  "pooledFrom"  TEXT NOT NULL DEFAULT 'shared_studied',
  "questionIds" TEXT[],
  "startsAt"    TIMESTAMP(3) NOT NULL,
  "endsAt"      TIMESTAMP(3) NOT NULL,
  "winnerId"    TEXT,
  "isDraw"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MatchQueueEntry" (
  "id"             TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "status"         "QueueStatus" NOT NULL DEFAULT 'SEARCHING',
  "elo"            INTEGER NOT NULL,
  "rankKey"        TEXT NOT NULL,
  "subjects"       TEXT[],
  "studiedQuizIds" TEXT[],
  "enqueuedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "matchedAt"      TIMESTAMP(3),
  "matchId"        TEXT,
  CONSTRAINT "MatchQueueEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MatchPlayer" (
  "id"              TEXT NOT NULL,
  "matchId"         TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "score"           INTEGER NOT NULL DEFAULT 0,
  "answered"        INTEGER NOT NULL DEFAULT 0,
  "correct"         INTEGER NOT NULL DEFAULT 0,
  "totalResponseMs" INTEGER NOT NULL DEFAULT 0,
  "outcome"         "MatchOutcome",
  "eloBefore"       INTEGER NOT NULL,
  "eloAfter"        INTEGER,
  "eloDelta"        INTEGER,
  "rankBefore"      TEXT NOT NULL,
  "rankAfter"       TEXT,
  "coinsAwarded"    INTEGER NOT NULL DEFAULT 0,
  "finishedAt"      TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MatchAnswer" (
  "id"                TEXT NOT NULL,
  "matchPlayerId"     TEXT NOT NULL,
  "questionId"        TEXT NOT NULL,
  "position"          INTEGER NOT NULL,
  "selectedOptionIds" TEXT[],
  "numericAnswer"     TEXT,
  "correct"           BOOLEAN NOT NULL,
  "responseMs"        INTEGER NOT NULL,
  "answeredAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EloEvent" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "matchId"   TEXT,
  "delta"     INTEGER NOT NULL,
  "eloAfter"  INTEGER NOT NULL,
  "rankAfter" TEXT NOT NULL,
  "reason"    TEXT NOT NULL DEFAULT 'match',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EloEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CosmeticItem" (
  "id"               TEXT NOT NULL,
  "slug"             TEXT NOT NULL,
  "category"         "CosmeticCategory" NOT NULL,
  "name"             TEXT NOT NULL,
  "description"      TEXT NOT NULL,
  "price"            INTEGER NOT NULL,
  "placeholderLabel" TEXT NOT NULL,
  "spriteKey"        TEXT,
  "sortOrder"        INTEGER NOT NULL DEFAULT 0,
  "isActive"         BOOLEAN NOT NULL DEFAULT true,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CosmeticItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CosmeticOwnership" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "itemId"      TEXT NOT NULL,
  "pricePaid"   INTEGER NOT NULL,
  "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CosmeticOwnership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EquippedCosmetic" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "category"   "CosmeticCategory" NOT NULL,
  "itemId"     TEXT NOT NULL,
  "equippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EquippedCosmetic_pkey" PRIMARY KEY ("id")
);

-- -------------------------------------------------- uniques and indexes --

CREATE UNIQUE INDEX IF NOT EXISTS "ArenaProfile_userId_key" ON "ArenaProfile"("userId");
CREATE INDEX IF NOT EXISTS "ArenaProfile_rankKey_elo_idx" ON "ArenaProfile"("rankKey", "elo");
CREATE INDEX IF NOT EXISTS "ArenaProfile_elo_idx" ON "ArenaProfile"("elo");
CREATE INDEX IF NOT EXISTS "ArenaProfile_regionCode_elo_idx" ON "ArenaProfile"("regionCode", "elo");

CREATE INDEX IF NOT EXISTS "Match_status_endsAt_idx" ON "Match"("status", "endsAt");
CREATE INDEX IF NOT EXISTS "Match_createdAt_idx" ON "Match"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "MatchQueueEntry_userId_key" ON "MatchQueueEntry"("userId");
CREATE INDEX IF NOT EXISTS "MatchQueueEntry_status_rankKey_elo_idx"
  ON "MatchQueueEntry"("status", "rankKey", "elo");
CREATE INDEX IF NOT EXISTS "MatchQueueEntry_status_enqueuedAt_idx"
  ON "MatchQueueEntry"("status", "enqueuedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "MatchPlayer_matchId_userId_key"
  ON "MatchPlayer"("matchId", "userId");
CREATE INDEX IF NOT EXISTS "MatchPlayer_userId_createdAt_idx"
  ON "MatchPlayer"("userId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "MatchAnswer_matchPlayerId_position_key"
  ON "MatchAnswer"("matchPlayerId", "position");
CREATE INDEX IF NOT EXISTS "MatchAnswer_questionId_idx" ON "MatchAnswer"("questionId");

CREATE INDEX IF NOT EXISTS "EloEvent_userId_createdAt_idx" ON "EloEvent"("userId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "CosmeticItem_slug_key" ON "CosmeticItem"("slug");
CREATE INDEX IF NOT EXISTS "CosmeticItem_category_sortOrder_idx"
  ON "CosmeticItem"("category", "sortOrder");

CREATE UNIQUE INDEX IF NOT EXISTS "CosmeticOwnership_userId_itemId_key"
  ON "CosmeticOwnership"("userId", "itemId");
CREATE INDEX IF NOT EXISTS "CosmeticOwnership_userId_idx" ON "CosmeticOwnership"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "EquippedCosmetic_userId_category_key"
  ON "EquippedCosmetic"("userId", "category");
CREATE INDEX IF NOT EXISTS "EquippedCosmetic_userId_idx" ON "EquippedCosmetic"("userId");

-- ---------------------------------------------------------- foreign keys --
--
-- Added separately and guarded, because a constraint that already exists is
-- an error rather than a no-op in Postgres.

DO $$ BEGIN
  ALTER TABLE "ArenaProfile" ADD CONSTRAINT "ArenaProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MatchQueueEntry" ADD CONSTRAINT "MatchQueueEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MatchQueueEntry" ADD CONSTRAINT "MatchQueueEntry_matchId_fkey"
    FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey"
    FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MatchAnswer" ADD CONSTRAINT "MatchAnswer_matchPlayerId_fkey"
    FOREIGN KEY ("matchPlayerId") REFERENCES "MatchPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "EloEvent" ADD CONSTRAINT "EloEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "EloEvent" ADD CONSTRAINT "EloEvent_matchId_fkey"
    FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CosmeticOwnership" ADD CONSTRAINT "CosmeticOwnership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CosmeticOwnership" ADD CONSTRAINT "CosmeticOwnership_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "CosmeticItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "EquippedCosmetic" ADD CONSTRAINT "EquippedCosmetic_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "EquippedCosmetic" ADD CONSTRAINT "EquippedCosmetic_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "CosmeticItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;

-- Check it worked — this should return 9.
-- SELECT count(*) FROM information_schema.tables
--  WHERE table_schema = 'public'
--    AND table_name IN ('ArenaProfile','Match','MatchQueueEntry','MatchPlayer',
--                       'MatchAnswer','EloEvent','CosmeticItem',
--                       'CosmeticOwnership','EquippedCosmetic');
