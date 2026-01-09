-- AlterTable
ALTER TABLE "User" ADD COLUMN     "areaId" TEXT;

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
