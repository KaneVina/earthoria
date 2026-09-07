const cloudinary = require("../config/cloudinary");
const fs = require("fs");

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
      },
    );
  });
}

function uploadImageBuffer(buffer, bookId) {
  return new Promise((resolve, reject) => {
    const publicId = `books/${bookId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        public_id: publicId,
        overwrite: false,
        transformation: [{ width: 1600, crop: "limit" }],
      },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

function uploadGameImageBuffer(buffer, gameId) {
  return new Promise((resolve, reject) => {
    const publicId = `games/${gameId || "draft"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        public_id: publicId,
        overwrite: false,
        transformation: [{ width: 1000, crop: "limit" }],
      },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

function uploadEbookImageBuffer(buffer, ebookId) {
  return new Promise((resolve, reject) => {
    const publicId = `ebooks/${ebookId || "draft"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        public_id: publicId,
        overwrite: false,
        transformation: [{ width: 1400, crop: "limit" }],
      },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

function deleteImageByPublicId(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

function extractPublicId(url) {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return m ? m[1] : null;
}

// ═══════ MỚI THÊM — upload/xóa file công khai cho module News ═══════
// Dùng resource_type "raw" để hỗ trợ mọi loại file (pdf, docx, xlsx, zip, ...),
// không chỉ ảnh. Giữ tên gốc (đã làm sạch) trong public_id để dễ nhận diện trên Cloudinary.
function uploadNewsFileBuffer(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const safeName = (originalName || "file")
      .replace(/\.[^/.]+$/, "") // bỏ đuôi file
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 60);
    const ext = (originalName.split(".").pop() || "").toLowerCase();
    const publicId = `news/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: ext ? `${publicId}.${ext}` : publicId,
        overwrite: false,
      },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

function deleteRawByPublicId(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

module.exports = {
  uploadGlbFile,
  uploadImageBuffer,
  uploadGameImageBuffer,
  uploadEbookImageBuffer,
  deleteImageByPublicId,
  extractPublicId,
  uploadNewsFileBuffer,
  deleteRawByPublicId,
};
