-- AlterTable
ALTER TABLE "User" ADD COLUMN     "securityPinExpiresAt" TIMESTAMP(3),
ADD COLUMN     "usernameExpiresAt" TIMESTAMP(3);
