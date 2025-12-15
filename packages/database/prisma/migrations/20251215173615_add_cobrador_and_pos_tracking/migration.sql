-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'COBRADOR';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "cobradorId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "securityPin" TEXT;

-- CreateTable
CREATE TABLE "PosTerminal" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "currentUserId" TEXT,
    "lastUserId" TEXT,
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosTerminal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PosTerminal_deviceId_key" ON "PosTerminal"("deviceId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cobradorId_fkey" FOREIGN KEY ("cobradorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosTerminal" ADD CONSTRAINT "PosTerminal_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosTerminal" ADD CONSTRAINT "PosTerminal_lastUserId_fkey" FOREIGN KEY ("lastUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
