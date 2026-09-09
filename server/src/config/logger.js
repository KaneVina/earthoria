const winston = require("winston");

const isProd = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  format: isProd
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(
          ({ timestamp, level, message, stack }) =>
            `${timestamp} ${level}: ${stack || message}`,
        ),
      ),
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

module.exports = logger;
