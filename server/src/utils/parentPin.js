const bcrypt = require("bcryptjs");
const prisma = require("../config/db");

const PIN_REGEX = /^[0-9]{4}$/;
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function isValidPinFormat(pin) {
  return typeof pin === "string" && PIN_REGEX.test(pin);
}

async function hashPin(pin) {
  return bcrypt.hash(pin, 12);
}

// Xác minh PIN kèm chống brute-force
async function verifyParentPin(user, pin) {
  if (!user.parentPinHash) {
    return {
      ok: false,
      code: "NO_PIN",
      message: "Bạn chưa thiết lập mã PIN phụ huynh.",
    };
  }

  if (user.parentPinLockedUntil && user.parentPinLockedUntil > new Date()) {
    return {
      ok: false,
      code: "LOCKED_OUT",
      message: `Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút hoặc dùng "Quên mã PIN?".`,
      lockedUntil: user.parentPinLockedUntil,
    };
  }

  if (!isValidPinFormat(pin)) {
    return {
      ok: false,
      code: "INVALID_FORMAT",
      message: "Mã PIN gồm đúng 4 chữ số.",
    };
  }

  const matches = await bcrypt.compare(pin, user.parentPinHash);

  if (!matches) {
    const nextAttempts = (user.parentPinAttempts || 0) + 1;
    const shouldLock = nextAttempts >= MAX_PIN_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        parentPinAttempts: shouldLock ? 0 : nextAttempts,
        parentPinLockedUntil: shouldLock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : null,
      },
    });

    if (shouldLock) {
      return {
        ok: false,
        code: "LOCKED_OUT",
        message: `Bạn đã nhập sai quá ${MAX_PIN_ATTEMPTS} lần. Vui lòng thử lại sau ${LOCKOUT_MINUTES} phút hoặc dùng "Quên mã PIN?".`,
      };
    }

    return {
      ok: false,
      code: "WRONG_PIN",
      message: `Mã PIN không đúng. Còn ${MAX_PIN_ATTEMPTS - nextAttempts} lần thử.`,
      remaining: MAX_PIN_ATTEMPTS - nextAttempts,
    };
  }

  // Đúng PIN → reset bộ đếm sai
  if (user.parentPinAttempts || user.parentPinLockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { parentPinAttempts: 0, parentPinLockedUntil: null },
    });
  }

  return { ok: true };
}

module.exports = {
  isValidPinFormat,
  hashPin,
  verifyParentPin,
  MAX_PIN_ATTEMPTS,
  LOCKOUT_MINUTES,
};
