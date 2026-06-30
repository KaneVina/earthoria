const prisma = require('../config/db')

/**
 * GET /api/v1/ar/:code
 *
 * Endpoint CÔNG KHAI — không cần đăng nhập, để người quét QR trong sách
 * giấy xem được model 3D ngay lập tức.
 *
 * Lưu ý bảo mật quan trọng:
 *  - Chỉ tra cứu bằng `code` (chuỗi ngẫu nhiên không đoán được), KHÔNG
 *    bao giờ dùng `slug` trên URL để tra cứu hay xác thực. `slug` trên
 *    URL chỉ để hiển thị đẹp; nếu client gửi slug sai/khác, ta vẫn trả
 *    đúng dữ liệu của `code` và để frontend tự điều hướng lại URL chuẩn.
 *  - Không trả lỗi 404 mơ hồ khác nhau giữa "mã không tồn tại" và
 *    "mã bị vô hiệu hoá" theo cách dễ bị dò quét hàng loạt — cùng một
 *    dạng response để tránh lộ thông tin.
 */
async function getArCode(req, res) {
  const { code } = req.params

  if (!code || code.length < 16) {
    return res.status(404).json({ success: false, message: 'Mã AR không hợp lệ' })
  }

  const arCode = await prisma.arCode.findUnique({
    where: { code },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
        },
      },
    },
  })

  if (!arCode || !arCode.isActive) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy mã AR này' })
  }

  // Tăng đếm lượt quét không đồng bộ, không chặn response (best-effort).
  prisma.arCode
    .update({ where: { code }, data: { scanCount: { increment: 1 } } })
    .catch((err) => console.error('Lỗi khi tăng scanCount:', err))

  return res.json({
    success: true,
    data: {
      code: arCode.code,
      label: arCode.label,
      modelUrl: arCode.modelUrl,
      posterUrl: arCode.posterUrl,
      book: {
        title: arCode.book.title,
        slug: arCode.book.slug,
        coverImage: arCode.book.coverImage,
      },
    },
  })
}

module.exports = { getArCode }