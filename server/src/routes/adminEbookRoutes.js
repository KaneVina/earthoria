const express = require("express");
const router = express.Router();
const uploadImages = require("../middlewares/uploadImages");
const uploadAudio = require("../middlewares/uploadAudio");
const {
  getEbooksGroupedAll,
  getEbooksForBook,
  getEbookById,
  createEbook,
  updateEbook,
  toggleEbook,
  deleteEbook,
  uploadEbookImage,
  deleteEbookImage,
  uploadEbookAudio,
  deleteEbookAudio,
} = require("../controllers/adminEbookController");

router.post("/upload-image", uploadImages.single("image"), uploadEbookImage);
router.post("/delete-image", deleteEbookImage);
router.post("/upload-audio", uploadAudio.single("audio"), uploadEbookAudio);
router.post("/delete-audio", deleteEbookAudio);
router.get("/book/:bookId", getEbooksForBook);
router.post("/book/:bookId", createEbook);

router.get("/", getEbooksGroupedAll);
router.get("/:id", getEbookById);
router.put("/:id", updateEbook);
router.put("/:id/toggle", toggleEbook);
router.delete("/:id", deleteEbook);

module.exports = router;
