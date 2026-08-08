-- CreateEnum
CREATE TYPE "ChildAuditType" AS ENUM ('CHILD_CREATED', 'CHILD_UPDATED', 'CHILD_ARCHIVED', 'LOCK', 'UNLOCK', 'SETTINGS_UPDATE', 'BOOK_VISIBILITY', 'PARENT_PIN_SET', 'PARENT_PIN_CHANGED', 'PARENT_PIN_RESET');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "parentPinAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parentPinHash" TEXT,
ADD COLUMN     "parentPinLockedUntil" TIMESTAMP(3),
ADD COLUMN     "parentPinResetOtpAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parentPinResetOtpExpires" TIMESTAMP(3),
ADD COLUMN     "parentPinResetOtpHash" TEXT;

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "avatarEmoji" TEXT NOT NULL DEFAULT '🦊',
    "avatarColor" TEXT NOT NULL DEFAULT '#4a9e3f',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "dailyLimitMinutes" INTEGER NOT NULL DEFAULT 60,
    "ruleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "ruleIntervalMinutes" INTEGER NOT NULL DEFAULT 20,
    "ruleRestSeconds" INTEGER NOT NULL DEFAULT 20,
    "allowWindowEnabled" BOOLEAN NOT NULL DEFAULT true,
    "allowStart" TEXT NOT NULL DEFAULT '07:00',
    "allowEnd" TEXT NOT NULL DEFAULT '20:30',
    "mandatoryBreakEnabled" BOOLEAN NOT NULL DEFAULT true,
    "breakAfterMinutes" INTEGER NOT NULL DEFAULT 45,
    "breakDurationMinutes" INTEGER NOT NULL DEFAULT 10,
    "tipsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tipsFrequency" TEXT NOT NULL DEFAULT 'rest',
    "notifyPush" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnLimitExceeded" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnSkippedRest" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildBookAccess" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildBookAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildActivityLog" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "bookId" TEXT,
    "minutes" INTEGER NOT NULL,
    "occurredOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildAuditLog" (
    "id" TEXT NOT NULL,
    "childId" TEXT,
    "parentId" TEXT NOT NULL,
    "type" "ChildAuditType" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChildProfile_parentId_idx" ON "ChildProfile"("parentId");

-- CreateIndex
CREATE INDEX "ChildBookAccess_childId_idx" ON "ChildBookAccess"("childId");

-- CreateIndex
CREATE INDEX "ChildBookAccess_bookId_idx" ON "ChildBookAccess"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildBookAccess_childId_bookId_key" ON "ChildBookAccess"("childId", "bookId");

-- CreateIndex
CREATE INDEX "ChildActivityLog_childId_occurredOn_idx" ON "ChildActivityLog"("childId", "occurredOn");

-- CreateIndex
CREATE INDEX "ChildAuditLog_childId_idx" ON "ChildAuditLog"("childId");

-- CreateIndex
CREATE INDEX "ChildAuditLog_parentId_createdAt_idx" ON "ChildAuditLog"("parentId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildBookAccess" ADD CONSTRAINT "ChildBookAccess_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildBookAccess" ADD CONSTRAINT "ChildBookAccess_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildActivityLog" ADD CONSTRAINT "ChildActivityLog_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildActivityLog" ADD CONSTRAINT "ChildActivityLog_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAuditLog" ADD CONSTRAINT "ChildAuditLog_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildAuditLog" ADD CONSTRAINT "ChildAuditLog_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
