-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN "alternativeLogoWidth" INTEGER DEFAULT 500,
ADD COLUMN "alternativeLogoHeight" INTEGER DEFAULT 85,
ADD COLUMN "alternativeQrWidth" INTEGER DEFAULT 120,
ADD COLUMN "alternativeQrHeight" INTEGER DEFAULT 120;
