-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "colorClass" TEXT DEFAULT 'bg-emerald-600',
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "iconName" TEXT DEFAULT 'game-controller-outline',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
