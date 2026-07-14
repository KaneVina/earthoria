const cloudinary = require('../config/cloudinary')

function uploadGlbBuffer(buffer, code) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: `ar-models/${code}.glb`,
        overwrite: true,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    )
    stream.end(buffer)
  })
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

function deleteImageByPublicId(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
}

function extractPublicId(url) {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/)
  return m ? m[1] : null
}

module.exports = { uploadGlbBuffer, uploadImageBuffer, deleteImageByPublicId, extractPublicId }