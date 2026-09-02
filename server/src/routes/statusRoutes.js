const express = require("express");
const router = express.Router();
const { getPublicStatus } = require("../controllers/statusController");

// GET /api/v1/status — public, dùng cho trang StatusPage.jsx
router.get("/", getPublicStatus);

module.exports = router;