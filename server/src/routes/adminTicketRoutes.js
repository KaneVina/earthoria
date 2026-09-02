const express = require("express");
const router = express.Router();
const {
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  replyToTicket,
} = require("../controllers/adminTicketController");

router.get("/", getTickets);
router.get("/:id", getTicketById);
router.patch("/:id/status", updateTicketStatus);
router.patch("/:id/assign", assignTicket);
router.post("/:id/reply", replyToTicket);

module.exports = router;
