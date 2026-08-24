-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "loyaltyDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyTier" TEXT;

-- CreateIndex
CREATE INDEX "Order_userId_paymentStatus_status_idx" ON "Order"("userId", "paymentStatus", "status");