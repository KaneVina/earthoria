const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 16;
const SIMILARITY_THRESHOLD = 0.7; // >= 70% giống nhau (theo Levenshtein) thì coi là "quá giống"

// Trả về chuỗi lỗi (tiếng Việt) nếu mật khẩu không hợp lệ, hoặc null nếu hợp lệ.
function validatePasswordPolicy(password) {
  if (!password || typeof password !== "string") {
    return "Vui lòng nhập mật khẩu.";
  }
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return `Mật khẩu phải từ ${PASSWORD_MIN_LENGTH} đến ${PASSWORD_MAX_LENGTH} ký tự.`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Mật khẩu phải có ít nhất 1 chữ hoa (A-Z).";
  }
  if (!/[a-z]/.test(password)) {
    return "Mật khẩu phải có ít nhất 1 chữ thường (a-z).";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#...).";
  }
  return null;
}

// Khoảng cách chỉnh sửa (Levenshtein) giữa 2 chuỗi — số thao tác thêm/xoá/sửa
// ký tự tối thiểu để biến chuỗi a thành chuỗi b.
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Trả về true nếu mật khẩu mới quá giống mật khẩu cũ (giống hệt, là chuỗi con
// của nhau, hoặc độ giống theo Levenshtein >= ngưỡng SIMILARITY_THRESHOLD).
function isPasswordTooSimilar(oldPassword, newPassword) {
  if (!oldPassword || !newPassword) return false;

  const a = oldPassword.toLowerCase();
  const b = newPassword.toLowerCase();

  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  const similarity = 1 - distance / maxLen;

  return similarity >= SIMILARITY_THRESHOLD;
}

module.exports = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  SIMILARITY_THRESHOLD,
  validatePasswordPolicy,
  isPasswordTooSimilar,
};
