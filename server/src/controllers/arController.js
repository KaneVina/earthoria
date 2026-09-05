const prisma = require("../config/db");
const {
  isWithinAllowedWindow,
  isDailyLimitReached,
} = require("../utils/childPolicy");
const { notifyLimitExceeded } = require("../utils/childNotify");

exports.getArCode = async (req, res) => {
  try {
    const { code } = req.params;
    const { kidToken } = req.query;

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
      // Phiên của bé (link/QR riêng, không đăng nhập tài khoản chính) — xác
      // thực bằng kidToken thay vì req.user, vẫn tôn trọng khoá AR + ẩn sách
      // mà phụ huynh đã đặt cho bé.
      let child = null;
      if (!req.user && kidToken) {
        child = await prisma.childProfile.findFirst({
          where: { kidLinkToken: kidToken, isActive: true },
        });
      }

      if (child) {
        if (child.isLocked) {
          return res.status(403).json({
            success: false,
            code: "CHILD_LOCKED",
            message: "AR đã bị phụ huynh khoá. Nhờ ba mẹ mở khoá nhé!",
          });
        }

        // Khung giờ và giới hạn số phút/ngày — trước đây chỉ được hiển thị/tính
        // toán ở client (UI guidance), không hề được chặn ở server, nên bé vẫn
        // gọi thẳng API để xem AR ngoài giờ cho phép hoặc sau khi đã hết giờ.
        if (!isWithinAllowedWindow(child)) {
          return res.status(403).json({
            success: false,
            code: "OUTSIDE_ALLOWED_WINDOW",
            message: "Ngoài khung giờ ba mẹ cho phép sử dụng.",
          });
        }

        if (await isDailyLimitReached(prisma, child)) {
          notifyLimitExceeded(child); // fire-and-forget, tự throttle 1 lần/ngày
          return res.status(403).json({
            success: false,
            code: "DAILY_LIMIT_REACHED",
            message:
              "Bé đã dùng hết thời gian hôm nay rồi, hẹn bé ngày mai nhé!",
          });
        }

        const access = await prisma.childBookAccess.findFirst({
          where: { childId: child.id, bookId: arCode.bookId },
          select: { visible: true },
        });
        if (access && access.visible === false) {
          return res.status(403).json({
            success: false,
            message: "Sách này đã bị ẩn khỏi tủ sách của bé",
          });
        }

        const owns = await prisma.orderItem.findFirst({
          where: {
            variant: { bookId: arCode.bookId },
            order: {
              userId: child.parentId,
              status: { in: ["DELIVERED", "COMPLETED"] },
            },
          },
          select: { id: true },
        });

        if (!owns) {
          return res.status(403).json({
            success: false,
            message:
              "Gia đình bạn cần sở hữu cuốn sách này (đơn hàng đã giao) để xem mô hình AR",
          });
        }
      } else if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập để xem mô hình AR",
        });
      } else if (req.user.role !== "ADMIN" && req.user.role !== "STAFF") {
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
