// Làm đậm/nhạt một màu hex theo tỉ lệ percent (-1..1).
// percent âm -> tối hơn (về phía đen), percent dương -> sáng hơn (về phía trắng).
export function shadeColor(hex, percent) {
  if (!hex) return hex;
  const clean = hex.replace("#", "");
  const num = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16
  );

  const target = percent < 0 ? 0 : 255;
  const p = Math.abs(percent);

  const r = num >> 16;
  const g = (num >> 8) & 0x00ff;
  const b = num & 0x0000ff;

  const newR = Math.round((target - r) * p) + r;
  const newG = Math.round((target - g) * p) + g;
  const newB = Math.round((target - b) * p) + b;

  return (
    "#" +
    (0x1000000 + newR * 0x10000 + newG * 0x100 + newB).toString(16).slice(1)
  );
}

// Sinh nền gradient đậm từ 1 màu gốc theo role, đủ tối để chữ trắng bên trong luôn rõ.
export function getRoleAvatarGradient(color) {
  const dark = shadeColor(color, -0.45);
  const mid = shadeColor(color, -0.2);
  return `linear-gradient(135deg, ${dark} 0%, ${mid} 100%)`;
}