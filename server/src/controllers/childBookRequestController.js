const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const { calculateAge } = require("../utils/age");
const { notifyBookRequest } = require("../utils/childNotify");

// Số sách tối đa hiển thị ở mỗi dải trong khu "Khám phá thêm" của trang bé
const DISCOVER_TAKE = 8;

const BOOK_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  coverImage: true,
  ageMin: true,
  ageMax: true,
  isFeatured: true,
  variants: { select: { sold: true } },
};

// Gộp tổng số lượng đã bán trên mọi phiên bản (giấy + điện tử) của 1 cuốn
// sách thành 1 con số duy nhất, dùng để xếp hạng "được mua nhiều nhất".
function withSold(book) {
  const { variants, ...rest } = book;
  const totalSold = (variants || []).reduce((sum, v) => sum + (v.sold || 0), 0);
  return { ...rest, totalSold };
}

// Sách gia đình (phụ huynh) đã sở hữu - cả sách giấy lẫn điện tử, mọi đơn đã
// thanh toán - dùng để loại khỏi khu "Khám phá thêm" vì gợi ý lại sách đã có
// thì không có ý nghĩa với bé. Cùng bộ điều kiện trạng thái đơn hàng như
// getChildBooks() ở childController.js (digital: DELIVERED/COMPLETED,
// physical: CONFIRMED/SHIPPING/DELIVERED/COMPLETED).
async function getOwnedBookIds(parentId) {
  const items = await prisma.orderItem.findMany({
    where: {
      OR: [
        {
          variant: { format: "DIGITAL" },
          order: {
            userId: parentId,
            paymentStatus: "PAID",
            status: { in: ["DELIVERED", "COMPLETED"] },
          },
        },
        {
          variant: { format: "PHYSICAL" },
          order: {
            userId: parentId,
            paymentStatus: "PAID",
            status: { in: ["CONFIRMED", "SHIPPING", "DELIVERED", "COMPLETED"] },
          },
        },
      ],
    },
    select: { variant: { select: { bookId: true } } },
  });
  return new Set(items.map((i) => i.variant.bookId));
}

async function findChildByToken(token) {
  return prisma.childProfile.findFirst({
    where: { kidLinkToken: token, isActive: true },
    select: {
      id: true,
      parentId: true,
      name: true,
      dob: true,
      isLocked: true,
    },
  });
}

/* ═══════════════════  PHÍA BÉ (public, qua kidLinkToken)  ═══════════════════ */

// [PUBLIC] GET /api/v1/kid-access/:token/discover
// Trả về 2 dải gợi ý cho khu "Khám phá thêm" ở trang bé: sách bán chạy nhất
// và sách phù hợp với độ tuổi của bé (dựa trên dob đã đăng ký), đều loại bỏ
// những sách gia đình đã mua rồi.
const getKidDiscoverBooks = async (req, res) => {
  try {
    const { token } = req.params;
    const child = await findChildByToken(token);
    if (!child)
      return formatResponse(res, 404, "Link không hợp lệ hoặc đã bị thu hồi");

    const age = calculateAge(child.dob);
    const ownedIds = await getOwnedBookIds(child.parentId);

    const candidates = await prisma.book.findMany({
      where: { isActive: true, id: { notIn: [...ownedIds] } },
      select: BOOK_CARD_SELECT,
    });
    const withTotals = candidates.map(withSold);

    const bestsellers = [...withTotals]
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, DISCOVER_TAKE);
    const bestsellerIds = new Set(bestsellers.map((b) => b.id));

    // "Phù hợp độ tuổi": sách có khoảng tuổi bao trùm tuổi hiện tại của bé,
    // ưu tiên sách nổi bật rồi tới sách bán chạy, không lặp lại sách đã ở
    // dải bestseller phía trên.
    const ageAppropriate = withTotals
      .filter((b) => !bestsellerIds.has(b.id))
      .filter((b) => {
        if (b.ageMin == null && b.ageMax == null) return false;
        if (b.ageMin != null && age < b.ageMin) return false;
        if (b.ageMax != null && age > b.ageMax) return false;
        return true;
      })
      .sort((a, b) => b.isFeatured - a.isFeatured || b.totalSold - a.totalSold)
      .slice(0, DISCOVER_TAKE);

    return formatResponse(res, 200, "OK", {
      age,
      bestsellers: bestsellers.map(({ totalSold, isFeatured, ...b }) => b),
      ageAppropriate: ageAppropriate.map(
        ({ totalSold, isFeatured, ...b }) => b,
      ),
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// [PUBLIC] GET /api/v1/kid-access/:token/book-requests
// Trạng thái các lời nhắn "nhờ ba mẹ mua" mà bé đã gửi - để FE biết sách nào
// đã gửi rồi (khoá nút, tránh gửi trùng) và sách nào bị từ chối (cho gửi lại).
const getKidBookRequests = async (req, res) => {
  try {
    const { token } = req.params;
    const child = await findChildByToken(token);
    if (!child)
      return formatResponse(res, 404, "Link không hợp lệ hoặc đã bị thu hồi");

    const requests = await prisma.childBookRequest.findMany({
      where: { childId: child.id },
      select: { bookId: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return formatResponse(res, 200, "OK", { requests });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// [PUBLIC] POST /api/v1/kid-access/:token/book-requests - bé bấm "Nhờ ba mẹ mua"
const createKidBookRequest = async (req, res) => {
  try {
    const { token } = req.params;
    const { bookId } = req.body;
    if (!bookId) return formatResponse(res, 400, "Thiếu thông tin sách");

    const child = await findChildByToken(token);
    if (!child)
      return formatResponse(res, 404, "Link không hợp lệ hoặc đã bị thu hồi");

    const book = await prisma.book.findFirst({
      where: { id: bookId, isActive: true },
      select: { id: true, title: true, coverImage: true },
    });
    if (!book) return formatResponse(res, 404, "Không tìm thấy sách");

    const existingPending = await prisma.childBookRequest.findFirst({
      where: { childId: child.id, bookId, status: "PENDING" },
      select: { id: true },
    });
    if (existingPending) {
      return formatResponse(
        res,
        400,
        "Bé đã gửi lời nhắn này cho ba mẹ rồi, đợi ba mẹ xem nhé!",
        { code: "ALREADY_REQUESTED" },
      );
    }

    const request = await prisma.childBookRequest.create({
      data: { childId: child.id, bookId },
    });

    await prisma.childAuditLog
      .create({
        data: {
          parentId: child.parentId,
          childId: child.id,
          type: "BOOK_REQUEST_CREATED",
          message: `${child.name} muốn ba mẹ mua "${book.title}"`,
          metadata: { bookId, requestId: request.id },
        },
      })
      .catch((err) =>
        console.error("[childAuditLog] Failed to write:", err.message),
      );

    // fire-and-forget: không chặn phản hồi cho bé nếu gửi email chậm/lỗi
    notifyBookRequest(child, book);

    return formatResponse(res, 201, "Đã gửi lời nhắn cho ba mẹ rồi!", {
      request: {
        bookId,
        status: request.status,
        createdAt: request.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

/* ═══════════════════  PHÍA PHỤ HUYNH (protected)  ═══════════════════ */

const REQUEST_LIST_SELECT = {
  id: true,
  status: true,
  parentNote: true,
  createdAt: true,
  respondedAt: true,
  bookId: true,
  child: {
    select: { id: true, name: true, avatarEmoji: true, avatarColor: true },
  },
  book: {
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      ageMin: true,
      ageMax: true,
    },
  },
};

const REQUEST_STATUS_VALUES = ["PENDING", "APPROVED", "DECLINED"];

// GET /api/v1/children/book-requests?status=&childId=
// Danh sách yêu cầu mua sách của TẤT CẢ các bé thuộc phụ huynh đang đăng
// nhập - dùng cho cả băng tóm tắt ở "Tổng quan" lẫn tab "Muốn mua" đầy đủ.
const listBookRequests = async (req, res) => {
  try {
    const { status, childId } = req.query;
    const where = {
      child: { parentId: req.user.id, isActive: true },
      ...(status && REQUEST_STATUS_VALUES.includes(status) ? { status } : {}),
      ...(childId ? { childId } : {}),
    };

    const requests = await prisma.childBookRequest.findMany({
      where,
      select: REQUEST_LIST_SELECT,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return formatResponse(res, 200, "OK", { requests });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// PATCH /api/v1/children/book-requests/:requestId - duyệt hoặc từ chối 1 yêu cầu.
// Duyệt mặc định sẽ thêm luôn sách vào giỏ hàng của phụ huynh (ưu tiên bản
// giấy, không có thì lấy bản điện tử) để phụ huynh chỉ cần ra thanh toán.
const respondBookRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, note, addToCart = true } = req.body;
    if (!["approve", "decline"].includes(action)) {
      return formatResponse(res, 400, "Hành động không hợp lệ");
    }

    const request = await prisma.childBookRequest.findUnique({
      where: { id: requestId },
      include: {
        child: { select: { id: true, name: true, parentId: true } },
        book: { select: { id: true, title: true } },
      },
    });
    if (!request || request.child.parentId !== req.user.id) {
      return formatResponse(res, 404, "Không tìm thấy yêu cầu");
    }
    if (request.status !== "PENDING") {
      return formatResponse(res, 400, "Yêu cầu này đã được xử lý rồi");
    }

    let cartAdded = false;
    if (action === "approve") {
      await prisma.$transaction(async (tx) => {
        await tx.childBookRequest.update({
          where: { id: request.id },
          data: { status: "APPROVED", respondedAt: new Date() },
        });

        if (addToCart) {
          // Thứ tự enum BookFormat khai báo PHYSICAL trước DIGITAL nên
          // orderBy asc sẽ ưu tiên bản giấy trước, khớp với pickDisplayVariant
          // dùng ở trang Shop/BookDetail.
          const variant = await tx.bookVariant.findFirst({
            where: { bookId: request.bookId, isActive: true },
            orderBy: { format: "asc" },
          });
          const inStock =
            variant && (variant.isUnlimitedStock || variant.stock > 0);
          if (variant && inStock) {
            let cart = await tx.cart.findUnique({
              where: { userId: req.user.id },
            });
            if (!cart) {
              cart = await tx.cart.create({ data: { userId: req.user.id } });
            }
            const existingItem = await tx.cartItem.findFirst({
              where: { cartId: cart.id, variantId: variant.id },
            });
            if (existingItem) {
              await tx.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: { increment: 1 } },
              });
            } else {
              await tx.cartItem.create({
                data: { cartId: cart.id, variantId: variant.id, quantity: 1 },
              });
            }
            cartAdded = true;
          }
        }
      });
    } else {
      await prisma.childBookRequest.update({
        where: { id: request.id },
        data: {
          status: "DECLINED",
          respondedAt: new Date(),
          parentNote: note?.trim() || null,
        },
      });
    }

    await prisma.childAuditLog
      .create({
        data: {
          parentId: req.user.id,
          childId: request.child.id,
          type: "BOOK_REQUEST_RESPONDED",
          message:
            action === "approve"
              ? `Đã duyệt yêu cầu mua "${request.book.title}" của ${request.child.name}`
              : `Đã từ chối yêu cầu mua "${request.book.title}" của ${request.child.name}`,
          metadata: { bookId: request.bookId, requestId: request.id, action },
        },
      })
      .catch((err) =>
        console.error("[childAuditLog] Failed to write:", err.message),
      );

    return formatResponse(
      res,
      200,
      action === "approve" ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu",
      { cartAdded },
    );
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

module.exports = {
  getKidDiscoverBooks,
  getKidBookRequests,
  createKidBookRequest,
  listBookRequests,
  respondBookRequest,
};
