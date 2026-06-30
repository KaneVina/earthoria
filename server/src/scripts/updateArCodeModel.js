/**
 * Script cho admin chạy thủ công để ĐỔI model 3D của một mã AR đã tồn tại,
 * trong khi `code` (và do đó QR đã in trong sách) giữ nguyên không đổi.
 *
 * Cách dùng:
 *   node src/scripts/updateArCodeModel.js <code> <modelUrlMoi>
 *
 * Ví dụ:
 *   node src/scripts/updateArCodeModel.js xK9f...AbC /models/elephant_v2.glb
 */
const prisma = require('../config/db')

async function main() {
  const [code, modelUrl] = process.argv.slice(2)

  if (!code || !modelUrl) {
    console.error('Thiếu tham số.')
    console.error('Dùng: node src/scripts/updateArCodeModel.js <code> <modelUrlMoi>')
    process.exit(1)
  }

  const existing = await prisma.arCode.findUnique({ where: { code } })
  if (!existing) {
    console.error(`Không tìm thấy mã AR "${code}"`)
    process.exit(1)
  }

  const updated = await prisma.arCode.update({
    where: { code },
    data: { modelUrl },
  })

  console.log('Cập nhật model thành công. QR cũ vẫn dùng được, không cần in lại.')
  console.log('  Mã (code):    ', updated.code)
  console.log('  Model cũ:     ', existing.modelUrl)
  console.log('  Model mới:    ', updated.modelUrl)

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})