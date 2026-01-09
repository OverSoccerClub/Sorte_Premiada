-- CreateEnum
CREATE TYPE "DailyCloseStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "DailyClose" ADD COLUMN     "status" "DailyCloseStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedByUserId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountabilityLimitHours" INTEGER DEFAULT 24,
ADD COLUMN     "limitOverrideExpiresAt" TIMESTAMP(3),
ADD COLUMN     "salesLimit" DECIMAL(65,30) DEFAULT 1000.00;
