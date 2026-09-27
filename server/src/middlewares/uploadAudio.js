const multer = require("multer");

const storage = multer.memoryStorage();

const ALLOWED_MIME = [
  "audio/mpeg", // .mp3
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/x-m4a",
  "audio/m4a",
  "audio/mp4", // 1 số trình duyệt gắn .m4a với mime này
  "audio/aac",
  "audio/webm",
];

function fileFilter(req, file, cb) {
  const ok = ALLOWED_MIME.includes(file.mimetype);
  if (!ok)
    return cb(
      new Error("Chỉ chấp nhận file âm thanh (MP3/WAV/OGG/M4A/AAC)"),
      false,
    );
  cb(null, true);
}

const uploadAudio = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB / file nhạc
});

module.exports = uploadAudio;
