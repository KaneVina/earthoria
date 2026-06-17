const passport = require('passport')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const prisma = require('./db')

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID:     process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL:  process.env.GOOGLE_CALLBACK_URL,
//     },
    passport.use(
  new GoogleStrategy(
    {
      clientID: '1067162305399-t1nq4p2mg3qsuhdh47rpnanpjeuml6rn.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: 'http://localhost:5000/api/v1/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email  = profile.emails?.[0]?.value
        const avatar = profile.photos?.[0]?.value

        if (!email) {
          return done(new Error('Không lấy được email từ Google'), null)
        }

        // Tìm user theo googleId trước
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id }
        })

        if (user) {
          return done(null, user)
        }

        // Kiểm tra email đã tồn tại chưa (đăng ký thường trước đó)
        const existingByEmail = await prisma.user.findUnique({
          where: { email }
        })

        if (existingByEmail) {
          // Liên kết googleId vào tài khoản cũ
          user = await prisma.user.update({
            where: { email },
            data:  { googleId: profile.id, avatar: existingByEmail.avatar || avatar }
          })
          return done(null, user)
        }

        // Tạo user mới
        user = await prisma.user.create({
          data: {
            email,
            googleId: profile.id,
            name:     profile.displayName || email.split('@')[0],
            avatar,
            password: null, // không có password khi đăng ký Google
          }
        })

        return done(null, user)
      } catch (error) {
        return done(error, null)
      }
    }
  )
)

module.exports = passport