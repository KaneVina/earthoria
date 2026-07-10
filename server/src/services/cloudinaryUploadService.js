const cloudinary = require('../config/cloudinary')

function uploadGlbBuffer(buffer, code) { /* giữ nguyên như cũ */ }

/**
 * Upload 1 ảnh sách lên Cloudinary. Mỗi ảnh có public_id RIÊNG (không cố định
 * như .glb) vì 1 sách có nhiều ảnh cùng lúc, không phải "đè bản mới nhất".
 * folder: books/{bookId}/{timestamp}-{random}
 */
function uploadImageBuffer(buffer, bookId) {
  return new Promise((resolve, reject) => {
    const publicId = `books/${bookId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: publicId,
        overwrite: false,
        // giới hạn chiều rộng tối đa, giữ tỉ lệ, tránh ảnh gốc quá nặng
        transformation: [{ width: 1600, crop: 'limit' }],
      },
      (err, result) => (err ? reject(err) : resolve(result))
    )
    stream.end(buffer)
  })
}

function deleteImageByPublicId(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
}

/** Lấy public_id từ 1 secure_url dạng .../upload/v123456/books/xxx/yyy.jpg */
function extractPublicId(url) {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/)
  return m ? m[1] : null
}

module.exports = { uploadGlbBuffer, uploadImageBuffer, deleteImageByPublicId, extractPublicId }