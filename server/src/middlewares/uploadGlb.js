const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, require("os").tmpdir());
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

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
  limits: { fileSize: 200 * 1024 * 1024 },
});

module.exports = uploadGlb;
