const express = require("express");
const router = express.Router();
const {
  getReviews,
  getReviewById,
  replyToReview,
  toggleReviewVisibility,
} = require("../controllers/adminReviewController");

// Middleware protect + staffOrAdmin
router.get("/", getReviews);
router.get("/:id", getReviewById);
router.post("/:id/reply", replyToReview);
router.patch("/:id/visibility", toggleReviewVisibility);

module.exports = router;
