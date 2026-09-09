const logger = require("./logger");

let Sentry = null;

function initSentry(app) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info("SENTRY_DSN chưa được cấu hình - bỏ qua error tracking.");
    return null;
  }

  Sentry = require("@sentry/node");
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1, // 10% request được trace hiệu năng, tránh tốn quota
  });

  logger.info("Sentry error tracking đã bật.");
  return Sentry;
}

function setupExpressErrorHandler(app) {
  if (Sentry) Sentry.setupExpressErrorHandler(app);
}

function captureException(err) {
  if (Sentry) Sentry.captureException(err);
}

module.exports = { initSentry, setupExpressErrorHandler, captureException };
