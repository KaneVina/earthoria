const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { sendMessage, getModels } = require("../controllers/aiChatController");
const { optionalAuth } = require("../middlewares/authMiddleware");
const { resolveUserMaxTier, DEFAULT_TIER } = require("../utils/aiModelTier");

// Hạng model càng cao thì trần tin nhắn/phút càng cao (đồng bộ với requestsPerMinute
// khai báo trong aiModelTier.js) — cần đặt optionalAuth TRƯỚC limiter để req.user có sẵn.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: async (req) => {
    try {
      const tier = await resolveUserMaxTier(req.user || null);
      return tier.requestsPerMinute;
    } catch {
      return DEFAULT_TIER.requestsPerMinute;
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Bạn đang gửi tin nhắn hơi nhanh, vui lòng chờ một chút rồi thử lại 🌿",
  },
});

// URL: /api/v1/ai
router.get("/models", optionalAuth, getModels);
router.post("/chat", optionalAuth, chatLimiter, sendMessage);

module.exports = router;
