const express = require("express");
const router = express.Router();
const {
  getKidPublicProfile,
  getKidPublicBooks,
  startKidActivity,
  pingKidActivity,
} = require("../controllers/childController");

router.get("/:token", getKidPublicProfile);
router.get("/:token/books", getKidPublicBooks);
router.post("/:token/activity/start", startKidActivity);
router.post("/:token/activity/:activityId/ping", pingKidActivity);

module.exports = router;