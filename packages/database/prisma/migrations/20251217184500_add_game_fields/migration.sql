-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "extractionTimes" TEXT[] DEFAULT ARRAY[]::TEXT[];
