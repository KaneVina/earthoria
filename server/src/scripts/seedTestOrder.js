const prisma = require('../config/db')

async function main() {
  const [email, arCode] = process.argv.slice(2)

  if (!email || !arCode) {
    console.error('Thiếu tham số.')
    console.error('Dùng: node src/scripts/seedTestOrder.js <email_user> <arCode>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`Không tìm thấy user với email "${email}"`)
    process.exit(1)
  }

  const ar = await prisma.arCode.findUnique({
    where: { code: arCode },
    include: { book: true },
  })
  if (!ar) {
    console.error(`Không tìm thấy ArCode với code "${arCode}"`)
    process.exit(1)
  }

  const book = ar.book
  console.log(`User:  ${user.email} (${user.id})`)
  console.log(`Sách:  ${book.title} (${book.id})`)

  // Lấy địa chỉ có sẵn của user, hoặc tạo 1 địa chỉ giả nếu chưa có
  let address = await prisma.address.findFirst({ where: { userId: user.id } })
  if (!address) {
    address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: user.name || 'Test User',
        phone: user.phone || '0900000000',
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        street: '1 Đường Test',
        isDefault: true,
      },
    })
    console.log(`Đã tạo địa chỉ test mới: ${address.id}`)
  } else {
    console.log(`Dùng địa chỉ có sẵn: ${address.id}`)
  }

  const price = book.salePrice ?? book.price

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      addressId: address.id,
      status: 'DELIVERED',
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      subtotal: price,
      shippingFee: 0,
      discount: 0,
      total: price,
      note: '[SEED TEST] Tạo tự động để test luồng xem AR',
      items: {
        create: [{ bookId: book.id, quantity: 1, price }],
      },
    },
    include: { items: true },
  })

  console.log('')
  console.log('Tạo đơn hàng test thành công.')
  console.log('  Order ID: ', order.id)
  console.log('  Status:   ', order.status)
  console.log('  Item:     ', book.title, '-', price)
  console.log('')
  console.log(`Giờ đăng nhập bằng "${email}" và mở lại URL AR là sẽ xem được model.`)
  console.log(`(Muốn xoá đơn test này sau khi xong: xoá Order id "${order.id}" trong DB — OrderItem sẽ tự xoá theo do onDelete: Cascade)`)

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})