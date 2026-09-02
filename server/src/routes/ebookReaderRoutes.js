const express = require("express");
const router = express.Router();
const { getEbookForReading } = require("../controllers/ebookReaderController");
const { optionalAuth } = require("../middlewares/optionalAuth");

router.get("/:slug", optionalAuth, getEbookForReading);

module.exports = router;
