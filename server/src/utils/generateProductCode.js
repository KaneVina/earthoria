const crypto = require('crypto')
const defaultPrisma = require('../config/db')

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function randomLetters(len) {
  let s = ''
  for (let i = 0; i < len; i++) s += LETTERS[crypto.randomInt(LETTERS.length)]
  return s
}

/**
 * Sinh mã sách dạng EB-{YY}{MM}{DD}{SEQ4}{rand2}, vd EB-2607070012AB.
 * SEQ tăng dần ATOMIC theo ngày (bảng ProductCodeSeq, giống UserCodeSeq)
 * để tránh đụng độ khi nhiều admin cùng tạo sách 1 lúc; 2 ký tự random
 * cuối chỉ tăng thêm entropy, không phải cơ chế chống trùng chính.
 *
 * Vẫn kiểm tra unique thật trong DB trước khi trả về, phòng trường hợp
 * mã trùng với 1 mã đã tồn tại (vd admin từng tạo tay 1 mã cùng định dạng).
 *
 * @param {import('@prisma/client').PrismaClient} client - truyền `tx` khi gọi bên trong 1 transaction
 */
async function generateProductCode(client = defaultPrisma) {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const key = `${now.getFullYear()}${mm}${dd}`

  for (let attempt = 0; attempt < 5; attempt++) {
    const seqRecord = await client.productCodeSeq.upsert({
      where: { date: key },
      update: { seq: { increment: 1 } },
      create: { date: key, seq: 1 },
    })
    const seq = String(seqRecord.seq).padStart(4, '0')
    const rand = randomLetters(2)
    const code = `EB-${yy}${mm}${dd}${seq}${rand}`

    const existing = await client.book.findUnique({ where: { productCode: code } })
    if (!existing) return code
  }

  throw new Error('Không sinh được mã sách duy nhất, thử lại sau')
}

module.exports = { generateProductCode }