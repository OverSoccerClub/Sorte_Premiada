-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "maxActiveDevices" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "planId" TEXT,
ALTER COLUMN "lastModifiedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "maxTicketsPerMonth" INTEGER NOT NULL DEFAULT 1000,
    "maxGames" INTEGER NOT NULL DEFAULT 5,
    "maxActiveDevices" INTEGER NOT NULL DEFAULT 5,
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- AddForeignKey
ALTER TABLE "CompanySettings" ADD CONSTRAINT "CompanySettings_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
