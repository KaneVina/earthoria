const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

async function uploadGlbFile(filePath) {
  const form = new FormData();

  form.append("reqtype", "fileupload");
  form.append("fileToUpload", fs.createReadStream(filePath));

  try {
    const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    if (typeof data !== "string" || !data.startsWith("https://")) {
      throw new Error(data);
    }

    return data;
  } finally {
    fs.unlink(filePath, () => {});
  }
}

module.exports = {
  uploadGlbFile,
};
