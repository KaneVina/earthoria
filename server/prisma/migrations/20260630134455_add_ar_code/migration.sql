-- CreateTable
CREATE TABLE "ArCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "modelUrl" TEXT NOT NULL,
    "posterUrl" TEXT,
    "bookId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArCode_code_key" ON "ArCode"("code");

-- CreateIndex
CREATE INDEX "ArCode_bookId_idx" ON "ArCode"("bookId");

-- AddForeignKey
ALTER TABLE "ArCode" ADD CONSTRAINT "ArCode_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
