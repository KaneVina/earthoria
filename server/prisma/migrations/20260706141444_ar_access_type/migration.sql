-- CreateEnum
CREATE TYPE "ArAccessType" AS ENUM ('CUSTOMER_ONLY', 'PUBLIC');

-- AlterTable
ALTER TABLE "ArCode" ADD COLUMN     "accessType" "ArAccessType" NOT NULL DEFAULT 'CUSTOMER_ONLY';
