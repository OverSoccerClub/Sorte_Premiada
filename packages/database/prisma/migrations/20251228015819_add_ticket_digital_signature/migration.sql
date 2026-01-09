/*
  Warnings:

  - A unique constraint covering the columns `[digitalSignature]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "digitalSignature" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_digitalSignature_key" ON "Ticket"("digitalSignature");
