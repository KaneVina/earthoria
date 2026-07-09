const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { generateAccessToken, formatResponse } = require("../utils/helpers");
const tokenService = require("../services/tokenService");
const passport = require("passport");

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/";

function setRefreshCookie(res, rawToken, expiresAt) {
  res.cookie(REFRESH_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: expiresAt,
    path: REFRESH_COOKIE_PATH,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: REFRESH_COOKIE_PATH,
  });
}

function getRequestMeta(req) {
  return { userAgent: req.headers["user-agent"], ip: req.ip };
}

const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return formatResponse(res, 400, "Vui lòng điền đầy đủ thông tin");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return formatResponse(res, 400, "Email đã được sử dụng");
    }

    if (password.length < 6) {
      return formatResponse(res, 400, "Mật khẩu phải ít nhất 6 ký tự");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, phone },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const accessToken = generateAccessToken(user.id);
    const { rawToken, expiresAt } = await tokenService.createRefreshToken(
      user.id,
      false,
      getRequestMeta(req),
    );
    setRefreshCookie(res, rawToken, expiresAt);
    return formatResponse(res, 201, "Đăng ký thành công", {
      user,
      accessToken,
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

const login = async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    if (!email || !password) {
      return formatResponse(res, 400, "Vui lòng nhập email và mật khẩu");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return formatResponse(res, 401, "Email hoặc mật khẩu không đúng");
    }

    if (!user.isActive) {
      return formatResponse(res, 401, "Tài khoản đã bị khóa");
    }

    if (!user.password) {
      return formatResponse(
        res,
        401,
        "Tài khoản này đăng nhập bằng Google, vui lòng dùng Google",
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return formatResponse(res, 401, "Email hoặc mật khẩu không đúng");
    }

    const accessToken = generateAccessToken(user.id);
    const { rawToken, expiresAt } = await tokenService.createRefreshToken(
      user.id,
      !!remember,
      getRequestMeta(req),
    );
    setRefreshCookie(res, rawToken, expiresAt);

    return formatResponse(res, 200, "Đăng nhập thành công", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        userCode: user.userCode,
      },
      accessToken,
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        dob: true,
        gender: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        userCode: true,
        createdAt: true, // + userCode, gender
      },
    });
    return formatResponse(res, 200, "OK", user);
  } catch (error) {
    return formatResponse(res, 500, "Lỗi server");
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, firstName, lastName, dob, gender } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (dob !== undefined) data.dob = dob ? new Date(dob) : null;
    if (gender !== undefined) data.gender = gender || null;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        dob: true,
        gender: true,
        email: true,
        phone: true,
        avatar: true,
        userCode: true,
      },
    });
    return formatResponse(res, 200, "Cập nhật thành công", user);
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.password) {
      return formatResponse(
        res,
        400,
        "Tài khoản đăng nhập bằng Google không thể đổi mật khẩu",
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return formatResponse(res, 400, "Mật khẩu hiện tại không đúng");
    }

    if (newPassword.length < 6) {
      return formatResponse(res, 400, "Mật khẩu mới phải ít nhất 6 ký tự");
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    return formatResponse(res, 200, "Đổi mật khẩu thành công");
  } catch (error) {
    return formatResponse(res, 500, "Lỗi server");
  }
};

const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
});

const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    // Đăng nhập Google mặc định coi như "remember" = true (không có checkbox
    // để user chọn), giữ phiên dài như hành vi quen thuộc của OAuth login.
    const { rawToken, expiresAt } = await tokenService.createRefreshToken(
      user.id,
      true,
      getRequestMeta(req),
    );
    setRefreshCookie(res, rawToken, expiresAt);
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success`);
  } catch (error) {
    console.error(error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
  }
};

const refresh = async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      return formatResponse(res, 401, "Không có refresh token");
    }

    let record;
    try {
      record = await tokenService.verifyAndConsume(rawToken);
    } catch (err) {
      clearRefreshCookie(res);
      return formatResponse(
        res,
        401,
        "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
      );
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || !user.isActive) {
      clearRefreshCookie(res);
      return formatResponse(res, 401, "Tài khoản không hợp lệ");
    }

    const { rawToken: newRawToken, expiresAt } =
      await tokenService.rotateRefreshToken(record, getRequestMeta(req));
    setRefreshCookie(res, newRawToken, expiresAt);

    const accessToken = generateAccessToken(user.id);
    return formatResponse(res, 200, "OK", {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        userCode: user.userCode,
      },
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

const logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawToken) {
      await tokenService.revokeByRawToken(rawToken);
    }
    clearRefreshCookie(res);
    return formatResponse(res, 200, "Đăng xuất thành công");
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  googleAuth,
  googleCallback,
  refresh,
  logout,
};
