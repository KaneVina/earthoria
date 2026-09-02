const express = require("express");
const router = express.Router();
const uploadImages = require("../middlewares/uploadImages");
const {
  getGamesGroupedAll,
  getGamesForBook,
  getGameById,
  createGame,
  updateGame,
  toggleGame,
  updateGameAccess,
  deleteGame,
  getGameLeaderboardAdmin,
  uploadGameImage,
  deleteGameImage,
} = require("../controllers/adminGameController");

router.post("/upload-image", uploadImages.single("image"), uploadGameImage);
router.post("/delete-image", deleteGameImage);
router.get("/book/:bookId", getGamesForBook);
router.post("/book/:bookId", createGame);

router.get("/", getGamesGroupedAll);
router.get("/:id", getGameById);
router.get("/:id/leaderboard", getGameLeaderboardAdmin);
router.patch("/:id/access", updateGameAccess);
router.put("/:id", updateGame);
router.put("/:id/toggle", toggleGame);
router.delete("/:id", deleteGame);

module.exports = router;
