const multer = require('multer')

const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
  if (!ok) return cb(new Error('Chỉ chấp nhận ảnh JPG/PNG/WEBP'), false)
  cb(null, true)
}

const uploadImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB / ảnh — KHÔNG giới hạn số lượng file (field .array không set max)
})

module.exports = uploadImages