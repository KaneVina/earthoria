const express = require("express");
const router = express.Router();
const {
  getPublicPosts,
  getPublicFiles,
} = require("../controllers/newsController");

// Public - không cần đăng nhập
router.get("/posts", getPublicPosts);
router.get("/files", getPublicFiles);

module.exports = router;
