-- AlterEnum
-- Thêm 2 giá trị mới vào enum ChildAuditType đã có sẵn.
ALTER TYPE "ChildAuditType" ADD VALUE 'BOOK_REQUEST_CREATED';
ALTER TYPE "ChildAuditType" ADD VALUE 'BOOK_REQUEST_RESPONDED';

-- CreateEnum
CREATE TYPE "ChildBookRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "ChildBookRequest" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "status" "ChildBookRequestStatus" NOT NULL DEFAULT 'PENDING',
    "parentNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildBookRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChildBookRequest_childId_status_idx" ON "ChildBookRequest"("childId", "status");

-- CreateIndex
CREATE INDEX "ChildBookRequest_bookId_idx" ON "ChildBookRequest"("bookId");

-- CreateIndex
CREATE INDEX "ChildBookRequest_status_createdAt_idx" ON "ChildBookRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ChildBookRequest" ADD CONSTRAINT "ChildBookRequest_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildBookRequest" ADD CONSTRAINT "ChildBookRequest_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;