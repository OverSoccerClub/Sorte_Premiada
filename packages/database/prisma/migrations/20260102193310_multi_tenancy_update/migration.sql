/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `CompanySettings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MASTER';

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Area" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "slug" TEXT NOT NULL DEFAULT 'default',
ALTER COLUMN "companyName" SET DEFAULT 'A Perseverança';

-- AlterTable
ALTER TABLE "DailyClose" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Draw" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "ExtractionSeries" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "PosTerminal" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "SecondChanceDraw" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "SecurityLog" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT;

-- CreateIndex
CREATE INDEX "Announcement_companyId_idx" ON "Announcement"("companyId");

-- CreateIndex
CREATE INDEX "Area_companyId_idx" ON "Area"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_slug_key" ON "CompanySettings"("slug");

-- CreateIndex
CREATE INDEX "DailyClose_companyId_idx" ON "DailyClose"("companyId");

-- CreateIndex
CREATE INDEX "Draw_companyId_idx" ON "Draw"("companyId");

-- CreateIndex
CREATE INDEX "ExtractionSeries_companyId_idx" ON "ExtractionSeries"("companyId");

-- CreateIndex
CREATE INDEX "Game_companyId_idx" ON "Game"("companyId");

-- CreateIndex
CREATE INDEX "NotificationLog_companyId_idx" ON "NotificationLog"("companyId");

-- CreateIndex
CREATE INDEX "PosTerminal_companyId_idx" ON "PosTerminal"("companyId");

-- CreateIndex
CREATE INDEX "SecondChanceDraw_companyId_idx" ON "SecondChanceDraw"("companyId");

-- CreateIndex
CREATE INDEX "SecurityLog_companyId_idx" ON "SecurityLog"("companyId");

-- CreateIndex
CREATE INDEX "Ticket_companyId_idx" ON "Ticket"("companyId");

-- CreateIndex
CREATE INDEX "Transaction_companyId_idx" ON "Transaction"("companyId");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecondChanceDraw" ADD CONSTRAINT "SecondChanceDraw_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionSeries" ADD CONSTRAINT "ExtractionSeries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyClose" ADD CONSTRAINT "DailyClose_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosTerminal" ADD CONSTRAINT "PosTerminal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
