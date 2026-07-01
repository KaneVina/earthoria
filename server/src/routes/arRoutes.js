const express = require('express')
const router = express.Router()
const { getArCode, getMyArCodes } = require('../controllers/arController')
const { protect } = require('../middlewares/authMiddleware')

// LƯU Ý THỨ TỰ: '/my-books' phải khai báo TRƯỚC '/:code', nếu không
// Express sẽ khớp '/my-books' vào param :code trước (vì cùng là 1
// segment), khiến route thứ 2 không bao giờ được gọi tới.
router.get('/my-books', protect, getMyArCodes)

// Route quét QR — giờ bắt buộc đăng nhập. Chưa có token hợp lệ → 401
// từ chính middleware `protect`, frontend tự điều hướng sang /login.
router.get('/:code', protect, getArCode)

module.exports = router