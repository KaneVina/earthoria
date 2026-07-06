// src/routes/emailRoutes.js
// Mount dưới adminRoutes.js (đã có protect + adminOnly áp dụng ở router.use() gốc)
const express = require('express')
const router = express.Router()
const {
  getEmailHistory,
  getEmailDetail,
  sendManualEmail,
  previewManualEmail,
  getSenderProfile,
  searchCustomers,
} = require('../controllers/emailController')

// ⚠️ Thứ tự quan trọng: các route cụ thể (/me, /customers) PHẢI đứng
// trước route động (/:id), nếu không Express sẽ hiểu "me"/"customers"
// là 1 giá trị :id và gọi nhầm getEmailDetail.

// ── Thông tin phục vụ soạn email ──
router.get('/me',        getSenderProfile)   // thông tin tài khoản đang đăng nhập (chữ ký)
router.get('/customers', searchCustomers)    // gợi ý email khách hàng

// ── Lịch sử email ──
router.get('/',    getEmailHistory)
router.get('/:id', getEmailDetail)

// ── Soạn thủ công ──
router.post('/preview', previewManualEmail)  // xem trước HTML, KHÔNG gửi mail thật
router.post('/send',    sendManualEmail)

module.exports = router