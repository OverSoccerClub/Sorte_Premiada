/*
  Warnings:

  - A unique constraint covering the columns `[activationCode]` on the table `PosTerminal` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[deviceToken]` on the table `PosTerminal` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PosTerminal" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "activationCode" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "deviceToken" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PosTerminal_activationCode_key" ON "PosTerminal"("activationCode");

-- CreateIndex
CREATE UNIQUE INDEX "PosTerminal_deviceToken_key" ON "PosTerminal"("deviceToken");

-- CreateIndex
CREATE INDEX "PosTerminal_activationCode_idx" ON "PosTerminal"("activationCode");

-- CreateIndex
CREATE INDEX "PosTerminal_deviceToken_idx" ON "PosTerminal"("deviceToken");
