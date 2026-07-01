const cloudinary = require('../config/cloudinary')

/**
 * Upload buffer .glb lên Cloudinary với resource_type: 'raw' (bắt buộc,
 * vì .glb không phải ảnh/video — để mặc định Cloudinary sẽ từ chối
 * hoặc xử lý sai).
 *
 * public_id CỐ ĐỊNH theo `code` của ArCode: khi thay model mới cho
 * cùng 1 mã QR, upload đè lên cùng public_id (overwrite: true) —
 * Cloudinary tự tăng version, không tích file rác, và không cần đổi
 * modelUrl thủ công vì secure_url trả về đã là bản mới nhất.
 */
function uploadGlbBuffer(buffer, code) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: `ar-models/${code}`,
        overwrite: true,
        invalidate: true, // xoá cache CDN của version cũ ngay lập tức
      },
      (err, result) => {
        if (err) return reject(err)
        resolve(result)
      }
    )
    stream.end(buffer)
  })
}

module.exports = { uploadGlbBuffer }