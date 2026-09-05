-- AlterEnum
ALTER TYPE "ChildAuditType" ADD VALUE 'DAILY_LIMIT_EXCEEDED';

-- AlterEnum
ALTER TYPE "ChildAuditType" ADD VALUE 'SKIPPED_REST';

-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN     "notifyLimitExceededSentDate" TEXT,
ADD COLUMN     "notifySkippedRestSentDate" TEXT;