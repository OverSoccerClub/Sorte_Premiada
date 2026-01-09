/*
  Warnings:

  - A unique constraint covering the columns `[gameId,areaId,time]` on the table `ExtractionSeries` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ExtractionSeries_gameId_time_key";

-- AlterTable
ALTER TABLE "Draw" ADD COLUMN     "areaId" TEXT;

-- AlterTable
ALTER TABLE "ExtractionSeries" ADD COLUMN     "areaId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fixedCommission" DECIMAL(65,30) DEFAULT 40.00,
ADD COLUMN     "minSalesThreshold" DECIMAL(65,30) DEFAULT 200.00;

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'Fezinha de Hoje',
    "slogan" TEXT DEFAULT 'Cambista Edition',
    "logoUrl" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "primaryColor" TEXT DEFAULT '#50C878',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtractionSeries_gameId_areaId_time_key" ON "ExtractionSeries"("gameId", "areaId", "time");

-- AddForeignKey
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionSeries" ADD CONSTRAINT "ExtractionSeries_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
