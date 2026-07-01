const multer = require('multer')

// Dùng memoryStorage — nhận file vào buffer trong RAM rồi đẩy thẳng lên
// Cloudinary qua upload_stream, KHÔNG ghi ra ổ đĩa server (đỡ phải dọn
// file tạm, và phù hợp môi trường serverless/ephemeral filesystem).
const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  const isGlb =
    file.mimetype === 'model/gltf-binary' ||
    file.originalname.toLowerCase().endsWith('.glb')

  if (!isGlb) {
    return cb(new Error('Chỉ chấp nhận file .glb'), false)
  }
  cb(null, true)
}

const uploadGlb = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — model chi tiết vẫn nằm trong ngưỡng này
})

module.exports = uploadGlb