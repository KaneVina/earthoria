const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const { calculateAge, isValidChildDob } = require("../utils/age");
const { verifyParentPin } = require("../utils/parentPin");
const { generateKidLinkToken, buildKidLinkUrl } = require("../utils/kidLink");
const {
  startOfTodayVn,
  getVnParts,
  isWithinAllowedWindow,
  isDailyLimitReached,
  getTodayMinutes,
} = require("../utils/childPolicy");
const { getUserLoyaltyProfile } = require("../utils/loyaltyTier");

function buildChildLimitPayload(loyaltyProfile, currentCount) {
  const {
    tier,
    nextTier,
    isMaxTier,
    childAccountLimit,
    nextChildAccountLimit,
  } = loyaltyProfile;
  return {
    current: currentCount,
    max: childAccountLimit,
    isMaxTier,
    tierRank: tier.rank,
    tierRoman: tier.roman,
    tierName: tier.name,
    nextTierRoman: nextTier ? nextTier.roman : null,
    nextTierName: nextTier ? nextTier.name : null,
    nextMax: nextChildAccountLimit,
  };
}

const MAX_SESSION_MINUTES = 6 * 60;
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

const TIPS_FREQUENCY_VALUES = ["open", "interval", "rest"];
const TIME_HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validateSettingsPatch(body) {
  const data = {};
  const boolFields = [
    "ruleEnabled",
    "allowWindowEnabled",
    "mandatoryBreakEnabled",
    "tipsEnabled",
    "notifyPush",
    "notifyEmail",
    "notifyOnLimitExceeded",
    "notifyOnSkippedRest",
  ];
  for (const field of boolFields) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "boolean") {
        return { error: `Trường "${field}" phải là true/false` };
      }
      data[field] = body[field];
    }
  }

  const intRanges = {
    dailyLimitMinutes: [5, 240],
    ruleIntervalMinutes: [1, 180],
    ruleRestSeconds: [5, 600],
    breakAfterMinutes: [5, 240],
    breakDurationMinutes: [1, 60],
  };
  const rangeMessages = {
    dailyLimitMinutes: "Giới hạn giờ phải trong khoảng 5–240 phút",
    ruleIntervalMinutes: "Chu kỳ nhắc nghỉ mắt phải trong khoảng 1–180 phút",
    ruleRestSeconds: "Thời gian nghỉ mắt phải trong khoảng 5–600 giây",
    breakAfterMinutes: "Thời điểm nhắc nghỉ phải trong khoảng 5–240 phút",
    breakDurationMinutes:
      "Thời lượng nghỉ giải lao phải trong khoảng 1–60 phút",
  };
  for (const [field, [min, max]] of Object.entries(intRanges)) {
    if (body[field] !== undefined) {
      const n = Number(body[field]);
      if (!Number.isInteger(n) || n < min || n > max) {
        return { error: rangeMessages[field] };
      }
      data[field] = n;
    }
  }

  for (const field of ["allowStart", "allowEnd"]) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string" || !TIME_HHMM_RE.test(body[field])) {
        return {
          error: `Trường "${field}" phải có định dạng giờ hợp lệ (HH:mm)`,
        };
      }
      data[field] = body[field];
    }
  }

  if (body.tipsFrequency !== undefined) {
    if (!TIPS_FREQUENCY_VALUES.includes(body.tipsFrequency)) {
      return { error: `Trường "tipsFrequency" không hợp lệ` };
    }
    data.tipsFrequency = body.tipsFrequency;
  }

  return { data };
}

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
  return prisma.childAuditLog
    .create({ data: { parentId, childId, type, message, metadata } })
    .catch((err) =>
      console.error("[childAuditLog] Failed to write:", err.message),
    );
}

// GET /api/v1/children — danh sách hồ sơ con của phụ huynh đang đăng nhập
const listChildren = async (req, res) => {
  try {
    const children = await prisma.childProfile.findMany({
      where: { parentId: req.user.id, isActive: true },
      select: CHILD_SELECT,
      orderBy: { createdAt: "asc" },
    });

    const startOfToday = startOfTodayVn();

    const childIds = children.map((c) => c.id);
    const todayLogs = childIds.length
      ? await prisma.childActivityLog.groupBy({
          by: ["childId"],
          where: {
            childId: { in: childIds },
            occurredOn: { gte: startOfToday },
          },
          _sum: { minutes: true },
        })
      : [];
    const todayByChild = Object.fromEntries(
      todayLogs.map((row) => [row.childId, row._sum.minutes || 0]),
    );

    const loyaltyProfile = await getUserLoyaltyProfile(req.user.id);
    const childLimit = buildChildLimitPayload(loyaltyProfile, children.length);

    return formatResponse(res, 200, "OK", {
      children: children.map((c) => ({
        ...serializeChild(c),
        todayMinutes: todayByChild[c.id] || 0,
      })),
      childLimit,
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// POST /api/v1/children — bước cuối của wizard tạo hồ sơ trẻ
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

    let child;
    let limitErrorPayload = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        child = await prisma.$transaction(
          async (tx) => {
            const [existingCount, loyaltyProfile] = await Promise.all([
              tx.childProfile.count({
                where: { parentId: req.user.id, isActive: true },
              }),
              getUserLoyaltyProfile(req.user.id, tx),
            ]);
            const maxChildAccounts = loyaltyProfile.childAccountLimit;
            if (existingCount >= maxChildAccounts) {
              const err = new Error("MAX_CHILDREN_REACHED");
              err.code = "MAX_CHILDREN_REACHED";
              err.payload = buildChildLimitPayload(
                loyaltyProfile,
                existingCount,
              );
              throw err;
            }
            return tx.childProfile.create({
              data: {
                parentId: req.user.id,
                name: name.trim(),
                dob: new Date(dob),
                avatarEmoji: avatarEmoji || "🦊",
                avatarColor: avatarColor || "#4a9e3f",
              },
              select: CHILD_SELECT,
            });
          },
          { isolationLevel: "Serializable" },
        );
        break;
      } catch (err) {
        if (err.code === "MAX_CHILDREN_REACHED") {
          limitErrorPayload = err.payload;
          break;
        }
        const isSerializationConflict = err.code === "P2034";
        if (isSerializationConflict && attempt === 0) continue; // thử lại 1 lần
        throw err;
      }
    }

    if (limitErrorPayload) {
      const {
        max,
        tierRoman,
        tierName,
        isMaxTier,
        nextTierRoman,
        nextTierName,
        nextMax,
      } = limitErrorPayload;
      const message = isMaxTier
        ? `Bạn đã đạt giới hạn tối đa ${max} hồ sơ trẻ em (Hạng ${tierRoman} · ${tierName} — hạng cao nhất).`
        : `Bạn đã đạt giới hạn ${max} hồ sơ trẻ em của Hạng ${tierRoman} · ${tierName}. Lên Hạng ${nextTierRoman} · ${nextTierName} để mở khóa thêm, tối đa ${nextMax} hồ sơ.`;
      return formatResponse(res, 400, message, {
        code: "MAX_CHILDREN_REACHED",
        childLimit: limitErrorPayload,
      });
    }

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

// DELETE /api/v1/children/:childId — xoá mềm (ẩn hồ sơ, không xoá dữ liệu)
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

// GET /api/v1/children/:childId/dashboard
const getChildDashboard = async (req, res) => {
  try {
    const child = await findOwnChild(req.user.id, req.params.childId);
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    const startOfToday = startOfTodayVn();
    const todayVnParts = getVnParts();
    const todayWeekdayUtc = new Date(
      Date.UTC(todayVnParts.year, todayVnParts.month - 1, todayVnParts.day),
    );
    const dayOfWeek = (todayWeekdayUtc.getUTCDay() + 6) % 7; // 0 = Thứ 2 ... 6 = Chủ nhật
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - dayOfWeek);

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
      const logVnParts = getVnParts(log.occurredOn);
      const logWeekdayUtc = new Date(
        Date.UTC(logVnParts.year, logVnParts.month - 1, logVnParts.day),
      );
      const idx = (logWeekdayUtc.getUTCDay() + 6) % 7;
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

// PATCH /api/v1/children/:childId/settings — cập nhật giờ giấc / quy tắc mắt
// Lưu server-side để chống lách bằng cách đổi giờ máy/gỡ cài app.
const updateChildSettings = async (req, res) => {
  try {
    const child = await findOwnChild(req.user.id, req.params.childId);
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    const { data, error } = validateSettingsPatch(req.body);
    if (error) return formatResponse(res, 400, error);

    if (Object.keys(data).length === 0) {
      return formatResponse(res, 400, "Không có gì để cập nhật");
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

    return formatResponse(res, 200, "Đã lưu cài đặt", {
      child: serializeChild(updated),
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// POST /api/v1/children/:childId/lock — khoá AR ngay lập tức (không cần PIN)
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
      message: `Bạn đã khoá thiết bị của ${child.name}`,
    });

    return formatResponse(res, 200, `Đã khoá thiết bị của ${child.name}`, {
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
      return formatResponse(
        res,
        verify.code === "LOCKED_OUT" ? 429 : 400,
        verify.message,
        {
          code: verify.code,
        },
      );
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
      message: `Bạn đã mở khoá cho ${child.name}`,
    });

    return formatResponse(res, 200, "Đã mở khoá", {
      child: serializeChild(updated),
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// GET /api/v1/children/:childId/books
// Trả về 2 nhóm tách biệt để khớp đúng bản chất từng loại:
//  - ebooks: variant DIGITAL, đơn đã DELIVERED/COMPLETED, có bản Ebook active
//    → đúng bằng điều kiện getKidPublicBooks dùng cho /e-kid, nên có thể bật/tắt
//    hiển thị cho bé và /family luôn đồng bộ với kidaccess.
//  - physicalBooks: variant PHYSICAL đã mua (mọi trạng thái đơn đã thanh toán)
//    → chỉ để phụ huynh biết đã mua sách giấy nào, KHÔNG có công tắc hiển thị
//    vì bé không thể đọc sách giấy trên thiết bị qua kidaccess.
const getChildBooks = async (req, res) => {
  try {
    const child = await findOwnChild(req.user.id, req.params.childId);
    if (!child) return formatResponse(res, 404, "Không tìm thấy hồ sơ trẻ");

    const bookSelect = {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      ageMin: true,
      ageMax: true,
    };

    const [digitalOrderItems, physicalOrderItems] = await Promise.all([
      prisma.orderItem.findMany({
        where: {
          variant: { format: "DIGITAL" },
          order: {
            userId: req.user.id,
            paymentStatus: "PAID",
            status: { in: ["DELIVERED", "COMPLETED"] },
          },
        },
        select: { variant: { select: { book: { select: bookSelect } } } },
      }),
      prisma.orderItem.findMany({
        where: {
          variant: { format: "PHYSICAL" },
          order: {
            userId: req.user.id,
            paymentStatus: "PAID",
            status: { in: ["CONFIRMED", "SHIPPING", "DELIVERED", "COMPLETED"] },
          },
        },
        select: { variant: { select: { book: { select: bookSelect } } } },
      }),
    ]);

    const digitalBookMap = new Map();
    for (const item of digitalOrderItems) {
      const book = item.variant?.book;
      if (book) digitalBookMap.set(book.id, book);
    }

    const ebookRecords = await prisma.ebook.findMany({
      where: { isActive: true, bookId: { in: [...digitalBookMap.keys()] } },
      select: { bookId: true },
    });
    const ebookBookIds = new Set(ebookRecords.map((e) => e.bookId));

    const access = await prisma.childBookAccess.findMany({
      where: { childId: child.id, bookId: { in: [...ebookBookIds] } },
    });
    const visibilityMap = Object.fromEntries(
      access.map((a) => [a.bookId, a.visible]),
    );

    const ebooks = [...digitalBookMap.values()]
      .filter((book) => ebookBookIds.has(book.id))
      .map((book) => ({
        ...book,
        visible: visibilityMap[book.id] ?? true,
      }));

    const physicalBookMap = new Map();
    for (const item of physicalOrderItems) {
      const book = item.variant?.book;
      if (book) physicalBookMap.set(book.id, book);
    }
    const physicalBooks = [...physicalBookMap.values()];

    return formatResponse(res, 200, "OK", { ebooks, physicalBooks });
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

    // Điều kiện y hệt getChildBooks/getKidPublicBooks: variant DIGITAL,
    // đơn đã DELIVERED/COMPLETED, và sách có bản Ebook đang active — để
    // không thể bật hiển thị 1 cuốn mà /family và kidaccess không cùng thấy.
    const owned = await prisma.orderItem.findFirst({
      where: {
        variant: { bookId, format: "DIGITAL" },
        order: {
          userId: req.user.id,
          paymentStatus: "PAID",
          status: { in: ["DELIVERED", "COMPLETED"] },
        },
      },
    });
    if (!owned) {
      return formatResponse(
        res,
        403,
        "Sách này không nằm trong đơn hàng đã mua của bạn",
      );
    }

    const hasActiveEbook = await prisma.ebook.findFirst({
      where: { bookId, isActive: true },
      select: { id: true },
    });
    if (!hasActiveEbook) {
      return formatResponse(
        res,
        403,
        "Sách này chưa có bản sách điện tử để hiển thị cho bé",
      );
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { title: true },
    });

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

    const url = buildKidLinkUrl(
      process.env.CLIENT_URL || "",
      child.name,
      token,
    );
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

    const url = buildKidLinkUrl(
      process.env.CLIENT_URL || "",
      child.name,
      token,
    );
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

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const verify = await verifyParentPin(user, req.body.pin);
    if (!verify.ok) {
      return formatResponse(
        res,
        verify.code === "LOCKED_OUT" ? 429 : 400,
        verify.message,
        {
          code: verify.code,
        },
      );
    }

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
    if (!child)
      return formatResponse(res, 404, "Link không hợp lệ hoặc đã bị thu hồi");

    const todayMinutes = await getTodayMinutes(prisma, child.id);

    return formatResponse(res, 200, "OK", {
      child: { ...serializeChild(child), todayMinutes },
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
    if (!child)
      return formatResponse(res, 404, "Link không hợp lệ hoặc đã bị thu hồi");
    const digitalOrderItems = await prisma.orderItem.findMany({
      where: {
        variant: { format: "DIGITAL" },
        order: {
          userId: child.parentId,
          paymentStatus: "PAID",
          status: { in: ["DELIVERED", "COMPLETED"] },
        },
      },
      select: {
        variant: {
          select: {
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
          },
        },
      },
    });

    const bookMap = new Map();
    for (const item of digitalOrderItems) {
      const book = item.variant?.book;
      if (book) bookMap.set(book.id, book);
    }

    const ebooks = await prisma.ebook.findMany({
      where: { isActive: true, bookId: { in: [...bookMap.keys()] } },
      select: { bookId: true },
    });
    const ebookBookIds = new Set(ebooks.map((e) => e.bookId));

    const access = await prisma.childBookAccess.findMany({
      where: { childId: child.id, bookId: { in: [...ebookBookIds] } },
    });
    const visibilityMap = Object.fromEntries(
      access.map((a) => [a.bookId, a.visible]),
    );

    const books = [...bookMap.values()]
      .filter((book) => ebookBookIds.has(book.id))
      .map((book) => ({
        ...book,
        visible: visibilityMap[book.id] ?? true,
      }))
      .filter((b) => b.visible);

    return formatResponse(res, 200, "OK", { books });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// [PUBLIC] POST /api/v1/kid-access/:token/activity/start
const startKidActivity = async (req, res) => {
  try {
    const { token } = req.params;
    const { bookId } = req.body;

    const child = await prisma.childProfile.findFirst({
      where: { kidLinkToken: token, isActive: true },
    });
    if (!child)
      return formatResponse(res, 404, "Link không hợp lệ hoặc đã bị thu hồi");

    if (child.isLocked) {
      return formatResponse(
        res,
        403,
        "Thiết bị của bé đang bị phụ huynh khoá.",
        {
          code: "CHILD_LOCKED",
        },
      );
    }
    if (!isWithinAllowedWindow(child)) {
      return formatResponse(
        res,
        403,
        "Ngoài khung giờ ba mẹ cho phép sử dụng.",
        {
          code: "OUTSIDE_ALLOWED_WINDOW",
        },
      );
    }
    if (await isDailyLimitReached(prisma, child)) {
      return formatResponse(
        res,
        403,
        "Bé đã dùng hết thời gian hôm nay rồi, hẹn bé ngày mai nhé!",
        {
          code: "DAILY_LIMIT_REACHED",
        },
      );
    }

    let validBookId = null;
    if (bookId) {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        select: { id: true },
      });
      if (book) validBookId = book.id;
    }

    const log = await prisma.childActivityLog.create({
      data: { childId: child.id, bookId: validBookId, minutes: 0 },
    });

    return formatResponse(res, 201, "OK", { activityId: log.id });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// [PUBLIC] POST /api/v1/kid-access/:token/activity/:activityId/ping
const pingKidActivity = async (req, res) => {
  try {
    const { token, activityId } = req.params;

    const child = await prisma.childProfile.findFirst({
      where: { kidLinkToken: token, isActive: true },
    });
    if (!child)
      return formatResponse(res, 404, "Link không hợp lệ hoặc đã bị thu hồi");

    const log = await prisma.childActivityLog.findFirst({
      where: { id: activityId, childId: child.id },
    });
    if (!log) return formatResponse(res, 404, "Không tìm thấy phiên hoạt động");

    const elapsedMs = Date.now() - log.createdAt.getTime();
    const minutes = Math.max(
      0,
      Math.min(MAX_SESSION_MINUTES, Math.round(elapsedMs / 60000)),
    );

    if (minutes !== log.minutes) {
      await prisma.childActivityLog.update({
        where: { id: log.id },
        data: { minutes },
      });
    }

    const todayMinutes = await getTodayMinutes(prisma, child.id);
    const limitReached =
      child.dailyLimitMinutes > 0 && todayMinutes >= child.dailyLimitMinutes;

    return formatResponse(res, 200, "OK", {
      minutes,
      todayMinutes,
      limitReached,
      locked: child.isLocked,
      withinWindow: isWithinAllowedWindow(child),
    });
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
  startKidActivity,
  pingKidActivity,
};
