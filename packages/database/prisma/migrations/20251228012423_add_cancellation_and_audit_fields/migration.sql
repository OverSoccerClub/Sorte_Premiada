-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('SENT', 'FAILED');

-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'CANCEL_REQUESTED';

-- AlterTable
ALTER TABLE "DailyClose" ADD COLUMN     "physicalCashReported" DECIMAL(65,30),
ADD COLUMN     "variance" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "lastSecondChanceSeries" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxLiability" DECIMAL(65,30) NOT NULL DEFAULT 5000.0,
ADD COLUMN     "prizeMultiplier" DECIMAL(65,30) NOT NULL DEFAULT 1000.0,
ADD COLUMN     "secondChanceDrawTime" TEXT,
ADD COLUMN     "secondChanceEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "secondChanceRangeEnd" INTEGER,
ADD COLUMN     "secondChanceRangeStart" INTEGER,
ADD COLUMN     "secondChanceWeekday" INTEGER DEFAULT 6;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledByUserId" TEXT,
ADD COLUMN     "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "commissionValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "netValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "possiblePrize" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "secondChanceDrawDate" TIMESTAMP(3),
ADD COLUMN     "secondChanceNumber" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "commissionRate" DECIMAL(65,30) DEFAULT 20.00,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "pushToken" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'SENT',
    "response" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
