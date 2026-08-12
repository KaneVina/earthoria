-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "repliedAt" TIMESTAMP(3),
ADD COLUMN     "repliedById" TEXT,
ADD COLUMN     "reply" TEXT;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_repliedById_fkey" FOREIGN KEY ("repliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
