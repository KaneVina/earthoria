const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const passport = require('./config/passport')
const app = express()

app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://earthoria.vercel.app',
    'https://earthoria.id.vn',
    'https://www.earthoria.id.vn',
  ],
  credentials: true
}))

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Quá nhiều request, thử lại sau' }
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(passport.initialize())
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// ─── API v1 ───
const v1 = express.Router()

v1.use('/auth',       require('./routes/authRoutes'))
v1.use('/books',      require('./routes/bookRoutes'))
v1.use('/categories', require('./routes/categoryRoutes'))
v1.use('/cart',       require('./routes/cartRoutes'))
v1.use('/orders',     require('./routes/orderRoutes'))
v1.use('/admin',      require('./routes/adminRoutes'))
v1.use('/addresses', require('./routes/addressRoutes'))
// Public route — không cần đăng nhập, dùng cho quét QR trong sách giấy
v1.use('/ar',          require('./routes/arRoutes'))

app.use('/api/v1', v1)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    version: 'v1',
    message: 'Earthoria API running'
  })
})


// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })

  // 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

})

module.exports = app