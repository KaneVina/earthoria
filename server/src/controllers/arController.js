const prisma = require("../config/db");

exports.getArCode = async (req, res) => {
  try {
    const { code } = req.params;

    const arCode = await prisma.arCode.findUnique({
      where: { code },
      include: {
        book: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!arCode || !arCode.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã này" });
    }

    if (arCode.accessType !== "PUBLIC") {
      if (!req.user) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Vui lòng đăng nhập để xem mô hình AR",
          });
      }

      if (req.user.role !== "ADMIN" && req.user.role !== "STAFF") {
        const owns = await prisma.orderItem.findFirst({
          where: {
            variant: { bookId: arCode.bookId },
            // DELIVERED = đang chờ khách xác nhận, COMPLETED = đã xác nhận nhận hàng — cả 2 đều coi là đã sở hữu.
            order: {
              userId: req.user.id,
              status: { in: ["DELIVERED", "COMPLETED"] },
            },
          },
          select: { id: true },
        });

        if (!owns) {
          return res.status(403).json({
            success: false,
            message:
              "Bạn cần sở hữu cuốn sách này (đơn hàng đã giao) để xem mô hình AR",
          });
        }
      }
    }

    await prisma.arCode.update({
      where: { id: arCode.id },
      data: { scanCount: { increment: 1 } },
    });

    return res.json({
      success: true,
      data: {
        label: arCode.label,
        modelUrl: arCode.modelUrl,
        posterUrl: arCode.posterUrl,
        accessType: arCode.accessType,
        book: arCode.book,
      },
    });
  } catch (err) {
    console.error("[getArCode]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

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
          variants: {
            some: {
              orderItems: {
                some: {
                  order: {
                    userId: req.user.id,
                    status: { in: ["DELIVERED", "COMPLETED"] },
                  },
                },
              },
            },
          },
        },
      },
      include: {
        book: {
          select: { id: true, title: true, slug: true, coverImage: true },
        },
      },
      orderBy: [{ bookId: "asc" }, { createdAt: "asc" }],
    });

    return res.json({ success: true, data: arCodes });
  } catch (err) {
    console.error("[getMyArCodes]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
