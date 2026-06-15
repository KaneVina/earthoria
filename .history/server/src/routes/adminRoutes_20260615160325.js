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

module.exports = router