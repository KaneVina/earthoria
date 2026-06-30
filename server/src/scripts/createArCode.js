/**
 * Script cho admin chạy thủ công để tạo 1 mã AR mới cho 1 sách.
 *
 * Cách dùng:
 *   node src/scripts/createArCode.js <bookSlug> "<label>" <modelUrl>
 *
 * Ví dụ:
 *   node src/scripts/createArCode.js dai-duong-bao-la "Con voi" /models/elephant.glb
 *
 * Script sẽ in ra:
 *   - code vừa sinh (chuỗi ngẫu nhiên, KHÔNG đoán được)
 *   - URL đầy đủ để nhúng vào QR in trong sách
 *
 * QUAN TRỌNG: URL in ra chính là URL CỐ ĐỊNH MÃI MÃI cho QR đó.
 * Sau khi in sách, không bao giờ được đổi `code`. Muốn đổi model 3D,
 * chỉ cần update field `modelUrl` của bản ghi này (xem updateArCodeModel.js),
 * QR không cần in lại.
 */
const crypto = require('crypto')
const prisma = require('../config/db')

// Sinh chuỗi ngẫu nhiên CSPRNG, base64url để an toàn khi nhúng vào URL.
// 24 bytes ngẫu nhiên ~ 32 ký tự base64url, đủ entropy để không thể đoán/brute-force.
function generateSecureCode() {
  return crypto.randomBytes(24).toString('base64url')
}

async function main() {
  const [bookSlug, label, modelUrl] = process.argv.slice(2)

  if (!bookSlug || !label || !modelUrl) {
    console.error('Thiếu tham số.')
    console.error('Dùng: node src/scripts/createArCode.js <bookSlug> "<label>" <modelUrl>')
    process.exit(1)
  }

  const book = await prisma.book.findUnique({ where: { slug: bookSlug } })
  if (!book) {
    console.error(`Không tìm thấy sách với slug "${bookSlug}"`)
    process.exit(1)
  }

  // Phòng trường hợp cực hiếm trùng mã (xác suất gần như bằng 0 với 24 bytes),
  // vẫn thử lại để đảm bảo an toàn tuyệt đối thay vì để lỗi unique constraint.
  let code
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateSecureCode()
    const existing = await prisma.arCode.findUnique({ where: { code } })
    if (!existing) break
    code = null
  }
  if (!code) {
    console.error('Không sinh được mã duy nhất, thử lại sau.')
    process.exit(1)
  }

  const arCode = await prisma.arCode.create({
    data: {
      code,
      label,
      modelUrl,
      bookId: book.id,
    },
  })

  const baseUrl = process.env.CLIENT_URL || 'https://earthoria.id.vn'
  const fullUrl = `${baseUrl}/ar/${book.slug}/${arCode.code}`

  console.log('Tạo mã AR thành công.')
  console.log('  Sách:      ', book.title)
  console.log('  Nhãn:      ', label)
  console.log('  Model:     ', modelUrl)
  console.log('  Mã (code): ', arCode.code)
  console.log('  URL cho QR:', fullUrl)
  console.log('')
  console.log('Nhúng URL trên vào mã QR để in trong sách. URL này là vĩnh viễn.')

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})