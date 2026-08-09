const express = require('express')
const router = express.Router()
const { getPublicSettings } = require('../controllers/settingsController')

// Public — mọi người (kể cả khách chưa đăng nhập) đều gọi được để biết web có đang bảo trì không
router.get('/public', getPublicSettings)

module.exports = router