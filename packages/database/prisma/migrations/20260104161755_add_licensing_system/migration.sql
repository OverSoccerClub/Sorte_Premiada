/*
  Warnings:

  - Added the required column `lastModifiedAt` to the `CompanySettings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASIC', 'PRO', 'ENTERPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastModifiedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lastModifiedBy" TEXT,
ADD COLUMN     "lastPaymentDate" TIMESTAMP(3),
ADD COLUMN     "licenseExpiresAt" TIMESTAMP(3),
ADD COLUMN     "licenseStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "licenseStatus" "LicenseStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN     "maxGames" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "maxTicketsPerMonth" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "maxUsers" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "monthlyPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "referenceMonth" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageStats" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "totalTickets" INTEGER NOT NULL DEFAULT 0,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousStatus" "LicenseStatus",
    "newStatus" "LicenseStatus" NOT NULL,
    "previousPlan" "SubscriptionPlan",
    "newPlan" "SubscriptionPlan",
    "reason" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedByName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_companyId_idx" ON "Payment"("companyId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_dueDate_idx" ON "Payment"("dueDate");

-- CreateIndex
CREATE INDEX "Payment_referenceMonth_idx" ON "Payment"("referenceMonth");

-- CreateIndex
CREATE INDEX "UsageStats_companyId_idx" ON "UsageStats"("companyId");

-- CreateIndex
CREATE INDEX "UsageStats_month_idx" ON "UsageStats"("month");

-- CreateIndex
CREATE UNIQUE INDEX "UsageStats_companyId_month_key" ON "UsageStats"("companyId", "month");

-- CreateIndex
CREATE INDEX "LicenseHistory_companyId_idx" ON "LicenseHistory"("companyId");

-- CreateIndex
CREATE INDEX "LicenseHistory_createdAt_idx" ON "LicenseHistory"("createdAt");

-- CreateIndex
CREATE INDEX "LicenseHistory_action_idx" ON "LicenseHistory"("action");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageStats" ADD CONSTRAINT "UsageStats_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseHistory" ADD CONSTRAINT "LicenseHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
