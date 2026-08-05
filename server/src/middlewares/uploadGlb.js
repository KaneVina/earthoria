const multer = require("multer");

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const isGlb =
    file.mimetype === "model/gltf-binary" ||
    file.originalname.toLowerCase().endsWith(".glb");

  if (!isGlb) {
    return cb(new Error("Chỉ chấp nhận file .glb"), false);
  }
  cb(null, true);
}

const uploadGlb = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
});

module.exports = uploadGlb;
