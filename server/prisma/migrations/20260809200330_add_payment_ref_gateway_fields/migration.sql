-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'MOMO';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "gatewayTxnId" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentRef" TEXT;

-- CreateIndex
CREATE INDEX "Order_paymentRef_idx" ON "Order"("paymentRef");
