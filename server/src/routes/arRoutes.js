const express = require('express')
const router = express.Router()
const { getArCode } = require('../controllers/arController')

// Public route — KHÔNG gắn middleware xác thực (không cần đăng nhập).
// Lưu ý: route chỉ nhận :code, không nhận :slug — slug chỉ tồn tại ở
// phía frontend URL cho đẹp, backend không cần và không nên dựa vào nó.
router.get('/:code', getArCode)

module.exports = router