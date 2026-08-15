-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "purchasedFormats" "BookFormat"[] DEFAULT ARRAY[]::"BookFormat"[];
