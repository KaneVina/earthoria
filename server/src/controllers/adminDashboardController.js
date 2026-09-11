const prisma = require("../config/db");
const { resolveTierBySpend } = require("../utils/loyaltyTier");
const { calculateAge } = require("../utils/age");

const SUCCESSFUL_ORDER_STATUSEpS = [
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
  "COMPLETED",
];

// Sinh dãy N ngày gần nhất (bao gồm hôm nay), trả về mảng key "YYYY-MM-DD" theo thứ tự tăng dần
function lastNDaysKeys(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    out.push(d);
  }
  return out;
}

const WEEKDAY_LABEL = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function fillDailyChart(
  rows,
  days,
  { dateField = "day", valueField = "count", labelWithWeekday = true } = {},
) {
  const map = new Map(
    rows.map((r) => [new Date(r[dateField]).toISOString().slice(0, 10), r]),
  );
  return days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    const row = map.get(key);
    return {
      day: labelWithWeekday
        ? WEEKDAY_LABEL[d.getDay()]
        : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      date: key,
      [valueField]: row ? Number(row[valueField]) : 0,
    };
  });
}

// Phân loại User-Agent thô thành nhóm thiết bị, chỉ để hiển thị biểu đồ, không cần chính xác tuyệt đối
function classifyDevice(ua) {
  if (!ua) return "Không rõ";
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return "Tablet";
  if (/mobile|iphone|android/.test(s)) return "Di động";
  if (/windows|macintosh|linux/.test(s)) return "Máy tính";
  return "Khác";
}

/*   TAB: NGƯỜI DÙNG   */
exports.getDashboardUsers = async (req, res) => {
  try {
    const now = new Date();

    // Người dùng mới 30 ngày gần nhất
    const rangeStart30 = new Date(now);
    rangeStart30.setDate(now.getDate() - 29);
    rangeStart30.setHours(0, 0, 0, 0);

    // Tăng trưởng người dùng theo tháng (12 tháng gần nhất)
    const rangeStart12m = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Hoạt động đăng nhập 7 ngày gần nhất
    const rangeStart7 = new Date(now);
    rangeStart7.setDate(now.getDate() - 6);
    rangeStart7.setHours(0, 0, 0, 0);

    // Gộp TẤT CẢ truy vấn độc lập vào 1 Promise.all duy nhất (trước đây là
    // 1 batch nhỏ rồi tới ~7 await nối tiếp phía sau, mỗi cái 1 round-trip
    // riêng tới DB -> cộng dồn lại rất chậm mỗi lần mở/quay lại tab).
    const [
      roleGroups,
      genderGroups,
      activeCount,
      inactiveCount,
      totalChildren,
      lockedChildren,
      newUsersRows,
      growthRows,
      cumulativeBefore,
      provinceGroups,
      loginRows,
      recentTokens,
      spendByUser,
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
      prisma.$queryRaw`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
        FROM "User"
        WHERE "createdAt" >= ${rangeStart30} AND role = 'CUSTOMER'
        GROUP BY 1 ORDER BY 1
      `,
      prisma.$queryRaw`
        SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::int AS count
        FROM "User"
        WHERE "createdAt" >= ${rangeStart12m} AND role = 'CUSTOMER'
        GROUP BY 1 ORDER BY 1
      `,
      prisma.user.count({
        where: { role: "CUSTOMER", createdAt: { lt: rangeStart12m } },
      }),
      // Top tỉnh/thành theo số địa chỉ đã lưu - đại diện gần đúng cho phân bố địa lý khách hàng
      prisma.address.groupBy({
        by: ["province"],
        _count: { _all: true },
        orderBy: { _count: { province: "desc" } },
        take: 8,
      }),
      // Hoạt động đăng nhập (proxy qua RefreshToken được tạo mới = 1 lượt đăng nhập)
      prisma.$queryRaw`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
        FROM "RefreshToken"
        WHERE "createdAt" >= ${rangeStart7}
        GROUP BY 1 ORDER BY 1
      `,
      // Phân loại thiết bị đăng nhập gần đây (mẫu 500 phiên gần nhất)
      prisma.refreshToken.findMany({
        take: 500,
        orderBy: { createdAt: "desc" },
        select: { userAgent: true },
      }),
      // Phân bổ hạng thành viên (Vùng Đất) theo tổng chi tiêu các đơn thành công
      prisma.order.groupBy({
        by: ["userId"],
        where: { status: { in: SUCCESSFUL_ORDER_STATUSES } },
        _sum: { total: true },
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

    const newUsersChart30d = fillDailyChart(newUsersRows, lastNDaysKeys(30), {
      labelWithWeekday: false,
    });

    const growthMap = new Map(
      growthRows.map((r) => [
        `${r.month.getFullYear()}-${r.month.getMonth() + 1}`,
        r.count,
      ]),
    );
    let cumulative = cumulativeBefore;
    const userGrowthChart = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const added = growthMap.get(key) ?? 0;
      cumulative += added;
      return { month: `T${d.getMonth() + 1}`, new: added, total: cumulative };
    });

    const topProvinces = provinceGroups.map((g) => ({
      name: g.province,
      count: g._count._all,
    }));

    const loginActivityChart = fillDailyChart(loginRows, lastNDaysKeys(7));

    const deviceMap = new Map();
    for (const t of recentTokens) {
      const key = classifyDevice(t.userAgent);
      deviceMap.set(key, (deviceMap.get(key) ?? 0) + 1);
    }
    const deviceBreakdown = [...deviceMap.entries()].map(([name, value]) => ({
      name,
      value,
    }));

    const tierMap = new Map();
    for (const row of spendByUser) {
      const tier = resolveTierBySpend(row._sum.total ?? 0);
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

    return res.json({
      success: true,
      data: {
        stats: {
          totalCustomers: activeCount + inactiveCount,
          activeCustomers: activeCount,
          inactiveCustomers: inactiveCount,
          totalChildren,
          lockedChildren,
        },
        roleBreakdown,
        genderBreakdown,
        newUsersChart30d,
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

/*   TAB: KINH DOANH   */
exports.getDashboardSales = async (req, res) => {
  try {
    const now = new Date();
    const rangeStart30 = new Date(now);
    rangeStart30.setDate(now.getDate() - 29);
    rangeStart30.setHours(0, 0, 0, 0);

    const [
      paymentGroups,
      formatGroups,
      cancelledCount,
      refundedCount,
      cartsWithItems,
      couponsAgg,
      dailyRows,
      paidItems,
      topCoupons,
    ] = await Promise.all([
      prisma.order.groupBy({
        by: ["paymentMethod"],
        where: { paymentStatus: "PAID" },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.groupBy({
        by: ["isDigital"],
        where: { paymentStatus: "PAID" },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
      prisma.order.count({ where: { status: "REFUNDED" } }),
      prisma.cart.count({ where: { items: { some: {} } } }),
      prisma.coupon.aggregate({
        _sum: { usedCount: true },
        _count: { _all: true },
      }),
      // Đơn hàng & doanh thu 30 ngày gần nhất
      prisma.$queryRaw`
        SELECT date_trunc('day', "createdAt") AS day,
               COUNT(*)::int AS count,
               COALESCE(SUM(total) FILTER (WHERE "paymentStatus" = 'PAID'), 0)::float AS revenue
        FROM "Order"
        WHERE "createdAt" >= ${rangeStart30}
        GROUP BY 1 ORDER BY 1
      `,
      // Top danh mục theo SỐ ĐƠN (khác với tab tổng quan đang tính theo doanh thu)
      prisma.orderItem.findMany({
        where: { order: { paymentStatus: "PAID" } },
        select: {
          quantity: true,
          variant: {
            select: {
              book: { select: { category: { select: { name: true } } } },
            },
          },
        },
      }),
      // Top mã giảm giá dùng nhiều nhất
      prisma.coupon.findMany({
        orderBy: { usedCount: "desc" },
        take: 6,
        select: {
          code: true,
          type: true,
          value: true,
          usedCount: true,
          usageLimit: true,
        },
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

    const ordersChart30d = lastNDaysKeys(30).map((d) => {
      const key = d.toISOString().slice(0, 10);
      const row = dailyRows.find(
        (r) => new Date(r.day).toISOString().slice(0, 10) === key,
      );
      return {
        day: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        orders: row?.count ?? 0,
        revenue: row ? Math.round((row.revenue / 1_000_000) * 10) / 10 : 0,
      };
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

    // Ước lượng tỉ lệ bỏ giỏ hàng: số giỏ có sản phẩm / (giỏ có sản phẩm + đơn PAID)
    const cartAbandonmentRate =
      cartsWithItems + totalPaidOrders > 0
        ? Math.round(
            (cartsWithItems / (cartsWithItems + totalPaidOrders)) * 1000,
          ) / 10
        : 0;

    return res.json({
      success: true,
      data: {
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
        ordersChart30d,
        topCategoriesByOrders,
        topCoupons,
      },
    });
  } catch (err) {
    console.error("[getDashboardSales]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/*   TAB: NỘI DUNG   */
exports.getDashboardContent = async (req, res) => {
  try {
    const [
      topGames,
      topArCodes,
      ratingGroups,
      wishlistGroups,
      reviewCount,
      gameResultsAgg,
      readingRows,
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
        where: { isVisible: true },
        _count: { _all: true },
      }),
      prisma.wishlist.groupBy({
        by: ["bookId"],
        _count: { _all: true },
        orderBy: { _count: { bookId: "desc" } },
        take: 8,
      }),
      prisma.review.count({ where: { isVisible: true } }),
      prisma.gameResult.aggregate({
        _count: { _all: true },
        _avg: { score: true, durationSeconds: true },
      }),
      // Đọc ebook: dùng ChildActivityLog (nhật ký phiên đọc/AR của trẻ) làm
      // nguồn dữ liệu thật. Độc lập với 6 query trên nên gộp chung vào đây,
      // chỉ có readingBooks bên dưới mới thực sự cần đợi readingRows xong
      // (vì cần lấy được list bookId trước).
      prisma.childActivityLog.groupBy({
        by: ["bookId"],
        where: { bookId: { not: null } },
        _sum: { minutes: true },
        _count: { _all: true },
        orderBy: { _sum: { minutes: "desc" } },
        take: 8,
      }),
    ]);

    // Đọc ebook: dùng ChildActivityLog (nhật ký phiên đọc/AR của trẻ) làm nguồn dữ liệu thật
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

    // Rating trung bình + phân bổ 1-5 sao
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

    // Wishlist: gắn tên sách
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

/*   TAB: GIA ĐÌNH (TRẺ EM)   */
exports.getDashboardFamily = async (req, res) => {
  try {
    const [children, requestGroups, auditGroups, gardenAgg, mostActiveRows] =
      await Promise.all([
        prisma.childProfile.findMany({
          where: { isActive: true },
          select: { dob: true, dailyLimitMinutes: true },
        }),
        prisma.childBookRequest.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
        prisma.childAuditLog.groupBy({
          by: ["type"],
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
          _sum: { minutes: true },
          orderBy: { _sum: { minutes: "desc" } },
          take: 8,
        }),
      ]);

    // Nhóm tuổi
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

    // Trẻ hoạt động nhiều nhất (theo tổng số phút đọc/xem AR)
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

/*   TAB: HỖ TRỢ (TICKET)   */
exports.getDashboardSupport = async (req, res) => {
  try {
    const now = new Date();
    const rangeStart7 = new Date(now);
    rangeStart7.setDate(now.getDate() - 6);
    rangeStart7.setHours(0, 0, 0, 0);

    const [statusGroups, subjectGroups, recentTickets, repliesAgg, ticketRows] =
      await Promise.all([
        prisma.ticket.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.ticket.groupBy({ by: ["subject"], _count: { _all: true } }),
        prisma.ticket.findMany({
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
        prisma.ticketReply.aggregate({ _count: { _all: true } }),
        // Ticket mới 7 ngày gần nhất - độc lập với 4 query trên nên gộp chung
        prisma.$queryRaw`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
        FROM "Ticket"
        WHERE "createdAt" >= ${rangeStart7}
        GROUP BY 1 ORDER BY 1
      `,
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

    const newTicketsChart = fillDailyChart(ticketRows, lastNDaysKeys(7));

    const avgRepliesPerTicket =
      totalTickets > 0
        ? Math.round((repliesAgg._count._all / totalTickets) * 10) / 10
        : 0;

    return res.json({
      success: true,
      data: {
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
