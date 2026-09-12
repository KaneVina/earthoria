const express = require("express");
const router = express.Router();
const uploadNewsFile = require("../middlewares/uploadNewsFile");
const {
  getPosts,
  createPost,
  updatePost,
  toggleHidePost,
  softDeletePost,
  restorePost,
  hardDeletePost,
  getFiles,
  createFile,
  toggleHideFile,
  softDeleteFile,
  restoreFile,
  hardDeleteFile,
} = require("../controllers/adminNewsController");

// Bảng tin
router.get("/posts", getPosts);
router.post("/posts", createPost);
router.put("/posts/:id", updatePost);
router.patch("/posts/:id/hide", toggleHidePost);
router.patch("/posts/:id/restore", restorePost);
router.delete("/posts/:id/soft", softDeletePost);
router.delete("/posts/:id/hard", hardDeletePost);

// File công khai
router.get("/files", getFiles);
router.post("/files", uploadNewsFile.single("file"), createFile);
router.patch("/files/:id/hide", toggleHideFile);
router.patch("/files/:id/restore", restoreFile);
router.delete("/files/:id/soft", softDeleteFile);
router.delete("/files/:id/hard", hardDeleteFile);

module.exports = router;
