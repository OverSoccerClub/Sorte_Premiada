-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN "initials" TEXT;

-- Update existing companies with their initials
UPDATE "CompanySettings" SET "initials" = 'AP' WHERE "slug" = 'perseveranca';
UPDATE "CompanySettings" SET "initials" = 'IM' WHERE "slug" = 'imperial';
