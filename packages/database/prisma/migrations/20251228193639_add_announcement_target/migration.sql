-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "targetUserId" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "secondChanceStatus" "TicketStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canCancelTickets" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SecondChanceDraw" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "winningNumber" INTEGER NOT NULL,
    "prizeAmount" DECIMAL(65,30) NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecondChanceDraw_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SecondChanceDraw" ADD CONSTRAINT "SecondChanceDraw_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
