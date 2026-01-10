-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "cancelledByName" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "createdByName" TEXT,
ADD COLUMN     "planDetails" JSONB,
ADD COLUMN     "planId" TEXT,
ADD COLUMN     "planName" TEXT;

-- CreateIndex
CREATE INDEX "Payment_createdBy_idx" ON "Payment"("createdBy");
