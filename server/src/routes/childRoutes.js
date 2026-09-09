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
const {
  listBookRequests,
  respondBookRequest,
} = require("../controllers/childBookRequestController");
const { protect } = require("../middlewares/authMiddleware");
const { parentPinLimiter } = require("../middlewares/rateLimiters");

router.use(protect);

router.get("/", listChildren);
router.post("/", createChild);

// "Sách con muốn mua" - đặt TRƯỚC "/:childId/..." vì không gắn với 1 childId
// cụ thể trên URL (gộp yêu cầu của mọi bé thuộc phụ huynh đang đăng nhập).
router.get("/book-requests", listBookRequests);
router.patch("/book-requests/:requestId", respondBookRequest);

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
