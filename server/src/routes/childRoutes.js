const express = require("express");
const router = express.Router();
const {
  listChildren,
  createChild,
  archiveChild,
  getChildDashboard,
  updateChildSettings,
  lockChild,
  unlockChild,
  getChildBooks,
  toggleChildBookVisibility,
  getKidLink,
  regenerateKidLink,
  deleteChildPermanently,
} = require("../controllers/childController");
const { protect } = require("../middlewares/authMiddleware");
const { parentPinLimiter } = require("../middlewares/rateLimiters");

router.use(protect);

router.get("/", listChildren);
router.post("/", createChild);

router.get("/:childId/dashboard", getChildDashboard);
router.patch("/:childId/settings", updateChildSettings);
router.delete("/:childId", archiveChild); // xoá mềm (ẩn hồ sơ)
router.delete("/:childId/permanent", parentPinLimiter, deleteChildPermanently); // xoá vĩnh viễn, cần PIN + gõ đúng tên

router.get("/:childId/kid-link", getKidLink);
router.post(
  "/:childId/kid-link/regenerate",
  parentPinLimiter,
  regenerateKidLink,
);

router.post("/:childId/lock", lockChild);
router.post("/:childId/unlock", parentPinLimiter, unlockChild);

router.get("/:childId/books", getChildBooks);
router.patch("/:childId/books/:bookId", toggleChildBookVisibility);

module.exports = router;
