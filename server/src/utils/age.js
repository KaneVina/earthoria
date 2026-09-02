// Tính tuổi chính xác từ ngày sinh (tính theo đã qua sinh nhật năm nay hay chưa), không lưu tuổi tĩnh trong DB để tránh sai lệch theo thời gian.
function calculateAge(dob) {
  const birth = new Date(dob);
  const now = new Date();

  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  const dayDiff = now.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return Math.max(0, age);
}

// Trẻ hợp lệ: sinh trong khoảng 0–17 tuổi (không cho tạo hồ sơ "trẻ em" cho người đã trên 18, và không cho ngày sinh trong tương lai).
function isValidChildDob(dob) {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return false;

  const now = new Date();
  if (birth > now) return false;

  const age = calculateAge(birth);
  return age >= 0 && age <= 17;
}

module.exports = { calculateAge, isValidChildDob };
