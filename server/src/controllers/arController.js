const prisma = require('../config/db')

/**
 * GET /api/v1/ar/:code — BẮT BUỘC đăng nhập (middleware `protect` áp ở
 * route). Chưa login → 401 do chính `protect` trả về, không cần xử lý
 * thêm ở đây.
 *
 * Sau khi xác thực token, còn phải kiểm tra thêm: user này CÓ sở hữu
 * cuốn sách chứa mã AR này không (đơn hàng DELIVERED). Đây là lớp
 * kiểm soát chính chống chia sẻ link — không dựa vào việc "biết code"
 * nữa mà dựa vào "có mua sách + đăng nhập đúng tài khoản đó".
 */
exports.getArCode = async (req, res) => {
  try {
    const { code } = req.params

    const arCode = await prisma.arCode.findUnique({
      where: { code },
      include: {
        book: { select: { id: true, title: true, slug: true } },
      },
    })

    if (!arCode || !arCode.isActive) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã này' })
    }

    const owns = await prisma.orderItem.findFirst({
      where: {
        bookId: arCode.bookId,
        order: { userId: req.user.id, status: 'DELIVERED' },
      },
      select: { id: true },
    })

    if (!owns) {
      return res.status(403).json({
        success: false,
        message: 'Bạn cần sở hữu cuốn sách này (đơn hàng đã giao) để xem mô hình AR',
      })
    }

    // Đếm lượt quét — dùng để phát hiện bất thường (mục 4 trong yêu cầu)
    await prisma.arCode.update({
      where: { id: arCode.id },
      data: { scanCount: { increment: 1 } },
    })

    return res.json({
      success: true,
      data: {
        label: arCode.label,
        modelUrl: arCode.modelUrl,
        posterUrl: arCode.posterUrl,
        book: arCode.book,
      },
    })
  } catch (err) {
    console.error('[getArCode]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

/**
 * GET /api/v1/ar/my-books — danh sách toàn bộ ArCode thuộc các sách mà
 * user đã mua và đã được giao, để hiển thị trong "Sách AR của tôi".
 */
exports.getMyArCodes = async (req, res) => {
  try {
    const arCodes = await prisma.arCode.findMany({
      where: {
        isActive: true,
        book: {
          orderItems: {
            some: { order: { userId: req.user.id, status: 'DELIVERED' } },
          },
        },
      },
      include: {
        book: { select: { id: true, title: true, slug: true, coverImage: true } },
      },
      orderBy: [{ bookId: 'asc' }, { createdAt: 'asc' }],
    })

    return res.json({ success: true, data: arCodes })
  } catch (err) {
    console.error('[getMyArCodes]', err)
    return res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}