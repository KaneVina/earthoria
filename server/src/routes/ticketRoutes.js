const express = require("express");
const router = express.Router();
const { createTicket } = require("../controllers/ticketController");
const { optionalAuth } = require("../middlewares/optionalAuth");
const { ticketLimiter } = require("../middlewares/rateLimiters");

// Public — không bắt buộc đăng nhập, nhưng nếu có token hợp lệ thì vẫn gắn userId
router.post("/", ticketLimiter, optionalAuth, createTicket);

module.exports = router;
