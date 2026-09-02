const SIMILARITY_THRESHOLD = 0.7; // >= 70% giống nhau (theo Levenshtein) thì coi là "quá giống"

// Khoảng cách chỉnh sửa (Levenshtein) giữa 2 chuỗi.
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

// Trả về true nếu mật khẩu mới quá giống mật khẩu cũ.
export function isPasswordTooSimilar(oldPassword, newPassword) {
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
