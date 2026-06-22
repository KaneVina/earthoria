-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetOtpAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resetOtpExpires" TIMESTAMP(3),
ADD COLUMN     "resetOtpHash" TEXT;
