const crypto = require('crypto')
const prisma = require('../config/db')

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