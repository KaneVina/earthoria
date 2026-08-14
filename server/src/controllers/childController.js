const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const { calculateAge, isValidChildDob } = require("../utils/age");
const { verifyParentPin } = require("../utils/parentPin");
const { generateKidLinkToken, buildKidLinkUrl } = require("../utils/kidLink");

const MAX_CHILDREN_PER_PARENT = 10;

const SETTINGS_SELECT = {
  dailyLimitMinutes: true,
  ruleEnabled: true,
  ruleIntervalMinutes: true,
  ruleRestSeconds: true,
  allowWindowEnabled: true,
  allowStart: true,
  allowEnd: true,
  mandatoryBreakEnabled: true,
  breakAfterMinutes: true,
  breakDurationMinutes: true,
  tipsEnabled: true,
  tipsFrequency: true,
  notifyPush: true,
  notifyEmail: true,
  notifyOnLimitExceeded: true,
  notifyOnSkippedRest: true,
};

const CHILD_SELECT = {
  id: true,
  name: true,
  dob: true,
  avatarEmoji: true,
  avatarColor: true,
  isActive: true,
  isLocked: true,
  lockedAt: true,
  createdAt: true,
  ...SETTINGS_SELECT,
};

function serializeChild(child) {
  return { ...child, age: calculateAge(child.dob) };
}

async function findOwnChild(parentId, childId) {
  return prisma.childProfile.findFirst({
    where: { id: childId, parentId, isActive: true },
    select: CHILD_SELECT,
  });
}

function pushAudit({ parentId, childId, type, message, metadata }) {
  // Không await ở nơi gọi để không làm chậm response — nhưng vẫn bắt lỗi
  // để một lần ghi log lỗi không làm sập cả request chính.
  return prisma.childAuditLog
    .create({ data: { parentId, childId, type, message, metadata } })
    .catch((err) => console.error("[childAuditLog] Failed to write:", err.message));
}

// ════════════════════════════════════════════
// GET /api/v1/children — danh sách hồ sơ con của phụ huynh đang đăng nhập
// ════════════════════════════════════════════
const listChildren = async (req, res) => {
  try {
    const children = await prisma.childProfile.findMany({
      where: { parentId: req.user.id, isActive: true },
      select: CHILD_SELECT,
      orderBy: { createdAt: "asc" },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const childIds = children.map((c) => c.id);
    const todayLogs = childIds.length
      ? await prisma.childActivityLog.groupBy({
          by: ["childId"],
          where: { childId: { in: childIds }, occurredOn: { gte: startOfToday } },
          _sum: { minutes: true },
        })
      : [];
    const todayByChild = Object.fromEntries(
      todayLogs.map((row) => [row.childId, row._sum.minutes || 0]),
    );

    return formatResponse(res, 200, "OK", {
      children: children.map((c) => ({
        ...serializeChild(c),
        todayMinutes: todayByChild[c.id] || 0,
      })),
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// ════════════════════════════════════════════
// POST /api/v1/children — bước cuối của wizard tạo hồ sơ trẻ
// Body: { name, dob, avatarEmoji?, avatarColor?, agreeTerms }
// Bước 1 (xác nhận email) và bước 2 (nhập tên/ngày sinh) được xử lý hoàn
// toàn ở client vì không cần gọi API cho tới khi phụ huynh đồng ý điều
// khoản ở bước cuối — tránh tạo rác hồ sơ dở dang trong DB.
// ════════════════════════════════════════════
const createChild = async (req, res) => {
  try {
    const { name, dob, avatarEmoji, avatarColor, agreeTerms } = req.body;

    if (!name || !name.trim()) {
      return formatResponse(res, 400, "Vui lòng nhập tên của bé");
    }
    if (name.trim().length > 50) {
      return formatResponse(res, 400, "Tên quá dài (tối đa 50 ký tự)");
    }
    if (!dob) {
      return formatResponse(res, 400, "Vui lòng nhập ngày sinh của bé");
    }
    if (!isValidChildDob(dob)) {
      return formatResponse(
        res,
        400,
        "Ngày sinh không hợp lệ. Hồ sơ trẻ em áp dụng cho bé từ 0–17 tuổi.",
      );
    }
    if (agreeTerms !== true) {
      return formatResponse(
        res,
        400,
        "Bạn cần đồng ý với điều khoản sử dụng để tạo tài khoản cho bé",
      );
    }

    const existingCount = await prisma.childProfile.count({
      where: { parentId: req.user.id, isActive: true },
    });
    if (existingCount >= MAX_CHILDREN_PER_PARENT) {
      return formatResponse(
        res,
        400,
        `Bạn đã đạt giới hạn tối đa ${MAX_CHILDREN_PER_PARENT} hồ sơ trẻ em`,
      );
    }

    const child = await prisma.childProfile.create({
      data: {
        parentId: req.user.id,
        name: name.trim(),
        dob: new Date(dob),
        avatarEmoji: avatarEmoji || "🦊",
        avatarColor: avatarColor || "#4a9e3f",
      },
      select: CHILD_SELECT,
    });

    await pushAudit({
      parentId: req.user.id,
      childId: child.id,
      type: "CHILD_CREATED",
      message: `Đã tạo hồ sơ cho ${child.name}`,
      metadata: { age: calculateAge(child.dob) },
    });

    return formatResponse(res, 201, "Đã tạo tài khoản cho bé thành công", {
      child: { ...serializeChild(child), todayMinutes: 0 },
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// ════════════════════════════════════════════
// DELETE /api/v1/children/:childId — xoá mềm (ẩn hồ sơ, không xoá dữ liệu)
// ════════════════════════════════════════════
const archiveChild = async (req, res) => {
  try {
    const child = await findOwnChild(req.user.id, req.params.childId);
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    await prisma.childProfile.update({
      where: { id: child.id },
      data: { isActive: false },
    });

    await pushAudit({
      parentId: req.user.id,
      childId: child.id,
      type: "CHILD_ARCHIVED",
      message: `Đã xoá hồ sơ của ${child.name}`,
    });

    return formatResponse(res, 200, "Đã xoá hồ sơ");
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// ════════════════════════════════════════════
// GET /api/v1/children/:childId/dashboard
// Trả về đầy đủ dữ liệu cho trang dashboard: thông tin bé, cài đặt hiện
// tại, phút dùng hôm nay, biểu đồ 7 ngày gần nhất, phiên đọc gần đây, và
// nhật ký hoạt động (audit log) gần đây.
// ════════════════════════════════════════════
const getChildDashboard = async (req, res) => {
  try {
    const child = await findOwnChild(req.user.id, req.params.childId);
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // 7 ngày gần nhất, kể cả hôm nay, thứ tự Thứ 2 → Chủ nhật theo tuần hiện tại
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Thứ 2 ... 6 = Chủ nhật
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const [weekLogs, sessions, auditLog] = await Promise.all([
      prisma.childActivityLog.findMany({
        where: { childId: child.id, occurredOn: { gte: startOfWeek } },
        select: { minutes: true, occurredOn: true },
      }),
      prisma.childActivityLog.findMany({
        where: { childId: child.id },
        orderBy: { occurredOn: "desc" },
        take: 8,
        include: { book: { select: { title: true } } },
      }),
      prisma.childAuditLog.findMany({
        where: { childId: child.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const weeklyMinutes = Array(7).fill(0);
    let todayMinutes = 0;
    for (const log of weekLogs) {
      const idx = (new Date(log.occurredOn).getDay() + 6) % 7;
      weeklyMinutes[idx] += log.minutes;
      if (new Date(log.occurredOn) >= startOfToday) todayMinutes += log.minutes;
    }

    return formatResponse(res, 200, "OK", {
      child: serializeChild(child),
      todayMinutes,
      weeklyMinutes,
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.book?.title || "Phiên đọc tự do",
        minutes: s.minutes,
        date: s.occurredOn,
      })),
      auditLog: auditLog.map((a) => ({
        id: a.id,
        type: a.type,
        text: a.message,
        time: a.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// ════════════════════════════════════════════
// PATCH /api/v1/children/:childId/settings — cập nhật giờ giấc / quy tắc mắt
// Lưu server-side để chống lách bằng cách đổi giờ máy/gỡ cài app.
// ════════════════════════════════════════════
const updateChildSettings = async (req, res) => {
  try {
    const child = await findOwnChild(req.user.id, req.params.childId);
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    const allowedFields = Object.keys(SETTINGS_SELECT);
    const data = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }

    if (Object.keys(data).length === 0) {
      return formatResponse(res, 400, "Không có gì để cập nhật");
    }

    if (
      data.dailyLimitMinutes !== undefined &&
      (data.dailyLimitMinutes < 5 || data.dailyLimitMinutes > 240)
    ) {
      return formatResponse(res, 400, "Giới hạn giờ phải trong khoảng 5–240 phút");
    }

    const updated = await prisma.childProfile.update({
      where: { id: child.id },
      data,
      select: CHILD_SELECT,
    });

    await pushAudit({
      parentId: req.user.id,
      childId: child.id,
      type: "SETTINGS_UPDATE",
      message: `Đã cập nhật cài đặt cho ${child.name}`,
      metadata: data,
    });

    return formatResponse(res, 200, "Đã lưu cài đặt", { child: serializeChild(updated) });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// ════════════════════════════════════════════
// POST /api/v1/children/:childId/lock — khoá AR ngay lập tức (không cần PIN)
// ════════════════════════════════════════════
const lockChild = async (req, res) => {
  try {
    const child = await findOwnChild(req.user.id, req.params.childId);
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    const updated = await prisma.childProfile.update({
      where: { id: child.id },
      data: { isLocked: true, lockedAt: new Date() },
      select: CHILD_SELECT,
    });

    await pushAudit({
      parentId: req.user.id,
      childId: child.id,
      type: "LOCK",
      message: `Bạn đã khoá AR cho ${child.name}`,
    });

    return formatResponse(res, 200, `Đã khoá AR trên thiết bị của ${child.name}`, {
      child: serializeChild(updated),
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// POST /api/v1/children/:childId/unlock — mở khoá, bắt buộc xác thực PIN
const unlockChild = async (req, res) => {
  try {
    const child = await findOwnChild(req.user.id, req.params.childId);
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const verify = await verifyParentPin(user, req.body.pin);
    if (!verify.ok) {
      return formatResponse(res, verify.code === "LOCKED_OUT" ? 429 : 400, verify.message, {
        code: verify.code,
      });
    }

    const updated = await prisma.childProfile.update({
      where: { id: child.id },
      data: { isLocked: false, lockedAt: null },
      select: CHILD_SELECT,
    });

    await pushAudit({
      parentId: req.user.id,
      childId: child.id,
      type: "UNLOCK",
      message: `Bạn đã mở khoá AR cho ${child.name}`,
    });

    return formatResponse(res, 200, "Đã mở khoá", { child: serializeChild(updated) });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// GET /api/v1/children/:childId/books
const getChildBooks = async (req, res) => {
  try {
    const child = await findOwnChild(req.user.id, req.params.childId);
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    const purchasedItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId: req.user.id,
          paymentStatus: "PAID",
          status: { in: ["CONFIRMED", "SHIPPING", "DELIVERED", "COMPLETED"] },
        },
      },
      select: {
        variant: {
          select: {
            book: {
              select: { id: true, title: true, slug: true, coverImage: true, ageMin: true, ageMax: true },
            },
          },
        },
      },
    });

    const bookMap = new Map();
    for (const item of purchasedItems) {
      const book = item.variant?.book;
      if (book) bookMap.set(book.id, book);
    }

    const access = await prisma.childBookAccess.findMany({
      where: { childId: child.id, bookId: { in: [...bookMap.keys()] } },
    });
    const visibilityMap = Object.fromEntries(access.map((a) => [a.bookId, a.visible]));

    const books = [...bookMap.values()].map((book) => ({
      ...book,
      visible: visibilityMap[book.id] ?? true,
    }));

    return formatResponse(res, 200, "OK", { books });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// PATCH /api/v1/children/:childId/books/:bookId — bật/tắt hiển thị 1 sách
const toggleChildBookVisibility = async (req, res) => {
  try {
    const child = await findOwnChild(req.user.id, req.params.childId);
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    const { bookId } = req.params;
    const { visible } = req.body;
    if (typeof visible !== "boolean") {
      return formatResponse(res, 400, "Thiếu trạng thái hiển thị");
    }

    // Chỉ cho phép bật/tắt sách nằm trong đơn hàng đã thanh toán của
    // chính phụ huynh này — chặn việc bật hiển thị sách chưa mua.
    const owned = await prisma.orderItem.findFirst({
      where: {
        variant: { bookId },
        order: {
          userId: req.user.id,
          paymentStatus: "PAID",
          status: { in: ["CONFIRMED", "SHIPPING", "DELIVERED", "COMPLETED"] },
        },
      },
    });
    if (!owned) {
      return formatResponse(res, 403, "Sách này không nằm trong đơn hàng đã mua của bạn");
    }

    const book = await prisma.book.findUnique({ where: { id: bookId }, select: { title: true } });

    await prisma.childBookAccess.upsert({
      where: { childId_bookId: { childId: child.id, bookId } },
      update: { visible },
      create: { childId: child.id, bookId, visible },
    });

    await pushAudit({
      parentId: req.user.id,
      childId: child.id,
      type: "BOOK_VISIBILITY",
      message: `${visible ? "Đã cho hiển thị" : "Đã ẩn"} "${book?.title || "sách"}" với ${child.name}`,
      metadata: { bookId, visible },
    });

    return formatResponse(res, 200, "Đã cập nhật");
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// GET /api/v1/children/:childId/kid-link — lấy link + QR riêng cho bé
const getKidLink = async (req, res) => {
  try {
    const child = await prisma.childProfile.findFirst({
      where: { id: req.params.childId, parentId: req.user.id, isActive: true },
      select: { id: true, name: true, kidLinkToken: true },
    });
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    let token = child.kidLinkToken;
    if (!token) {
      token = generateKidLinkToken();
      await prisma.childProfile.update({
        where: { id: child.id },
        data: { kidLinkToken: token },
      });
    }

    const url = buildKidLinkUrl(process.env.CLIENT_URL || "", child.name, token);
    return formatResponse(res, 200, "OK", { url, token });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// POST /api/v1/children/:childId/kid-link/regenerate
const regenerateKidLink = async (req, res) => {
  try {
    const child = await findOwnChild(req.user.id, req.params.childId);
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    const token = generateKidLinkToken();
    await prisma.childProfile.update({
      where: { id: child.id },
      data: { kidLinkToken: token },
    });

    await pushAudit({
      parentId: req.user.id,
      childId: child.id,
      type: "KID_LINK_REGENERATED",
      message: `Đã tạo lại link riêng cho ${child.name}, link cũ đã bị huỷ`,
    });

    const url = buildKidLinkUrl(process.env.CLIENT_URL || "", child.name, token);
    return formatResponse(res, 200, "Đã tạo lại link mới", { url, token });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// DELETE /api/v1/children/:childId/permanent — XOÁ VĨNH VIỄN
const deleteChildPermanently = async (req, res) => {
  try {
    const child = await prisma.childProfile.findFirst({
      where: { id: req.params.childId, parentId: req.user.id },
      select: { id: true, name: true },
    });
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    const { confirmName } = req.body;
    if (typeof confirmName !== "string" || confirmName.trim() !== child.name) {
      return formatResponse(
        res,
        400,
        "Tên xác nhận không khớp. Vui lòng nhập chính xác tên của bé để xoá vĩnh viễn.",
      );
    }

    // Ghi log trước khi xoá
    await prisma.childAuditLog.create({
      data: {
        parentId: req.user.id,
        childId: child.id,
        type: "CHILD_DELETED",
        message: `Đã xoá VĨNH VIỄN hồ sơ và toàn bộ dữ liệu của ${child.name}`,
      },
    });
    await prisma.childProfile.delete({ where: { id: child.id } });

    return formatResponse(res, 200, "Đã xoá vĩnh viễn hồ sơ của bé");
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// [PUBLIC — không cần đăng nhập] GET dữ liệu đọc-only cho trang Kiosk
const getKidPublicProfile = async (req, res) => {
  try {
    const { token } = req.params;
    const child = await prisma.childProfile.findFirst({
      where: { kidLinkToken: token, isActive: true },
      select: {
        id: true,
        name: true,
        avatarEmoji: true,
        avatarColor: true,
        isLocked: true,
        dailyLimitMinutes: true,
        ruleEnabled: true,
        ruleIntervalMinutes: true,
        ruleRestSeconds: true,
        allowWindowEnabled: true,
        allowStart: true,
        allowEnd: true,
        mandatoryBreakEnabled: true,
        breakAfterMinutes: true,
        breakDurationMinutes: true,
        tipsEnabled: true,
        tipsFrequency: true,
      },
    });
    if (!child) return formatResponse(res, 404, "Link không hợp lệ hoặc đã bị thu hồi");

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayAgg = await prisma.childActivityLog.aggregate({
      where: { childId: child.id, occurredOn: { gte: startOfToday } },
      _sum: { minutes: true },
    });

    return formatResponse(res, 200, "OK", {
      child: { ...serializeChild(child), todayMinutes: todayAgg._sum.minutes || 0 },
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// [PUBLIC] GET /api/v1/kid-access/:token/books — danh sách sách bé được
const getKidPublicBooks = async (req, res) => {
  try {
    const { token } = req.params;
    const child = await prisma.childProfile.findFirst({
      where: { kidLinkToken: token, isActive: true },
      select: { id: true, parentId: true },
    });
    if (!child) return formatResponse(res, 404, "Link không hợp lệ hoặc đã bị thu hồi");

    const purchasedItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId: child.parentId,
          paymentStatus: "PAID",
          status: { in: ["CONFIRMED", "SHIPPING", "DELIVERED", "COMPLETED"] },
        },
      },
      select: {
        variant: {
          select: {
            book: {
              select: { id: true, title: true, slug: true, coverImage: true, ageMin: true, ageMax: true },
            },
          },
        },
      },
    });

    const bookMap = new Map();
    for (const item of purchasedItems) {
      const book = item.variant?.book;
      if (book) bookMap.set(book.id, book);
    }

    const access = await prisma.childBookAccess.findMany({
      where: { childId: child.id, bookId: { in: [...bookMap.keys()] } },
    });
    const visibilityMap = Object.fromEntries(access.map((a) => [a.bookId, a.visible]));

    const books = [...bookMap.values()]
      .map((book) => ({ ...book, visible: visibilityMap[book.id] ?? true }))
      .filter((b) => b.visible);

    return formatResponse(res, 200, "OK", { books });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

module.exports = {
  listChildren,
  createChild,
  archiveChild,
  getChildDashboard,
  updateChildSettings,
  lockChild,
  unlockChild,
  getChildBooks,
  toggleChildBookVisibility,
  getKidLink,
  regenerateKidLink,
  deleteChildPermanently,
  getKidPublicProfile,
  getKidPublicBooks,
};