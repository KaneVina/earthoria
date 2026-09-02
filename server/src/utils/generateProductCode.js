const crypto = require("crypto");
const defaultPrisma = require("../config/db");

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomLetters(len) {
  let s = "";
  for (let i = 0; i < len; i++) s += LETTERS[crypto.randomInt(LETTERS.length)];
  return s;
}

async function generateProductCode(client = defaultPrisma) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const key = `${now.getFullYear()}${mm}${dd}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const seqRecord = await client.productCodeSeq.upsert({
      where: { date: key },
      update: { seq: { increment: 1 } },
      create: { date: key, seq: 1 },
    });
    const seq = String(seqRecord.seq).padStart(4, "0");
    const rand = randomLetters(2);
    const code = `EB-${yy}${mm}${dd}${seq}${rand}`;

    const existing = await client.bookVariant.findUnique({
      where: { productCode: code },
    });
    if (!existing) return code;
  }

  throw new Error("Không sinh được mã sách duy nhất, thử lại sau");
}

module.exports = { generateProductCode };
