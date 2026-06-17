const express  = require('express')
const router   = express.Router()
const passport = require('../config/passport') // ← import passport config
const {
  register, login, getMe, updateProfile, changePassword,
  googleAuth, googleCallback
} = require('../controllers/authController')
const { protect } = require('../middlewares/authMiddleware')

router.post('/register',        register)
router.post('/login',           login)
router.get('/me',               protect, getMe)
router.put('/update-profile',   protect, updateProfile)
router.put('/change-password',  protect, changePassword)

// ─── Google OAuth ───
router.get('/google',
  googleAuth
)
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed` }),
  googleCallback
)

module.exports = router