require('dotenv').config({ override: true })
const app = require('./app')
const prisma = require('./config/db')

const PORT = process.env.PORT || 5000

async function main() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected')

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

main()