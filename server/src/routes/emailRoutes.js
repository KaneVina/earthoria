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

//    Thông tin phục vụ soạn email
router.get('/me',        getSenderProfile)   // thông tin tài khoản đang đăng nhập (chữ ký)
router.get('/customers', searchCustomers)    // gợi ý email khách hàng

//    Lịch sử email
router.get('/',    getEmailHistory)
router.get('/:id', getEmailDetail)

//    Soạn thủ công
router.post('/preview', previewManualEmail)  // xem trước HTML, KHÔNG gửi mail thật
router.post('/send',    sendManualEmail)

module.exports = router