const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 16

// Trả về chuỗi lỗi (tiếng Việt) nếu mật khẩu không hợp lệ, hoặc null nếu hợp lệ.
function validatePasswordPolicy(password) {
  if (!password || typeof password !== 'string') {
    return 'Vui lòng nhập mật khẩu.'
  }
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return `Mật khẩu phải từ ${PASSWORD_MIN_LENGTH} đến ${PASSWORD_MAX_LENGTH} ký tự.`
  }
  if (!/[A-Z]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ hoa (A-Z).'
  }
  if (!/[a-z]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ thường (a-z).'
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#...).'
  }
  return null
}

module.exports = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  validatePasswordPolicy,
}