/**
 * Script tạo nhanh 1 đơn hàng ở trạng thái DELIVERED cho 1 user, gắn với
 * cuốn sách chứa 1 mã AR cụ thể — dùng để TEST luồng xem AR (arController
 * yêu cầu user phải có OrderItem thuộc Order status=DELIVERED cho đúng
 * bookId của ArCode thì mới được xem model).
 *
 * Đặt file này vào cùng thư mục `src/scripts/` với createArCode.js /
 * printArCodes.js (để dùng chung cách import prisma), rồi chạy:
 *
 *   node src/scripts/seedTestOrder.js <email_user> <arCode>
 *
 * Ví dụ:
 *   node src/scripts/seedTestOrder.js khach_test@example.com aBcD1234...
 *
 * Script sẽ:
 *   1. Tìm user theo email (báo lỗi nếu chưa có tài khoản này).
 *   2. Tìm ArCode theo code -> suy ra bookId cần "sở hữu".
 *   3. Nếu user chưa có Address nào -> tự tạo 1 địa chỉ giả để Order có
 *      thể tạo được (Order.addressId là bắt buộc theo schema).
 *   4. Tạo 1 Order mới: status=DELIVERED, paymentStatus=PAID,
 *      paymentMethod=COD, kèm 1 OrderItem đúng bookId đó, quantity=1,
 *      price lấy theo giá sách hiện tại (ưu tiên salePrice nếu có).
 *   5. In ra id đơn hàng vừa tạo để bạn tiện xoá/kiểm tra lại sau khi
 *      test xong (đây chỉ là data test, không nên để lẫn trong data thật).
 */
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