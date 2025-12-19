-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "price" DECIMAL(65,30) NOT NULL DEFAULT 5.00;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "hash" TEXT;
