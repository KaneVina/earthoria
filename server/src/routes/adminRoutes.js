const express = require('express')
const router = express.Router()
const uploadGlb = require('../middlewares/uploadGlb')
const {
  getDashboard,
  // Products (books)
  getProducts, createProduct, updateProduct, deleteProduct,
  // Categories
  getCategories, createCategory, updateCategory,
  // Orders
  getOrders, updateOrderStatus,
  // Users
  getUsers, toggleUser, backfillUserCodes,
  // Coupons
  getCoupons, createCoupon, toggleCoupon,
  // Ar
   getArCodes, createArCode, updateArCode, toggleArCode,
} = require('../controllers/adminController')
const { protect, adminOnly } = require('../middlewares/authMiddleware')

router.use(protect, adminOnly)

// ── Dashboard ──
router.get('/dashboard', getDashboard)

// ── Products (/admin/products) ──
router.get('/products',        getProducts)
router.post('/products',       createProduct)
router.put('/products/:id',    updateProduct)
router.delete('/products/:id', deleteProduct)

// ── Categories ──
router.get('/categories',        getCategories)
router.post('/categories',       createCategory)
router.put('/categories/:id',    updateCategory)

// ── Orders ──
router.get('/orders',      getOrders)
router.put('/orders/:id',  updateOrderStatus)

// ── Users ──
router.get('/users',                  getUsers)
router.put('/users/:id/toggle',       toggleUser)
// Chạy 1 lần sau migration để gắn mã cho user cũ
router.post('/users/backfill-codes',  backfillUserCodes)

// ── Coupons ──
router.get('/coupons',            getCoupons)
router.post('/coupons',           createCoupon)
router.put('/coupons/:id/toggle', toggleCoupon)

// ── AR Codes ──
router.get('/products/:bookId/ar-codes',  getArCodes)
router.post('/products/:bookId/ar-codes', uploadGlb.single('model'), createArCode)
router.put('/ar-codes/:id',               uploadGlb.single('model'), updateArCode)
router.put('/ar-codes/:id/toggle',        toggleArCode)

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