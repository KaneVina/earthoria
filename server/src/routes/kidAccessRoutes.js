const express = require("express");
const router = express.Router();
const { getKidPublicProfile, getKidPublicBooks } = require("../controllers/childController");

router.get("/:token", getKidPublicProfile);
router.get("/:token/books", getKidPublicBooks);

module.exports = router;