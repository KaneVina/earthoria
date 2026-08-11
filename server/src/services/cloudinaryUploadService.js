const cloudinary = require('../config/cloudinary')
const fs = require('fs')

function uploadGlbFile(filePath, code) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      filePath,
      {
        resource_type: "raw",
        public_id: `ar-models/${code}.glb`,
        overwrite: true,
        chunk_size: 20 * 1024 * 1024,
      },
      (err, result) => {
        fs.unlink(filePath, () => {});

        if (err) return reject(err);

        resolve(result);
      }
    );
  });
}

function uploadImageBuffer(buffer, bookId) {
  return new Promise((resolve, reject) => {
    const publicId = `books/${bookId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: publicId,
        overwrite: false,
        transformation: [{ width: 1600, crop: 'limit' }],
      },
      (err, result) => (err ? reject(err) : resolve(result))
    )
    stream.end(buffer)
  })
}

// Ảnh dùng bên trong nội dung trò chơi (thẻ lật, ảnh minh hoạ ghép cặp,
// thumbnail...) — tách thư mục riêng "games/" trong Cloudinary để không
// lẫn với ảnh sản phẩm sách trong "books/".
function uploadGameImageBuffer(buffer, gameId) {
  return new Promise((resolve, reject) => {
    const publicId = `games/${gameId || 'draft'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: publicId,
        overwrite: false,
        transformation: [{ width: 1000, crop: 'limit' }],
      },
      (err, result) => (err ? reject(err) : resolve(result))
    )
    stream.end(buffer)
  })
}

function deleteImageByPublicId(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
}

function extractPublicId(url) {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/)
  return m ? m[1] : null
}

module.exports = {
  uploadGlbFile,
  uploadImageBuffer,
  uploadGameImageBuffer,
  deleteImageByPublicId,
  extractPublicId,
}