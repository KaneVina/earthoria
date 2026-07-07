/*
  Warnings:

  - A unique constraint covering the columns `[productCode]` on the table `Book` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "productCode" TEXT,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'Cuốn';

-- CreateTable
CREATE TABLE "ProductCodeSeq" (
    "date" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductCodeSeq_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "InventoryImport" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryImportItem" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productCode" TEXT,
    "unit" TEXT NOT NULL,
    "oldQty" INTEGER NOT NULL,
    "qtyDocument" INTEGER,
    "qtyActual" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InventoryImportItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryImport_code_key" ON "InventoryImport"("code");

-- CreateIndex
CREATE INDEX "InventoryImport_createdBy_idx" ON "InventoryImport"("createdBy");

-- CreateIndex
CREATE INDEX "InventoryImportItem_importId_idx" ON "InventoryImportItem"("importId");

-- CreateIndex
CREATE INDEX "InventoryImportItem_bookId_idx" ON "InventoryImportItem"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Book_productCode_key" ON "Book"("productCode");

-- CreateIndex
CREATE INDEX "Book_productCode_idx" ON "Book"("productCode");

-- AddForeignKey
ALTER TABLE "InventoryImport" ADD CONSTRAINT "InventoryImport_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportItem" ADD CONSTRAINT "InventoryImportItem_importId_fkey" FOREIGN KEY ("importId") REFERENCES "InventoryImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportItem" ADD CONSTRAINT "InventoryImportItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
