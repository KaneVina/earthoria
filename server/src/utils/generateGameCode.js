const crypto = require("crypto");
function generateGameCode() {
  return crypto.randomBytes(24).toString("base64url");
}

module.exports = { generateGameCode };
