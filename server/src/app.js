const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const passport = require('./config/passport')
const app = express()
app.set('trust proxy', 1)
app.use(helmet())

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://earthoria.vercel.app',
    'https://earthoria.id.vn',
    'https://www.earthoria.id.vn',
  ],
  credentials: true,
}))

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Quá nhiều request, thử lại sau',
  },
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(passport.initialize())

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}