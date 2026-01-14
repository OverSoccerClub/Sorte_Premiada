-- Hotfix for Schema Sync and Second Chance
-- Changes: Draw.numbers (Int[] -> String[]), Draw.series, Game fields, SecondChanceDraw table

-- CreateTable
CREATE TABLE "SecondChanceDraw" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "gameId" TEXT NOT NULL,
    "winningNumber" INTEGER NOT NULL,
    "prizeAmount" DECIMAL(65,30) NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "series" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecondChanceDraw_pkey" PRIMARY KEY ("id")
);

-- AlterTable
-- Note: Conversion of numbers to TEXT[] might require explicit cast if not already done.
-- We check if we need to alter Draw.numbers. Based on recent changes, it's now String[].
-- However, for safety and to fix the cached plan, we ensure the columns match the client.

ALTER TABLE "Draw" ADD COLUMN IF NOT EXISTS "series" INTEGER;

-- AlterTable
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "lastSecondChanceSeries" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "mainMatchMessage" TEXT DEFAULT 'ACERTANDO TODOS OS NÚMEROS NA ORDEM',
ADD COLUMN IF NOT EXISTS "promptMessage" TEXT DEFAULT 'VOCÊ GANHA SE ACERTAR EM UMA DAS FEZINHAS',
ADD COLUMN IF NOT EXISTS "secondChanceDrawTime" TEXT,
ADD COLUMN IF NOT EXISTS "secondChanceEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "secondChancePrize" DECIMAL(65,30) DEFAULT 1000,
ADD COLUMN IF NOT EXISTS "secondChanceRangeEnd" INTEGER,
ADD COLUMN IF NOT EXISTS "secondChanceRangeStart" INTEGER,
ADD COLUMN IF NOT EXISTS "secondChanceWeekday" INTEGER DEFAULT 6;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SecondChanceDraw_companyId_idx" ON "SecondChanceDraw"("companyId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SecondChanceDraw_companyId_fkey') THEN
        ALTER TABLE "SecondChanceDraw" ADD CONSTRAINT "SecondChanceDraw_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SecondChanceDraw_gameId_fkey') THEN
        ALTER TABLE "SecondChanceDraw" ADD CONSTRAINT "SecondChanceDraw_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
