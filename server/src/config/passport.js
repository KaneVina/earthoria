const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const prisma = require("./db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Yêu cầu đến từ nút Google trên Cổng Quản trị (?portal=admin ở bước
        // /auth/google, Google trả lại nguyên vẹn qua "state" ở callback).
        const isAdminPortal = req.query.state === "admin";
        const email = profile.emails?.[0]?.value;
        const emailVerified = profile.emails?.[0]?.verified;
        const avatar = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error("Không lấy được email từ Google"), null);
        }
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (user) {
          return done(null, user);
        }

        if (emailVerified === false) {
          return done(new Error("Email Google chưa được xác thực."), null);
        }

        // Kiểm tra email đã tồn tại chưa (đăng ký thường trước đó)
        const existingByEmail = await prisma.user.findUnique({
          where: { email },
        });

        if (existingByEmail) {
          // Liên kết googleId vào tài khoản cũ
          user = await prisma.user.update({
            where: { email },
            data: {
              googleId: profile.id,
              avatar: existingByEmail.avatar || avatar,
            },
          });
          return done(null, user);
        }

        // Cổng Quản trị không tự tạo tài khoản mới từ một lượt đăng nhập Google
        // lạ - chỉ những Google account đã liên kết sẵn với một User ADMIN/STAFF
        // (2 nhánh done() phía trên) mới được đi tiếp. done(null, false) khiến
        // passport rơi vào failureRedirect (?error=google_failed) thay vì tạo
        // account khách hàng mới rồi mới chặn ở bước sau.
        if (isAdminPortal) {
          return done(null, false);
        }

        // Tạo user mới
        user = await prisma.user.create({
          data: {
            email,
            googleId: profile.id,
            name: profile.displayName || email.split("@")[0],
            avatar,
            password: null, // không có password khi đăng ký Google
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

module.exports = passport;
