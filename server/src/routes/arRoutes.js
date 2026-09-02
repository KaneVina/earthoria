const express = require("express");
const router = express.Router();
const { getArCode, getMyArCodes } = require("../controllers/arController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/my-books", protect, getMyArCodes);
const { optionalAuth } = require("../middlewares/optionalAuth");
router.get("/:code", optionalAuth, getArCode);

module.exports = router;
