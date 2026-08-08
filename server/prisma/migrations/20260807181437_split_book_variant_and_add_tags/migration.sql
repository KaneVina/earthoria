/*
  Warnings:

  - You are about to drop the column `dealerPrice` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `productCode` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `salePrice` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `sold` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `bookId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `bookId` on the `InventoryImportItem` table. All the data in the column will be lost.
  - You are about to drop the column `bookId` on the `OrderItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cartId,variantId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `variantId` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `InventoryImportItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BookFormat" AS ENUM ('PHYSICAL', 'DIGITAL');

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_bookId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryImportItem" DROP CONSTRAINT "InventoryImportItem_bookId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_bookId_fkey";

-- DropIndex
DROP INDEX "Book_productCode_idx";

-- DropIndex
DROP INDEX "Book_productCode_key";

-- DropIndex
DROP INDEX "CartItem_bookId_idx";

-- DropIndex
DROP INDEX "InventoryImportItem_bookId_idx";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "dealerPrice",
DROP COLUMN "price",
DROP COLUMN "productCode",
DROP COLUMN "salePrice",
DROP COLUMN "sold",
DROP COLUMN "stock",
DROP COLUMN "unit";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "bookId",
ADD COLUMN     "variantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InventoryImportItem" DROP COLUMN "bookId",
ADD COLUMN     "variantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "bookId",
ADD COLUMN     "variantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "BookVariant" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "format" "BookFormat" NOT NULL,
    "productCode" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'Cuốn',
    "price" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION,
    "dealerPrice" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "isUnlimitedStock" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookTag" (
    "bookId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "BookTag_pkey" PRIMARY KEY ("bookId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookVariant_productCode_key" ON "BookVariant"("productCode");

-- CreateIndex
CREATE INDEX "BookVariant_bookId_idx" ON "BookVariant"("bookId");

-- CreateIndex
CREATE INDEX "BookVariant_productCode_idx" ON "BookVariant"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "BookVariant_bookId_format_key" ON "BookVariant"("bookId", "format");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "BookTag_tagId_idx" ON "BookTag"("tagId");

-- CreateIndex
CREATE INDEX "CartItem_variantId_idx" ON "CartItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem"("cartId", "variantId");

-- CreateIndex
CREATE INDEX "InventoryImportItem_variantId_idx" ON "InventoryImportItem"("variantId");

-- AddForeignKey
ALTER TABLE "InventoryImportItem" ADD CONSTRAINT "InventoryImportItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "BookVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookVariant" ADD CONSTRAINT "BookVariant_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookTag" ADD CONSTRAINT "BookTag_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookTag" ADD CONSTRAINT "BookTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "BookVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "BookVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
