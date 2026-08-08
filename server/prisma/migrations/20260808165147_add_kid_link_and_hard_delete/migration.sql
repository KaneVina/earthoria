/*
  Warnings:

  - A unique constraint covering the columns `[kidLinkToken]` on the table `ChildProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ChildAuditType" ADD VALUE 'CHILD_DELETED';
ALTER TYPE "ChildAuditType" ADD VALUE 'KID_LINK_REGENERATED';

-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN     "kidLinkToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ChildProfile_kidLinkToken_key" ON "ChildProfile"("kidLinkToken");
