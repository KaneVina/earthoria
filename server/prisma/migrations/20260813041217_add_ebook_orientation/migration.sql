-- CreateEnum
CREATE TYPE "EbookOrientation" AS ENUM ('LANDSCAPE', 'PORTRAIT');

-- AlterTable
ALTER TABLE "Ebook" ADD COLUMN     "orientation" "EbookOrientation" NOT NULL DEFAULT 'LANDSCAPE';
