const express = require("express");
const router = express.Router();
const { getPublicMaintenance } = require("../controllers/maintenanceController");

router.get("/public", getPublicMaintenance);

module.exports = router;