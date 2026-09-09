require("dotenv").config({ override: true });
const logger = require("./config/logger");
const { captureException } = require("./config/sentry");
const app = require("./app");
const prisma = require("./config/db");
const { verifyEmailTransport } = require("./services/emailService");
const { startPaymentExpiryJob } = require("./services/paymentExpiryService");

const PORT = process.env.PORT || 5000;
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Promise Rejection:", reason);
  captureException(
    reason instanceof Error ? reason : new Error(String(reason)),
  );
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  captureException(err);
  // Thoát có kiểm soát - không cố "sống sót" sau lỗi không xác định được,
  // vì tiến trình có thể đang ở trạng thái không nhất quán.
  process.exit(1);
});

async function main() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      verifyEmailTransport();
      startPaymentExpiryJob(); // quét đơn VNPay/MoMo hết phiên thanh toán mỗi 60s → hoàn kho/coupon tự động
    });
  } catch (error) {
    logger.error("Database connection failed:", error);
    process.exit(1);
  }
}

main();
