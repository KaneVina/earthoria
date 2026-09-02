const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { sendMessage } = require("../controllers/aiChatController");
const { optionalAuth } = require("../middlewares/authMiddleware");

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12, // tối đa 12 tin nhắn / phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Bạn đang gửi tin nhắn hơi nhanh, vui lòng chờ một chút rồi thử lại 🌿",
  },
});

// URL: /api/v1/ai
router.post("/chat", chatLimiter, optionalAuth, sendMessage);

module.exports = router;
