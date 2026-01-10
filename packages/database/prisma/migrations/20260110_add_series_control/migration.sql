-- Step 1: Add new columns with defaults
ALTER TABLE "Area" 
  ADD COLUMN IF NOT EXISTS "currentSeries" TEXT,
  ADD COLUMN IF NOT EXISTS "ticketsInSeries" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "maxTicketsPerSeries" INTEGER DEFAULT 2500;

-- Step 2: Initialize currentSeries with seriesNumber for existing areas
UPDATE "Area" 
SET "currentSeries" = COALESCE("seriesNumber", '0001')
WHERE "currentSeries" IS NULL;

-- Step 3: Set default seriesNumber for areas without it
UPDATE "Area" 
SET "seriesNumber" = '0001'
WHERE "seriesNumber" IS NULL;

-- Step 4: Make columns NOT NULL
ALTER TABLE "Area" 
  ALTER COLUMN "seriesNumber" SET NOT NULL,
  ALTER COLUMN "currentSeries" SET NOT NULL;
