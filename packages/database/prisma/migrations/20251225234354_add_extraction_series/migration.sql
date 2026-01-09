-- AlterTable
ALTER TABLE "Draw" ADD COLUMN     "series" INTEGER;

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "lastSeries" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pushToken" TEXT;

-- CreateTable
CREATE TABLE "ExtractionSeries" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "lastSeries" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExtractionSeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtractionSeries_gameId_time_key" ON "ExtractionSeries"("gameId", "time");

-- AddForeignKey
ALTER TABLE "ExtractionSeries" ADD CONSTRAINT "ExtractionSeries_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
