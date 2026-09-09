const express = require("express");
const router = express.Router();
const {
  getKidPublicProfile,
  getKidPublicBooks,
  startKidActivity,
  pingKidActivity,
  reportSkippedRest,
} = require("../controllers/childController");
const { getKidGarden } = require("../controllers/childGardenController");
const {
  getKidDiscoverBooks,
  getKidBookRequests,
  createKidBookRequest,
} = require("../controllers/childBookRequestController");

router.get("/:token", getKidPublicProfile);
router.get("/:token/books", getKidPublicBooks);
router.post("/:token/activity/start", startKidActivity);
router.post("/:token/activity/:activityId/ping", pingKidActivity);
router.post("/:token/skipped-rest", reportSkippedRest);
router.get("/:token/garden", getKidGarden);

// "Khám phá thêm": sách bán chạy + phù hợp độ tuổi, và lời nhắn "nhờ ba mẹ mua"
router.get("/:token/discover", getKidDiscoverBooks);
router.get("/:token/book-requests", getKidBookRequests);
router.post("/:token/book-requests", createKidBookRequest);

module.exports = router;
