const crypto = require("crypto");

function generateKidLinkToken() {
  return crypto.randomBytes(24).toString("hex");
}

function slugifyName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "be";
}

function buildKidLinkUrl(baseUrl, name, token) {
  const slug = slugifyName(name);
  return `${baseUrl.replace(/\/$/, "")}/e-kid/${slug}/${token}`;
}

module.exports = { generateKidLinkToken, slugifyName, buildKidLinkUrl };