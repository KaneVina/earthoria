const prisma = require("../config/db");
const { resolveTierBySpend } = require("../utils/loyaltyTier");
const { calculateAge } = require("../utils/age");
const {
  resolveDateRange,
  pickBucket,
  bucketKeys,
  fillBucketChart,
} = require("../utils/dateRange");

const SUCCESSFUL_ORDER_STATUSES = [
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
  "COMPLETED",
];

/* ── Helpers dùng chung ── */

function classifyDevice(ua) {
  if (!ua) return "Không rõ";
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return "Tablet";
  if (/mobile|iphone|android/.test(s)) return "Di động";
  if (/windows|macintosh|linux/.test(s)) return "Máy tính";
  return "Khác";
}

// Chuẩn bị {start, end, bucket, keys, meta} dùng chung cho mọi hàm bên dưới
function prepareRange(req) {
  const { start, end } = resolveDateRange(req.query);
  const bucket = pickBucket(start, end);
  const keys = bucketKeys(start, end, bucket);
  const meta = {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
    bucket,
  };
  return { start, end, bucket, keys, meta };
}

/* ═══════════════════════════ TAB: NGƯỜI DÙNG ═══════════════════════════ */
exports.getDashboardUsers = async (req, res) => {
  try {
    const { start, end, bucket, keys, meta } = prepareRange(req);
    const createdInRange = { createdAt: { gte: start, lte: end } };

    // ── Các số TỔNG/THÀNH PHẦN (vai trò, giới tính, số lượng, hạng thành viên) là
    // TRẠNG THÁI HIỆN TẠI của toàn hệ thống - KHÔNG lọc theo khoảng ngày đã chọn.
    // Lý do: nhãn "Tổng khách hàng" ngụ ý tổng toàn bộ, nếu âm thầm lọc theo ngày tạo
    // sẽ gây hiểu nhầm (vd: đổi khoảng ngày mà số liệu không đổi vì phần lớn tài khoản
    // đăng ký gần đây, khiến tưởng là lỗi). Chỉ các biểu đồ XU HƯỚNG theo thời gian
    // (đăng ký mới, đăng nhập, thiết bị) mới lọc theo bộ lọc ngày phía dưới.
    const [
      roleGroups,
      genderGroups,
      activeCount,
      inactiveCount,
      totalChildren,
      lockedChildren,
      allCustomers,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.user.groupBy({
        by: ["gender"],
        _count: { _all: true },
        where: { role: "CUSTOMER" },
      }),
      prisma.user.count({ where: { role: "CUSTOMER", isActive: true } }),
      prisma.user.count({ where: { role: "CUSTOMER", isActive: false } }),
      prisma.childProfile.count({ where: { isActive: true } }),
      prisma.childProfile.count({ where: { isActive: true, isLocked: true } }),
      // Toàn bộ khách hàng hiện có - dùng để tính hạng thành viên bên dưới,
      // đảm bảo AI CŨNG có hạng (kể cả chưa mua gì = hạng thấp nhất/"hạng chùa")
      prisma.user.findMany({
        where: { role: "CUSTOMER" },
        select: { id: true },
      }),
    ]);

    const roleBreakdown = roleGroups.map((g) => ({
      role: g.role,
      count: g._count._all,
    }));

    const GENDER_LABEL = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };
    const genderBreakdown = genderGroups.map((g) => ({
      name: GENDER_LABEL[g.gender] ?? "Chưa cập nhật",
      value: g._count._all,
    }));

    // ── Hạng thành viên: tính trên TOÀN BỘ khách hàng hiện có (không lọc ngày, vì
    // hạng là thuộc tính lâu dài của tài khoản) + dựa trên TỔNG CHI TIÊU TRỌN ĐỜI
    // (mọi đơn thành công, không giới hạn theo khoảng ngày). Khách chưa từng mua gì
    // (chi tiêu = 0) vẫn được xếp vào hạng thấp nhất thay vì bị bỏ sót như trước.
    const spendByUser = await prisma.order.groupBy({
      by: ["userId"],
      where: { status: { in: SUCCESSFUL_ORDER_STATUSES } },
      _sum: { total: true },
    });
    const spendMap = new Map(
      spendByUser.map((r) => [r.userId, r._sum.total ?? 0]),
    );
    const tierMap = new Map();
    for (const customer of allCustomers) {
      const spend = spendMap.get(customer.id) ?? 0;
      const tier = resolveTierBySpend(spend);
      const prev = tierMap.get(tier.code) ?? {
        name: tier.name,
        color: tier.color,
        count: 0,
      };
      prev.count += 1;
      tierMap.set(tier.code, prev);
    }
    const loyaltyTierBreakdown = [...tierMap.values()].sort(
      (a, b) => b.count - a.count,
    );

    // ── Từ đây trở xuống là các biểu đồ XU HƯỚNG - có lọc theo khoảng ngày đã chọn ──

    const newUsersRowsRaw = await prisma.$queryRaw`
      SELECT date_trunc(${bucket}, "createdAt") AS bucket, COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end} AND role = 'CUSTOMER'
      GROUP BY 1 ORDER BY 1
    `;
    const newUsersChart = fillBucketChart(newUsersRowsRaw, keys, bucket, [
      "count",
    ]).map((r) => ({
      day: r.label,
      date: r.date,
      count: r.count,
    }));

    // Tăng trưởng người dùng: biểu đồ MACRO cố định 12 tháng gần nhất, KHÔNG đổi theo bộ lọc
    // ngày/tuần đang chọn (vì lũy kế theo range ngắn sẽ không có ý nghĩa xu hướng dài hạn)
    const growthNow = new Date();
    const growthRangeStart = new Date(
      growthNow.getFullYear(),
      growthNow.getMonth() - 11,
      1,
    );
    const growthRows = await prisma.$queryRaw`
      SELECT date_trunc('month', "createdAt") AS bucket, COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= ${growthRangeStart} AND role = 'CUSTOMER'
      GROUP BY 1 ORDER BY 1
    `;
    const growthMap = new Map(
      growthRows.map((r) => [
        `${r.bucket.getFullYear()}-${r.bucket.getMonth() + 1}`,
        r.count,
      ]),
    );
    let cumulative = await prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { lt: growthRangeStart } },
    });
    const userGrowthChart = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(
        growthNow.getFullYear(),
        growthNow.getMonth() - 11 + i,
        1,
      );
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const added = growthMap.get(key) ?? 0;
      cumulative += added;
      return { month: `T${d.getMonth() + 1}`, new: added, total: cumulative };
    });

    // Top tỉnh/thành: giữ SNAPSHOT toàn bộ khách hàng hiện có (không lọc ngày) -
    // trả lời câu hỏi "khách hàng hiện đang ở đâu", nhất quán với role/gender/tier ở trên
    const provinceGroups = await prisma.address.groupBy({
      by: ["province"],
      _count: { _all: true },
      where: { user: { role: "CUSTOMER" } },
      orderBy: { _count: { province: "desc" } },
      take: 8,
    });
    const topProvinces = provinceGroups.map((g) => ({
      name: g.province,
      count: g._count._all,
    }));

    const loginRows = await prisma.$queryRaw`
      SELECT date_trunc(${bucket}, "createdAt") AS bucket, COUNT(*)::int AS count
      FROM "RefreshToken"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY 1 ORDER BY 1
    `;
    const loginActivityChart = fillBucketChart(loginRows, keys, bucket, [
      "count",
    ]).map((r) => ({
      day: r.label,
      date: r.date,
      count: r.count,
    }));

    const recentTokens = await prisma.refreshToken.findMany({
      where: createdInRange,
      take: 500,
      orderBy: { createdAt: "desc" },
      select: { userAgent: true },
    });
    const deviceMap = new Map();
    for (const t of recentTokens) {
      const key = classifyDevice(t.userAgent);
      deviceMap.set(key, (deviceMap.get(key) ?? 0) + 1);
    }
    const deviceBreakdown = [...deviceMap.entries()].map(([name, value]) => ({
      name,
      value,
    }));

    return res.json({
      success: true,
      data: {
        meta,
        stats: {
          totalCustomers: activeCount + inactiveCount,
          activeCustomers: activeCount,
          inactiveCustomers: inactiveCount,
          totalChildren,
          lockedChildren,
        },
        roleBreakdown,
        genderBreakdown,
        newUsersChart,
        userGrowthChart,
        topProvinces,
        loginActivityChart,
        deviceBreakdown,
        loyaltyTierBreakdown,
      },
    });
  } catch (err) {
    console.error("[getDashboardUsers]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/* ═══════════════════════════ TAB: KINH DOANH ═══════════════════════════ */
exports.getDashboardSales = async (req, res) => {
  try {
    const { start, end, bucket, keys, meta } = prepareRange(req);
    const createdInRange = { createdAt: { gte: start, lte: end } };

    const [
      paymentGroups,
      formatGroups,
      cancelledCount,
      refundedCount,
      cartsWithItems,
      couponsAgg,
    ] = await Promise.all([
      prisma.order.groupBy({
        by: ["paymentMethod"],
        where: { paymentStatus: "PAID", ...createdInRange },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.groupBy({
        by: ["isDigital"],
        where: { paymentStatus: "PAID", ...createdInRange },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { status: "CANCELLED", ...createdInRange } }),
      prisma.order.count({ where: { status: "REFUNDED", ...createdInRange } }),
      prisma.cart.count({ where: { items: { some: {} } } }),
      prisma.coupon.aggregate({
        _sum: { usedCount: true },
        _count: { _all: true },
        where: createdInRange,
      }),
    ]);

    const paymentMethodBreakdown = paymentGroups.map((g) => ({
      name: g.paymentMethod,
      orders: g._count._all,
      revenue: Math.round(((g._sum.total ?? 0) / 1_000_000) * 10) / 10,
    }));

    const formatBreakdown = formatGroups.map((g) => ({
      name: g.isDigital ? "Ebook" : "Sách giấy",
      orders: g._count._all,
      revenue: Math.round(((g._sum.total ?? 0) / 1_000_000) * 10) / 10,
    }));

    const dailyRows = await prisma.$queryRaw`
      SELECT date_trunc(${bucket}, "createdAt") AS bucket,
             COUNT(*)::int AS count,
             COALESCE(SUM(total) FILTER (WHERE "paymentStatus" = 'PAID'), 0)::float AS revenueRaw
      FROM "Order"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY 1 ORDER BY 1
    `;
    const ordersChartRaw = fillBucketChart(dailyRows, keys, bucket, [
      "count",
      "revenueRaw",
    ]);
    const ordersChart = ordersChartRaw.map((r) => ({
      day: r.label,
      orders: r.count,
      revenue: Math.round((r.revenueRaw / 1_000_000) * 10) / 10,
    }));

    const paidItems = await prisma.orderItem.findMany({
      where: { order: { paymentStatus: "PAID", ...createdInRange } },
      select: {
        quantity: true,
        variant: {
          select: {
            book: { select: { category: { select: { name: true } } } },
          },
        },
      },
    });
    const categoryCountMap = new Map();
    for (const item of paidItems) {
      const name = item.variant.book.category?.name ?? "Chưa phân loại";
      categoryCountMap.set(
        name,
        (categoryCountMap.get(name) ?? 0) + item.quantity,
      );
    }
    const topCategoriesByOrders = [...categoryCountMap.entries()]
      .map(([name, sold]) => ({ name, sold }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 8);

    const topCoupons = await prisma.coupon.findMany({
      where: createdInRange,
      orderBy: { usedCount: "desc" },
      take: 6,
      select: {
        code: true,
        type: true,
        value: true,
        usedCount: true,
        usageLimit: true,
      },
    });

    const totalPaidOrders = paymentGroups.reduce(
      (s, g) => s + g._count._all,
      0,
    );
    const totalPaidRevenue = paymentGroups.reduce(
      (s, g) => s + (g._sum.total ?? 0),
      0,
    );
    const avgOrderValue =
      totalPaidOrders > 0 ? Math.round(totalPaidRevenue / totalPaidOrders) : 0;

    const cartAbandonmentRate =
      cartsWithItems + totalPaidOrders > 0
        ? Math.round(
            (cartsWithItems / (cartsWithItems + totalPaidOrders)) * 1000,
          ) / 10
        : 0;

    return res.json({
      success: true,
      data: {
        meta,
        stats: {
          avgOrderValue,
          cancelledCount,
          refundedCount,
          activeCartsWithItems: cartsWithItems,
          cartAbandonmentRate,
          totalCoupons: couponsAgg._count._all,
          totalCouponUses: couponsAgg._sum.usedCount ?? 0,
        },
        paymentMethodBreakdown,
        formatBreakdown,
        ordersChart,
        topCategoriesByOrders,
        topCoupons,
      },
    });
  } catch (err) {
    console.error("[getDashboardSales]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/* ═══════════════════════════ TAB: NỘI DUNG ═══════════════════════════ */
exports.getDashboardContent = async (req, res) => {
  try {
    const { start, end, meta } = prepareRange(req);
    const completedInRange = { completedAt: { gte: start, lte: end } };
    const createdInRange = { createdAt: { gte: start, lte: end } };

    // playCount/scanCount là bộ đếm cộng dồn all-time trên Game/ArCode (không tách được
    // theo khoảng thời gian) nên phần "top game/AR" giữ nguyên all-time, có ghi chú ở FE.
    const [
      topGames,
      topArCodes,
      ratingGroups,
      wishlistGroups,
      reviewCount,
      gameResultsAgg,
    ] = await Promise.all([
      prisma.game.findMany({
        where: { isActive: true },
        orderBy: { playCount: "desc" },
        take: 8,
        select: {
          title: true,
          playCount: true,
          gameType: true,
          difficulty: true,
          book: { select: { title: true } },
        },
      }),
      prisma.arCode.findMany({
        where: { isActive: true },
        orderBy: { scanCount: "desc" },
        take: 8,
        select: {
          label: true,
          scanCount: true,
          book: { select: { title: true } },
        },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { isVisible: true, ...createdInRange },
        _count: { _all: true },
      }),
      prisma.wishlist.groupBy({
        by: ["bookId"],
        where: createdInRange,
        _count: { _all: true },
        orderBy: { _count: { bookId: "desc" } },
        take: 8,
      }),
      prisma.review.count({ where: { isVisible: true, ...createdInRange } }),
      prisma.gameResult.aggregate({
        where: completedInRange,
        _count: { _all: true },
        _avg: { score: true, durationSeconds: true },
      }),
    ]);

    const readingRows = await prisma.childActivityLog.groupBy({
      by: ["bookId"],
      where: { bookId: { not: null }, ...createdInRange },
      _sum: { minutes: true },
      _count: { _all: true },
      orderBy: { _sum: { minutes: "desc" } },
      take: 8,
    });
    const readingBookIds = readingRows.map((r) => r.bookId).filter(Boolean);
    const readingBooks = readingBookIds.length
      ? await prisma.book.findMany({
          where: { id: { in: readingBookIds } },
          select: { id: true, title: true },
        })
      : [];
    const readingBookMap = new Map(readingBooks.map((b) => [b.id, b.title]));
    const topReadBooks = readingRows.map((r) => ({
      title: readingBookMap.get(r.bookId) ?? "Không rõ",
      minutes: r._sum.minutes ?? 0,
      sessions: r._count._all,
    }));

    const totalRatingSum = ratingGroups.reduce(
      (s, g) => s + g.rating * g._count._all,
      0,
    );
    const avgRating =
      reviewCount > 0
        ? Math.round((totalRatingSum / reviewCount) * 10) / 10
        : 0;
    const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: ratingGroups.find((g) => g.rating === star)?._count._all ?? 0,
    }));

    const wishlistBookIds = wishlistGroups.map((g) => g.bookId);
    const wishlistBooks = wishlistBookIds.length
      ? await prisma.book.findMany({
          where: { id: { in: wishlistBookIds } },
          select: { id: true, title: true },
        })
      : [];
    const wishlistBookMap = new Map(wishlistBooks.map((b) => [b.id, b.title]));
    const topWishlistBooks = wishlistGroups.map((g) => ({
      title: wishlistBookMap.get(g.bookId) ?? "Không rõ",
      count: g._count._all,
    }));

    return res.json({
      success: true,
      data: {
        meta,
        stats: {
          totalReviews: reviewCount,
          avgRating,
          totalGamePlays: gameResultsAgg._count._all,
          avgGameScore: Math.round(gameResultsAgg._avg.score ?? 0),
          avgGameDurationSeconds: Math.round(
            gameResultsAgg._avg.durationSeconds ?? 0,
          ),
        },
        topGames,
        topArCodes,
        topReadBooks,
        ratingBreakdown,
        topWishlistBooks,
      },
    });
  } catch (err) {
    console.error("[getDashboardContent]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/* ═══════════════════════════ TAB: GIA ĐÌNH (TRẺ EM) ═══════════════════════════ */
exports.getDashboardFamily = async (req, res) => {
  try {
    const { start, end, meta } = prepareRange(req);
    const createdInRange = { createdAt: { gte: start, lte: end } };

    const [children, requestGroups, auditGroups, gardenAgg, mostActiveRows] =
      await Promise.all([
        prisma.childProfile.findMany({
          where: { isActive: true, ...createdInRange },
          select: { dob: true, dailyLimitMinutes: true },
        }),
        prisma.childBookRequest.groupBy({
          by: ["status"],
          where: createdInRange,
          _count: { _all: true },
        }),
        prisma.childAuditLog.groupBy({
          by: ["type"],
          where: createdInRange,
          _count: { _all: true },
          orderBy: { _count: { type: "desc" } },
          take: 8,
        }),
        prisma.childGarden.aggregate({
          _avg: { forestLevel: true, currentStreak: true, longestStreak: true },
          _count: { _all: true },
        }),
        prisma.childActivityLog.groupBy({
          by: ["childId"],
          where: createdInRange,
          _sum: { minutes: true },
          orderBy: { _sum: { minutes: "desc" } },
          take: 8,
        }),
      ]);

    const AGE_BUCKETS = [
      { label: "0-4 tuổi", min: 0, max: 4 },
      { label: "5-7 tuổi", min: 5, max: 7 },
      { label: "8-10 tuổi", min: 8, max: 10 },
      { label: "11-13 tuổi", min: 11, max: 13 },
      { label: "14-17 tuổi", min: 14, max: 17 },
    ];
    const ageBreakdown = AGE_BUCKETS.map((b) => ({ name: b.label, value: 0 }));
    let totalDailyLimit = 0;
    for (const c of children) {
      const age = calculateAge(c.dob);
      const idx = AGE_BUCKETS.findIndex((b) => age >= b.min && age <= b.max);
      if (idx >= 0) ageBreakdown[idx].value += 1;
      totalDailyLimit += c.dailyLimitMinutes ?? 0;
    }
    const avgDailyLimitMinutes = children.length
      ? Math.round(totalDailyLimit / children.length)
      : 0;

    const REQUEST_LABEL = {
      PENDING: "Chờ duyệt",
      APPROVED: "Đã duyệt",
      DECLINED: "Từ chối",
    };
    const bookRequestBreakdown = requestGroups.map((g) => ({
      name: REQUEST_LABEL[g.status] ?? g.status,
      value: g._count._all,
    }));

    const auditTypeBreakdown = auditGroups.map((g) => ({
      type: g.type,
      count: g._count._all,
    }));

    const childIds = mostActiveRows.map((r) => r.childId);
    const childProfiles = childIds.length
      ? await prisma.childProfile.findMany({
          where: { id: { in: childIds } },
          select: { id: true, name: true, avatarEmoji: true },
        })
      : [];
    const childMap = new Map(childProfiles.map((c) => [c.id, c]));
    const mostActiveChildren = mostActiveRows.map((r) => ({
      name: childMap.get(r.childId)?.name ?? "Không rõ",
      emoji: childMap.get(r.childId)?.avatarEmoji ?? "🦊",
      minutes: r._sum.minutes ?? 0,
    }));

    return res.json({
      success: true,
      data: {
        meta,
        stats: {
          totalActiveChildren: children.length,
          avgDailyLimitMinutes,
          avgForestLevel:
            Math.round((gardenAgg._avg.forestLevel ?? 0) * 10) / 10,
          avgCurrentStreak:
            Math.round((gardenAgg._avg.currentStreak ?? 0) * 10) / 10,
          avgLongestStreak:
            Math.round((gardenAgg._avg.longestStreak ?? 0) * 10) / 10,
          totalGardens: gardenAgg._count._all,
        },
        ageBreakdown,
        bookRequestBreakdown,
        auditTypeBreakdown,
        mostActiveChildren,
      },
    });
  } catch (err) {
    console.error("[getDashboardFamily]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/* ═══════════════════════════ TAB: HỖ TRỢ (TICKET) ═══════════════════════════ */
exports.getDashboardSupport = async (req, res) => {
  try {
    const { start, end, bucket, keys, meta } = prepareRange(req);
    const createdInRange = { createdAt: { gte: start, lte: end } };

    const [statusGroups, subjectGroups, recentTickets, repliesAgg] =
      await Promise.all([
        prisma.ticket.groupBy({
          by: ["status"],
          where: createdInRange,
          _count: { _all: true },
        }),
        prisma.ticket.groupBy({
          by: ["subject"],
          where: createdInRange,
          _count: { _all: true },
        }),
        prisma.ticket.findMany({
          where: createdInRange,
          take: 6,
          orderBy: { createdAt: "desc" },
          select: {
            code: true,
            name: true,
            subject: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.ticketReply.aggregate({
          where: { ticket: createdInRange },
          _count: { _all: true },
        }),
      ]);

    const STATUS_LABEL = {
      NEW: "Mới",
      IN_PROGRESS: "Đang xử lý",
      RESOLVED: "Đã xử lý",
      CLOSED: "Đã đóng",
    };
    const SUBJECT_LABEL = {
      PRODUCT_ADVICE: "Tư vấn sản phẩm",
      BUSINESS: "Hợp tác kinh doanh",
      TECHNICAL_SUPPORT: "Hỗ trợ kỹ thuật",
      FEEDBACK: "Phản hồi / Góp ý",
      OTHER: "Khác",
    };

    const statusBreakdown = statusGroups.map((g) => ({
      name: STATUS_LABEL[g.status] ?? g.status,
      status: g.status,
      value: g._count._all,
    }));
    const subjectBreakdown = subjectGroups.map((g) => ({
      name: SUBJECT_LABEL[g.subject] ?? g.subject,
      value: g._count._all,
    }));

    const totalTickets = statusGroups.reduce((s, g) => s + g._count._all, 0);
    const openTickets =
      (statusGroups.find((g) => g.status === "NEW")?._count._all ?? 0) +
      (statusGroups.find((g) => g.status === "IN_PROGRESS")?._count._all ?? 0);

    const ticketRows = await prisma.$queryRaw`
      SELECT date_trunc(${bucket}, "createdAt") AS bucket, COUNT(*)::int AS count
      FROM "Ticket"
      WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
      GROUP BY 1 ORDER BY 1
    `;
    const newTicketsChart = fillBucketChart(ticketRows, keys, bucket, [
      "count",
    ]);

    const avgRepliesPerTicket =
      totalTickets > 0
        ? Math.round((repliesAgg._count._all / totalTickets) * 10) / 10
        : 0;

    return res.json({
      success: true,
      data: {
        meta,
        stats: {
          totalTickets,
          openTickets,
          resolvedTickets:
            statusGroups.find((g) => g.status === "RESOLVED")?._count._all ?? 0,
          avgRepliesPerTicket,
        },
        statusBreakdown,
        subjectBreakdown,
        newTicketsChart,
        recentTickets: recentTickets.map((t) => ({
          ...t,
          statusLabel: STATUS_LABEL[t.status] ?? t.status,
          subjectLabel: SUBJECT_LABEL[t.subject] ?? t.subject,
        })),
      },
    });
  } catch (err) {
    console.error("[getDashboardSupport]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
