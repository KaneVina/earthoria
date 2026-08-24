const express = require('express')
const router = express.Router()
const { getMyLoyaltyProfile, getLoyaltyTiers } = require('../controllers/loyaltyController')
const { protect } = require('../middlewares/authMiddleware')

router.get('/tiers', getLoyaltyTiers)
router.get('/me', protect, getMyLoyaltyProfile)

module.exports = router