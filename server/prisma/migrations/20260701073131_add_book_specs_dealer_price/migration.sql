-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "coverType" TEXT,
ADD COLUMN     "dealerPrice" DOUBLE PRECISION,
ADD COLUMN     "dimensions" TEXT,
ADD COLUMN     "paperType" TEXT,
ADD COLUMN     "publishYear" INTEGER,
ADD COLUMN     "weightGrams" INTEGER;

-- CreateIndex
CREATE INDEX "Book_categoryId_idx" ON "Book"("categoryId");

-- CreateIndex
CREATE INDEX "Book_language_idx" ON "Book"("language");

-- CreateIndex
CREATE INDEX "Book_isActive_idx" ON "Book"("isActive");
