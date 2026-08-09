const express = require('express')
const router = express.Router()
const {
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  replyToTicket,
} = require('../controllers/adminTicketController')

// Middleware protect + staffOrAdmin đã được áp dụng ở adminRoutes.js trước khi vào router này

router.get('/', getTickets)
router.get('/:id', getTicketById)
router.patch('/:id/status', updateTicketStatus)
router.patch('/:id/assign', assignTicket)
router.post('/:id/reply', replyToTicket)

module.exports = router