const express = require('express')
const router = express.Router()
const {
  getDashboard,
  adminGetBooks, adminCreateBook, adminUpdateBook, adminDeleteBook,
  adminGetCategories, adminCreateCategory, adminUpdateCategory,
  adminGetOrders, adminUpdateOrder,
  adminGetUsers, adminToggleUser,
  adminGetCoupons, adminCreateCoupon, adminToggleCoupon
} = require('../controllers/adminController')
const { protect, adminOnly } = require('../middlewares/authMiddleware')

router.use(protect, adminOnly)

router.get('/dashboard', getDashboard)

router.get('/books',         adminGetBooks)
router.post('/books',        adminCreateBook)
router.put('/books/:id',     adminUpdateBook)
router.delete('/books/:id',  adminDeleteBook)

router.get('/categories',        adminGetCategories)
router.post('/categories',       adminCreateCategory)
router.put('/categories/:id',    adminUpdateCategory)

router.get('/orders',            adminGetOrders)
router.put('/orders/:id',        adminUpdateOrder)

router.get('/users',             adminGetUsers)
router.put('/users/:id/toggle',  adminToggleUser)

router.get('/coupons',           adminGetCoupons)
router.post('/coupons',          adminCreateCoupon)
router.put('/coupons/:id/toggle',adminToggleCoupon)
// ── UptimeRobot proxy ──
router.get('/server-status', async (req, res) => {
  try {
    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        api_key:              process.env.UPTIMEROBOT_API_KEY,
        monitors:             process.env.UPTIMEROBOT_MONITOR_ID,
        response_times:       '1',
        response_times_limit: '10',
      }),
    })
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ stat: 'fail', message: err.message })
  }
})

module.exports = router
module.exports = router