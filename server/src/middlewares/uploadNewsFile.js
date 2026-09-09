const multer = require("multer");

const storage = multer.memoryStorage();

// Chấp nhận hầu hết loại file văn phòng / ảnh / nén - KHÔNG chấp nhận file thực thi
const BLOCKED_EXT = ["exe", "bat", "cmd", "sh", "msi", "com", "scr"];

function fileFilter(req, file, cb) {
  const ext = (file.originalname.split(".").pop() || "").toLowerCase();
  if (BLOCKED_EXT.includes(ext)) {
    return cb(new Error("Loại file này không được phép tải lên"), false);
  }
  cb(null, true);
}

const uploadNewsFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB / file
});

module.exports = uploadNewsFile;
