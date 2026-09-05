-- AlterTable
ALTER TABLE "Ebook" ADD COLUMN     "pageNumberPos" JSONB,
ADD COLUMN     "pageNumberColor" TEXT,
ADD COLUMN     "showTitleWithPageNumber" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hidePageNumberOnCover" BOOLEAN NOT NULL DEFAULT false;