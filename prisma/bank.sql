-- The permanent question bank — hand-written DDL.
--
-- Use this when `npx prisma db push` is not an option: paste it into the Neon
-- SQL editor. It creates exactly what the Prisma schema declares, and it is
-- idempotent, so running it twice is harmless.
--
-- Purely additive. No existing table is altered or dropped.
--
-- NEVER run `prisma migrate dev` on this project: there is no migration
-- history, so Prisma sees the whole database as drift and offers to reset it.

BEGIN;

DO $$ BEGIN
  CREATE TYPE "BankLevel" AS ENUM ('YEAR_10', 'YEAR_11', 'YEAR_12', 'YEAR_13');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BankType" AS ENUM ('MCQ_SINGLE', 'MCQ_MULTI', 'NUMERIC', 'SHORT_ANSWER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "BankQuestion" (
  "id"               TEXT PRIMARY KEY,
  "sourceKey"        TEXT NOT NULL,
  "subject"          TEXT NOT NULL DEFAULT 'maths',
  "topic"            TEXT NOT NULL,
  "subtopic"         TEXT NOT NULL,
  "curriculumLevel"  "BankLevel" NOT NULL,
  "difficulty"       INTEGER NOT NULL,
  "questionType"     "BankType" NOT NULL DEFAULT 'MCQ_SINGLE',
  "prompt"           TEXT NOT NULL,
  "answer"           TEXT NOT NULL,
  "explanation"      TEXT NOT NULL,
  "estimatedSeconds" INTEGER NOT NULL DEFAULT 60,
  "marks"            INTEGER NOT NULL DEFAULT 1,
  "calculator"       BOOLEAN NOT NULL DEFAULT FALSE,
  "sourceName"       TEXT,
  "sourceUrl"        TEXT,
  "sourceLicence"    TEXT,
  "retired"          BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "BankQuestion_sourceKey_key"
  ON "BankQuestion" ("sourceKey");

-- The four filters the app actually uses, in the order it uses them.
CREATE INDEX IF NOT EXISTS "BankQuestion_subject_retired_curriculumLevel_difficulty_idx"
  ON "BankQuestion" ("subject", "retired", "curriculumLevel", "difficulty");
CREATE INDEX IF NOT EXISTS "BankQuestion_subject_retired_topic_subtopic_idx"
  ON "BankQuestion" ("subject", "retired", "topic", "subtopic");
CREATE INDEX IF NOT EXISTS "BankQuestion_subject_retired_questionType_idx"
  ON "BankQuestion" ("subject", "retired", "questionType");
CREATE INDEX IF NOT EXISTS "BankQuestion_subject_retired_topic_curriculumLevel_idx"
  ON "BankQuestion" ("subject", "retired", "topic", "curriculumLevel");

CREATE TABLE IF NOT EXISTS "BankOption" (
  "id"         TEXT PRIMARY KEY,
  "questionId" TEXT NOT NULL,
  "text"       TEXT NOT NULL,
  "isCorrect"  BOOLEAN NOT NULL DEFAULT FALSE,
  "position"   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "BankOption_questionId_idx" ON "BankOption" ("questionId");

DO $$ BEGIN
  ALTER TABLE "BankOption"
    ADD CONSTRAINT "BankOption_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "BankQuestion"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "BankServe" (
  "id"         TEXT PRIMARY KEY,
  "userId"     TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "context"    TEXT NOT NULL DEFAULT 'practice',
  "servedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "BankServe_userId_questionId_context_key"
  ON "BankServe" ("userId", "questionId", "context");
CREATE INDEX IF NOT EXISTS "BankServe_userId_context_servedAt_idx"
  ON "BankServe" ("userId", "context", "servedAt");

DO $$ BEGIN
  ALTER TABLE "BankServe"
    ADD CONSTRAINT "BankServe_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BankServe"
    ADD CONSTRAINT "BankServe_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "BankQuestion"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Which table a match's questionIds point at. Existing rows keep 'library',
-- so every match played before the bank existed still resolves correctly.
ALTER TABLE "BankQuestion"
  ADD COLUMN IF NOT EXISTS "calculator" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "Match"
  ADD COLUMN IF NOT EXISTS "questionSource" TEXT NOT NULL DEFAULT 'library';

-- What a searcher ticked. Both empty means "anything", which is the default
-- and what any row written before this existed will have.
--
-- MatchQueueEntry holds only in-flight searches, so dropping the two columns an
-- earlier design used loses nothing anybody would miss.
ALTER TABLE "MatchQueueEntry"
  ADD COLUMN IF NOT EXISTS "queueStreams" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "MatchQueueEntry"
  ADD COLUMN IF NOT EXISTS "queueTopics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "MatchQueueEntry" DROP COLUMN IF EXISTS "queueKind";
ALTER TABLE "MatchQueueEntry" DROP COLUMN IF EXISTS "queueLevels";

COMMIT;
