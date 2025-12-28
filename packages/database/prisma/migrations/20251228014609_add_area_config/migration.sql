-- CreateTable
CREATE TABLE "AreaConfig" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "commissionRate" DECIMAL(65,30),
    "prizeMultiplier" DECIMAL(65,30),
    "maxLiability" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AreaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AreaConfig_areaId_gameId_key" ON "AreaConfig"("areaId", "gameId");

-- AddForeignKey
ALTER TABLE "AreaConfig" ADD CONSTRAINT "AreaConfig_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaConfig" ADD CONSTRAINT "AreaConfig_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
