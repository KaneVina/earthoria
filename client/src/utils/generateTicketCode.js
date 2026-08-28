const crypto = require('crypto')
const defaultPrisma = require('../config/db')

// Chữ + số, viết hoa lẫn thường để tăng không gian mã (62 ký tự) — ví dụ "k5L"
const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function randomAlnum(len) {
  let s = ''
  for (let i = 0; i < len; i++) s += ALNUM[crypto.randomInt(ALNUM.length)]
  return s
}

async function generateTicketCode(client = defaultPrisma) {
  const now = new Date()
  // Quy đổi theo giờ Việt Nam để ngày sinh mã luôn khớp với ngày thực tế người dùng gửi
  const vnParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type) => vnParts.find((p) => p.type === type).value
  const yy = get('year').slice(-2)
  const mm = get('month')
  const dd = get('day')

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = `ETK-${yy}${mm}${dd}${randomAlnum(3)}`
    const existing = await client.ticket.findUnique({ where: { code } })
    if (!existing) return code
  }

  throw new Error('Không sinh được mã ticket duy nhất, thử lại sau')
}

module.exports = { generateTicketCode }