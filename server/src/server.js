require('dotenv').config({ override: true })
const app = require('./app')
const prisma = require('./config/db')
const { verifyEmailTransport } = require('./services/emailService')
const { startPaymentExpiryJob } = require('./services/paymentExpiryService')

const PORT = process.env.PORT || 5000

async function main() {
  try {
    await prisma.$connect()
    console.log('==Database connected==')

    app.listen(PORT, () => {
      console.log(`YES - Server running on http://localhost:${PORT}`)
      verifyEmailTransport() // ← thêm vào đây
      startPaymentExpiryJob() // quét đơn VNPay/MoMo hết phiên thanh toán mỗi 60s → hoàn kho/coupon tự động
    })
  } catch (error) {
    console.error('NO - Database connection failed:', error)
    process.exit(1)
  }
}

main()