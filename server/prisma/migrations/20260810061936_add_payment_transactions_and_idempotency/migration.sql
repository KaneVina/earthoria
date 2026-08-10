-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('VNPAY', 'MOMO');

-- CreateEnum
CREATE TYPE "PaymentTxnType" AS ENUM ('CREATE', 'RETURN', 'IPN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'FAILED';
ALTER TYPE "PaymentStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentSessionExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "gateway" "PaymentGateway" NOT NULL,
    "type" "PaymentTxnType" NOT NULL,
    "paymentRef" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "gatewayTxnId" TEXT,
    "resultCode" TEXT,
    "message" TEXT,
    "isValidSignature" BOOLEAN NOT NULL DEFAULT false,
    "rawPayload" JSONB NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIdempotency" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_paymentRef_idx" ON "PaymentTransaction"("paymentRef");

-- CreateIndex
CREATE INDEX "PaymentTransaction_gateway_type_idx" ON "PaymentTransaction"("gateway", "type");

-- CreateIndex
CREATE INDEX "PaymentIdempotency_expiresAt_idx" ON "PaymentIdempotency"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIdempotency_userId_idempotencyKey_endpoint_key" ON "PaymentIdempotency"("userId", "idempotencyKey", "endpoint");

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
