-- CreateEnum
CREATE TYPE "BugStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'FIXED', 'VALIDATED', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "BugSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "BugPriority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "BugStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "BugSeverity" NOT NULL,
    "priority" "BugPriority" NOT NULL,
    "location" TEXT,
    "stepsToReproduce" TEXT,
    "environment" TEXT,
    "reportedByUserId" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "fixDescription" TEXT,
    "fixedAt" TIMESTAMP(3),
    "fixedByUserId" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BugComment" (
    "id" TEXT NOT NULL,
    "bugReportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "statusChange" BOOLEAN,
    "previousStatus" "BugStatus",
    "newStatus" "BugStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BugComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BugReport_companyId_idx" ON "BugReport"("companyId");

-- CreateIndex
CREATE INDEX "BugReport_status_idx" ON "BugReport"("status");

-- CreateIndex
CREATE INDEX "BugReport_severity_idx" ON "BugReport"("severity");

-- CreateIndex
CREATE INDEX "BugReport_priority_idx" ON "BugReport"("priority");

-- CreateIndex
CREATE INDEX "BugReport_reportedByUserId_idx" ON "BugReport"("reportedByUserId");

-- CreateIndex
CREATE INDEX "BugReport_assignedToUserId_idx" ON "BugReport"("assignedToUserId");

-- CreateIndex
CREATE INDEX "BugComment_bugReportId_idx" ON "BugComment"("bugReportId");

-- CreateIndex
CREATE INDEX "BugComment_userId_idx" ON "BugComment"("userId");

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_fixedByUserId_fkey" FOREIGN KEY ("fixedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_validatedByUserId_fkey" FOREIGN KEY ("validatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugComment" ADD CONSTRAINT "BugComment_bugReportId_fkey" FOREIGN KEY ("bugReportId") REFERENCES "BugReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugComment" ADD CONSTRAINT "BugComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
