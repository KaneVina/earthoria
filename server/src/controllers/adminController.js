const prisma = require("../config/db");
const { generateProductCode } = require("../utils/generateProductCode");
const { getOrderCode } = require("./orderController");
const { groqCompleteJSON } = require("../services/groqClient");
const bcrypt = require("bcryptjs");
const {
  sendAccountProvisionedEmail,
  sendAccountLockedEmail,
  sendAccountUnlockedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
} = require("../services/emailService");
const {
  resolveTierBySpend,
  buildLoyaltyProfile,
} = require("../utils/loyaltyTier");

// Trả về thông tin hạng rút gọn (đủ cho hiển thị danh sách) từ 1 mức chi tiêu.
const buildTierSummary = (spend) => {
  const tier = resolveTierBySpend(spend);
  return {
    rank: tier.rank,
    roman: tier.roman,
    name: tier.name,
    image: tier.image,
    emoji: tier.emoji,
    color: tier.color,
    colorSoft: tier.colorSoft,
  };
};

// Gửi email không được phép làm hỏng/làm chậm thao tác admin — luôn tự bắt lỗi, chỉ log lại.
const sendOrderEmailSafe = (sendFn, payload) => {
  sendFn(payload).catch((err) => {
    console.error(
      `[adminController] Gửi email thất bại (${sendFn.name}):`,
      err,
    );
  });
};
const { uploadGlbFile } = require("../services/catboxService");
// const { uploadGlbFile } = require("../services/cloudinaryUploadService");

/* Helpers*/
const CHART_COLORS = {
  PENDING: "#eda100",
  CONFIRMED: "#2a78d6",
  SHIPPING: "#4a3aa7",
  DELIVERED: "#4a9e3f",
  COMPLETED: "#0d3330",
  CANCELLED: "#e34948",
  REFUNDED: "#c9184a", // khác màu với CANCELLED (đỏ) để phân biệt trên biểu đồ Phân bổ đơn hàng
};

const CATEGORY_COLORS = [
  "#0D3330",
  "#2a78d6",
  "#eda100",
  "#4a3aa7",
  "#4a9e3f",
  "#e34948",
  "#8a9990",
];
const ROLE_CHAR = { CUSTOMER: "C", DEALER: "D", ADMIN: "A", STAFF: "S" };

const STATUS_LABEL = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Vận chuyển",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy đơn",
  REFUNDED: "Hoàn tiền",
};
function generateRandomPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*_-+=";
  const all = upper + lower + digits + special;
  const length = 8 + Math.floor(Math.random() * 9); // 8..16

  const chars = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = chars.length; i < length; i++) {
    chars.push(all[Math.floor(Math.random() * all.length)]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
/* helper: tính thời gian tương đối */
function formatRelativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

/* Schema dùng UNPAID, frontend expect PENDING → map lại */
function mapPaymentStatus(status) {
  if (status === "UNPAID") return "PENDING";
  return status;
}

/* USER CODE GENERATION */
const RAND_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomStr(len) {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += RAND_CHARS[Math.floor(Math.random() * RAND_CHARS.length)];
  }
  return s;
}

async function generateUserCode(role, date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  const key = `${date.getFullYear()}${mm}${dd}`;

  const record = await prisma.userCodeSeq.upsert({
    where: { date: key },
    update: { seq: { increment: 1 } },
    create: { date: key, seq: 1 },
  });

  const seq = String(record.seq).padStart(3, "0");
  const rand = randomStr(2);
  const rc = ROLE_CHAR[role] ?? "C";

  return `ETR${rc}${mm}${dd}${yy}${seq}${rand}`;
}

async function backfillUserCodes() {
  const users = await prisma.user.findMany({
    where: { userCode: null },
    select: { id: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  for (const user of users) {
    const code = await generateUserCode(user.role, user.createdAt);
    await prisma.user.update({
      where: { id: user.id },
      data: { userCode: code },
    });
  }

  return users.length;
}

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();

    const [totalUsers, totalBooks, totalOrders, revenueAgg] = await Promise.all(
      [
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.book.count({ where: { isActive: true } }),
        prisma.order.count(),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { paymentStatus: "PAID" },
        }),
      ],
    );

    const rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const revenueRows = await prisma.$queryRaw`
  SELECT
    date_trunc('month', "createdAt") AS month,
    COALESCE(SUM(total), 0)::float   AS revenue,
    COUNT(*)::int                   AS orders
  FROM "Order"
  WHERE "createdAt" >= ${rangeStart}
    AND "paymentStatus" = 'PAID'
  GROUP BY 1
  ORDER BY 1
`;

    const revenueMap = new Map(
      revenueRows.map((r) => [
        `${r.month.getFullYear()}-${r.month.getMonth() + 1}`,
        r,
      ]),
    );

    const revenueChart = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const row = revenueMap.get(key);
      return {
        month: `T${d.getMonth() + 1}`,
        revenue: Math.round(((row?.revenue ?? 0) / 1_000_000) * 10) / 10,
        orders: row?.orders ?? 0,
      };
    });

    const statusGroups = await prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const totalForPct =
      statusGroups.reduce((s, g) => s + g._count._all, 0) || 1;
    const orderStatusChart = statusGroups.map((g) => ({
      name: STATUS_LABEL[g.status] ?? g.status,
      value: Math.round((g._count._all / totalForPct) * 100),
      color: CHART_COLORS[g.status] ?? "#999",
    }));

    // Sách bán chạy + doanh thu theo danh mục — cùng dùng 1 query OrderItem
    // của tháng này (đã sửa: OrderItem không còn bookId trực tiếp, phải lấy
    // qua variant.bookId / variant.book.categoryId)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPaidItems = await prisma.orderItem.findMany({
      where: {
        order: { createdAt: { gte: monthStart }, paymentStatus: "PAID" },
      },
      select: {
        quantity: true,
        price: true,
        variant: {
          select: {
            bookId: true,
            book: {
              select: {
                title: true,
                categoryId: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    // PHYSICAL và DIGITAL, không muốn hiện trùng 2 dòng cho cùng 1 sách.
    const bookSoldMap = new Map();
    for (const item of monthlyPaidItems) {
      const bookId = item.variant.bookId;
      const prev = bookSoldMap.get(bookId) ?? {
        title: item.variant.book.title,
        sold: 0,
      };
      prev.sold += item.quantity;
      bookSoldMap.set(bookId, prev);
    }
    const topBooks = [...bookSoldMap.values()]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const recentOrders = await prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { quantity: true, price: true } },
      },
    });

    const stockVariants = await prisma.bookVariant.findMany({
      where: {
        isActive: true,
        isUnlimitedStock: false,
        book: { isActive: true },
      },
      select: {
        bookId: true,
        stock: true,
        book: { select: { title: true } },
      },
    });
    const bookStockMap = new Map();
    for (const v of stockVariants) {
      const prev = bookStockMap.get(v.bookId) ?? {
        id: v.bookId,
        title: v.book.title,
        stock: 0,
      };
      prev.stock += v.stock;
      bookStockMap.set(v.bookId, prev);
    }
    const lowStockBooks = [...bookStockMap.values()]
      .filter((b) => b.stock <= 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10);

    const newUsersRangeStart = new Date(now);
    newUsersRangeStart.setDate(now.getDate() - 6);
    newUsersRangeStart.setHours(0, 0, 0, 0);

    const newUsersRows = await prisma.$queryRaw`
      SELECT
        date_trunc('day', "createdAt") AS day,
        COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= ${newUsersRangeStart}
        AND role = 'CUSTOMER'
      GROUP BY 1
      ORDER BY 1
    `;
    const newUsersMap = new Map(
      newUsersRows.map((r) => [r.day.toISOString().slice(0, 10), r.count]),
    );
    const WEEKDAY_LABEL = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const newUsersChart = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(newUsersRangeStart);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return {
        day: WEEKDAY_LABEL[d.getDay()],
        count: newUsersMap.get(key) ?? 0,
      };
    });

    const categoryRevenueMap = new Map();
    for (const item of monthlyPaidItems) {
      const key = item.variant.book.categoryId;
      const prev = categoryRevenueMap.get(key) ?? {
        name: item.variant.book.category?.name ?? "Chưa phân loại",
        revenue: 0,
      };
      prev.revenue += item.price * item.quantity;
      categoryRevenueMap.set(key, prev);
    }
    const categoryRevenueChart = [...categoryRevenueMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .map((c, i) => ({
        name: c.name,
        value: Math.round((c.revenue / 1_000_000) * 10) / 10,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }));

    const [latestOrders, latestUsers] = await Promise.all([
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, total: true, createdAt: true },
      }),
      prisma.user.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        where: { role: "CUSTOMER" },
        select: { email: true, createdAt: true },
      }),
    ]);

    const activityRaw = [
      ...latestOrders.map((o) => ({
        time: o.createdAt,
        type:
          o.status === "DELIVERED" || o.status === "COMPLETED"
            ? "green"
            : o.status === "CANCELLED"
              ? "red"
              : "blue",
        text: `Đơn hàng #${getOrderCode(o)} — ${STATUS_LABEL[o.status] ?? o.status}`,
      })),
      ...latestUsers.map((u) => ({
        time: u.createdAt,
        type: "amber",
        text: `Người dùng mới đăng ký: ${u.email}`,
      })),
    ];
    const activity = activityRaw
      .sort((a, b) => b.time - a.time)
      .slice(0, 6)
      .map((item) => ({
        type: item.type,
        text: item.text,
        time: formatRelativeTime(item.time),
      }));

    return res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalBooks,
          totalOrders,
          revenue: revenueAgg._sum.total ?? 0,
        },
        revenueChart,
        orderStatusChart,
        topBooks,
        recentOrders,
        activity,
        lowStockBooks,
        newUsersChart,
        categoryRevenueChart,
      },
    });
  } catch (err) {
    console.error("[getDashboard]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/* PRODUCTS (books) — 1 Book có thể có 1-2 BookVariant(PHYSICAL / DIGITAL), mỗi variant có giá/tồn kho/mã riêng. */
async function resolveAuthorIds(authorsInput) {
  if (!authorsInput) return [];
  const names = Array.isArray(authorsInput)
    ? authorsInput
    : String(authorsInput).split(",");
  const cleanNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))];

  const authors = await Promise.all(
    cleanNames.map((name) =>
      prisma.author.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  return authors.map((a) => a.id);
}
function normalizeThemes(themesInput) {
  if (themesInput === undefined) return undefined;
  const list = Array.isArray(themesInput)
    ? themesInput
    : String(themesInput || "").split(",");
  return [...new Set(list.map((t) => String(t).trim()).filter(Boolean))];
}

function withAuthorNames(book) {
  return {
    ...book,
    authors: (book.authors ?? []).map((ba) => ba.author.name),
  };
}

const VALID_FORMATS = ["PHYSICAL", "DIGITAL"];

function validateVariantsInput(variants) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return "Sách cần ít nhất 1 định dạng bán (Sách giấy hoặc Sách điện tử)";
  }
  const formats = variants.map((v) => v.format);
  if (formats.some((f) => !VALID_FORMATS.includes(f))) {
    return "Định dạng bán không hợp lệ";
  }
  if (new Set(formats).size !== formats.length) {
    return "Không thể chọn trùng định dạng bán cho cùng 1 sách";
  }
  for (const v of variants) {
    if (v.price === undefined || v.price === null || v.price === "") {
      return `Thiếu giá gốc cho định dạng ${v.format}`;
    }
  }
  return null;
}

async function createVariantsForBook(tx, bookId, variants) {
  for (const v of variants) {
    const productCode = await generateProductCode(tx);
    await tx.bookVariant.create({
      data: {
        bookId,
        format: v.format,
        productCode,
        unit: v.unit || "Cuốn",
        price: Number(v.price) || 0,
        salePrice: v.salePrice != null ? Number(v.salePrice) : null,
        dealerPrice: v.dealerPrice != null ? Number(v.dealerPrice) : null,
        stock: Number(v.stock) || 0,
        isUnlimitedStock: !!v.isUnlimitedStock,
        isActive: v.isActive !== false,
      },
    });
  }
}

/* Cập nhật variant có id (phải thuộc đúng sách), hoặc tạo mới nếu không có id */
async function upsertVariantsForBook(tx, bookId, variants) {
  for (const v of variants) {
    if (v.id) {
      const existing = await tx.bookVariant.findFirst({
        where: { id: v.id, bookId },
      });
      if (!existing) continue; // id không khớp / không thuộc sách này -> bỏ qua, không cho sửa nhầm
      await tx.bookVariant.update({
        where: { id: v.id },
        data: {
          price: Number(v.price) || 0,
          salePrice: v.salePrice != null ? Number(v.salePrice) : null,
          dealerPrice: v.dealerPrice != null ? Number(v.dealerPrice) : null,
          stock: Number(v.stock) || 0,
          unit: v.unit || existing.unit,
          isUnlimitedStock: !!v.isUnlimitedStock,
          isActive: v.isActive !== false,
        },
      });
    } else {
      const productCode = await generateProductCode(tx);
      await tx.bookVariant.create({
        data: {
          bookId,
          format: v.format,
          productCode,
          unit: v.unit || "Cuốn",
          price: Number(v.price) || 0,
          salePrice: v.salePrice != null ? Number(v.salePrice) : null,
          dealerPrice: v.dealerPrice != null ? Number(v.dealerPrice) : null,
          stock: Number(v.stock) || 0,
          isUnlimitedStock: !!v.isUnlimitedStock,
          isActive: v.isActive !== false,
        },
      });
    }
  }
}

const bookInclude = {
  category: { select: { id: true, name: true } },
  authors: { include: { author: true }, orderBy: { order: "asc" } },
  variants: { orderBy: { format: "asc" } },
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        ...bookInclude,
        arCodes: { orderBy: { createdAt: "asc" } },
        games: { orderBy: { createdAt: "asc" } },
        _count: { select: { reviews: true, arCodes: true, games: true } },
      },
    });

    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sách" });
    }

    return res.json({
      success: true,
      data: { ...withAuthorNames(book), isVisible: book.isActive },
    });
  } catch (err) {
    console.error("[getProductById]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12);
    const search = req.query.search?.trim() ?? "";

    const id = req.query.id?.trim() ?? "";
    const categoryId = req.query.categoryId?.trim() ?? "";
    const language = req.query.language?.trim() ?? "";
    const status = req.query.status?.trim() ?? "";
    const ageMin =
      req.query.ageMin !== undefined && req.query.ageMin !== ""
        ? parseInt(req.query.ageMin)
        : null;
    const ageMax =
      req.query.ageMax !== undefined && req.query.ageMax !== ""
        ? parseInt(req.query.ageMax)
        : null;

    const skip = (page - 1) * limit;

    const conditions = [];

    if (id) conditions.push({ id: { startsWith: id, mode: "insensitive" } });

    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { publisher: { contains: search, mode: "insensitive" } },
          {
            variants: {
              some: { productCode: { contains: search, mode: "insensitive" } },
            },
          },
        ],
      });
    }

    if (categoryId) conditions.push({ categoryId });
    if (language) conditions.push({ language });

    if (status === "active") conditions.push({ isActive: true });
    if (status === "inactive") conditions.push({ isActive: false });

    if (ageMin !== null)
      conditions.push({ OR: [{ ageMax: null }, { ageMax: { gte: ageMin } }] });
    if (ageMax !== null)
      conditions.push({ OR: [{ ageMin: null }, { ageMin: { lte: ageMax } }] });

    const where = conditions.length ? { AND: conditions } : {};

    const [products, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          ...bookInclude,
          _count: { select: { arCodes: true, games: true } },
        },
      }),
      prisma.book.count({ where }),
    ]);

    const mapped = products.map((p) => ({
      ...withAuthorNames(p),
      isVisible: p.isActive,
    }));

    return res.json({
      success: true,
      data: {
        products: mapped,
        total,
        totalPages: Math.ceil(total / limit),
        page,
      },
    });
  } catch (err) {
    console.error("[getProducts]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      isVisible,
      publisher,
      pages,
      language,
      authors,
      publishYear,
      dimensions,
      weightGrams,
      coverType,
      paperType,
      ageMin,
      ageMax,
      synopsis,
      themes,
      suitableFor,
      variants,
    } = req.body;

    if (!title || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (title, categoryId)",
      });
    }

    const variantError = validateVariantsInput(variants);
    if (variantError) {
      return res.status(400).json({ success: false, message: variantError });
    }

    const slugify = require("slugify");
    const slug = slugify(title, { lower: true, locale: "vi", strict: true });
    const existingSlug = await prisma.book.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    const authorIds = await resolveAuthorIds(authors);

    const bookId = await prisma.$transaction(async (tx) => {
      const created = await tx.book.create({
        data: {
          title,
          slug: finalSlug,
          description: description ?? null,
          categoryId,
          isActive: isVisible !== false,
          publisher: publisher ?? null,
          pages: pages ? Number(pages) : null,
          language: language ?? "VI",
          publishYear: publishYear ? Number(publishYear) : null,
          dimensions: dimensions ?? null,
          weightGrams: weightGrams ? Number(weightGrams) : null,
          coverType: coverType ?? null,
          paperType: paperType ?? null,
          ageMin: ageMin !== undefined && ageMin !== "" ? Number(ageMin) : null,
          ageMax: ageMax !== undefined && ageMax !== "" ? Number(ageMax) : null,
          synopsis: synopsis ?? null,
          themes: normalizeThemes(themes) ?? [],
          suitableFor: suitableFor ?? null,
          authors: {
            create: authorIds.map((authorId, i) => ({ authorId, order: i })),
          },
        },
      });
      await createVariantsForBook(tx, created.id, variants);
      return created.id;
    });

    const full = await prisma.book.findUnique({
      where: { id: bookId },
      include: bookInclude,
    });

    return res.status(201).json({
      success: true,
      data: { ...withAuthorNames(full), isVisible: full.isActive },
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ success: false, message: "Trùng định dạng bán cho sách này" });
    }
    console.error("[createProduct]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      categoryId,
      isVisible,
      publisher,
      pages,
      authors,
      language,
      publishYear,
      dimensions,
      weightGrams,
      coverType,
      paperType,
      ageMin,
      ageMax,
      synopsis,
      themes,
      suitableFor,
      variants,
    } = req.body;

    if (variants !== undefined) {
      const variantError = validateVariantsInput(variants);
      if (variantError) {
        return res.status(400).json({ success: false, message: variantError });
      }
    }

    let authorsUpdate;
    if (authors !== undefined) {
      const authorIds = await resolveAuthorIds(authors);
      authorsUpdate = {
        deleteMany: {},
        create: authorIds.map((authorId, i) => ({ authorId, order: i })),
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(categoryId !== undefined && { categoryId }),
          ...(isVisible !== undefined && { isActive: isVisible }),
          ...(publisher !== undefined && { publisher }),
          ...(pages !== undefined && { pages: pages ? Number(pages) : null }),
          ...(language !== undefined && { language }),
          ...(publishYear !== undefined && {
            publishYear: publishYear ? Number(publishYear) : null,
          }),
          ...(dimensions !== undefined && { dimensions }),
          ...(weightGrams !== undefined && {
            weightGrams: weightGrams ? Number(weightGrams) : null,
          }),
          ...(coverType !== undefined && { coverType }),
          ...(paperType !== undefined && { paperType }),
          ...(ageMin !== undefined && {
            ageMin: ageMin !== "" ? Number(ageMin) : null,
          }),
          ...(ageMax !== undefined && {
            ageMax: ageMax !== "" ? Number(ageMax) : null,
          }),
          ...(synopsis !== undefined && { synopsis: synopsis || null }),
          ...(themes !== undefined && { themes: normalizeThemes(themes) }),
          ...(suitableFor !== undefined && {
            suitableFor: suitableFor || null,
          }),
          ...(authorsUpdate && { authors: authorsUpdate }),
        },
      });

      if (variants !== undefined) {
        await upsertVariantsForBook(tx, id, variants);
      }
    });

    const book = await prisma.book.findUnique({
      where: { id },
      include: bookInclude,
    });

    return res.json({
      success: true,
      data: { ...withAuthorNames(book), isVisible: book.isActive },
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sách" });
    }
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ success: false, message: "Trùng định dạng bán cho sách này" });
    }
    console.error("[updateProduct]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/* POST /admin/products/:id/ai-draft-content */
exports.draftBookAiContent = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({
      where: { id },
      select: { id: true, title: true, description: true },
    });
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sách" });
    }

    const ebook = await prisma.ebook.findFirst({
      where: { bookId: id },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    });

    if (!ebook || !Array.isArray(ebook.pages) || ebook.pages.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Sách này chưa có sách điện tử (ebook) nào để AI đọc nội dung — hãy tạo ebook trước, hoặc tự nhập tay các trường bên dưới.",
      });
    }

    const pageTexts = ebook.pages
      .map((page, idx) => {
        const texts = (page.layers || [])
          .filter(
            (l) =>
              l &&
              l.type === "text" &&
              typeof l.text === "string" &&
              l.text.trim(),
          )
          .map((l) => l.text.trim());
        return texts.length ? `Trang ${idx + 1}: ${texts.join(" ")}` : null;
      })
      .filter(Boolean);

    if (pageTexts.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Các trang ebook chưa có nội dung chữ nào để AI đọc — hãy tự nhập tay bên dưới.",
      });
    }

    const fullText = pageTexts.join("\n").slice(0, 6000);

    const system =
      "Bạn là biên tập viên nội bộ của Earthoria — thương hiệu sách giáo dục tương tác cho trẻ 5–12 tuổi. Nhiệm vụ: đọc nội dung thô trích từ ebook rồi soạn NHÁP dữ liệu nội bộ để đội tư vấn dùng, KHÔNG phải để đăng nguyên văn công khai. Trả lời bằng tiếng Việt, CHỈ trả về đúng 1 JSON object theo schema được yêu cầu, không thêm chữ nào khác.";

    const user = `Tên sách: "${book.title}"
Mô tả ngắn hiện có: ${book.description || "(chưa có)"}

Nội dung thô trích từ các trang ebook:
"""
${fullText}
"""

Trả về JSON đúng schema:
{
  "synopsis": "Tóm tắt cốt truyện bằng 3-4 câu, giọng thân thiện, diễn đạt lại bằng lời văn riêng — KHÔNG chép nguyên câu chữ trong sách, KHÔNG tiết lộ đoạn kết/twist quan trọng",
  "themes": ["3-5 chủ đề/bài học chính, mỗi mục vài từ, ví dụ: Lòng dũng cảm"],
  "suitableFor": "1-2 câu gợi ý kiểu bé hoặc hoàn cảnh phù hợp đọc cuốn này"
}`;

    const draft = await groqCompleteJSON({
      system,
      user,
      temperature: 0.5,
      maxTokens: 500,
    });

    return res.json({
      success: true,
      data: {
        synopsis:
          typeof draft.synopsis === "string" ? draft.synopsis.trim() : "",
        themes: Array.isArray(draft.themes)
          ? [
              ...new Set(
                draft.themes.map((t) => String(t).trim()).filter(Boolean),
              ),
            ]
          : [],
        suitableFor:
          typeof draft.suitableFor === "string" ? draft.suitableFor.trim() : "",
      },
      message:
        "Đây là bản nháp do AI soạn từ nội dung ebook — vui lòng đọc lại và chỉnh sửa trước khi lưu.",
    });
  } catch (err) {
    if (err.code === "CONFIG_MISSING") {
      return res.status(503).json({
        success: false,
        message: "Server chưa cấu hình GROQ_API_KEY.",
      });
    }
    console.error("[draftBookAiContent]", err);
    return res.status(500).json({
      success: false,
      message: "AI soạn nháp thất bại, vui lòng thử lại hoặc nhập tay.",
    });
  }
};

/* DELETE /admin/products/:id/variants/:variantId — xóa 1 định dạng bán,
   không xóa cả sách. Không cho xóa nếu đó là định dạng cuối cùng còn lại. */
exports.deleteProductVariant = async (req, res) => {
  try {
    const { id, variantId } = req.params;

    const variant = await prisma.bookVariant.findFirst({
      where: { id: variantId, bookId: id },
    });
    if (!variant) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy định dạng bán này" });
    }

    const totalVariants = await prisma.bookVariant.count({
      where: { bookId: id },
    });
    if (totalVariants <= 1) {
      return res.status(400).json({
        success: false,
        message:
          "Sách phải có ít nhất 1 định dạng bán, không thể xóa định dạng cuối cùng",
      });
    }

    const [orderCount, inventoryImportCount] = await Promise.all([
      prisma.orderItem.count({ where: { variantId } }),
      prisma.inventoryImportItem.count({ where: { variantId } }),
    ]);

    if (orderCount > 0 || inventoryImportCount > 0) {
      if (variant.isActive) {
        await prisma.bookVariant.update({
          where: { id: variantId },
          data: { isActive: false },
        });
      }
      return res.status(409).json({
        success: false,
        softDeleted: true,
        message: `Không thể xóa vì định dạng này còn ${orderCount} đơn hàng đã mua${
          inventoryImportCount
            ? `, ${inventoryImportCount} phiếu nhập kho liên quan`
            : ""
        }. Đã chuyển sang trạng thái ngừng bán.`,
      });
    }

    await prisma.bookVariant.delete({ where: { id: variantId } });
    return res.json({ success: true, message: "Đã xóa định dạng bán" });
  } catch (err) {
    return serverError(res, err, "deleteProductVariant");
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sách" });
    }

    const [orderCount, arCodeCount, inventoryImportCount] = await Promise.all([
      prisma.orderItem.count({ where: { variant: { bookId: id } } }),
      prisma.arCode.count({ where: { bookId: id } }),
      prisma.inventoryImportItem.count({ where: { variant: { bookId: id } } }),
    ]);

    const blockers = [];
    if (orderCount > 0) blockers.push(`${orderCount} đơn hàng đã mua`);
    if (arCodeCount > 0) blockers.push(`${arCodeCount} mã AR đang liên kết`);
    if (inventoryImportCount > 0)
      blockers.push(`${inventoryImportCount} phiếu nhập kho liên quan`);

    if (blockers.length > 0) {
      if (book.isActive) {
        await prisma.book.update({ where: { id }, data: { isActive: false } });
      }
      return res.status(409).json({
        success: false,
        softDeleted: true,
        message: `Không thể xóa vì sách còn ${blockers.join(", ")}. Sách đã được chuyển sang trạng thái ngừng kinh doanh.`,
      });
    }

    await prisma.book.delete({ where: { id } });

    await deleteAllBookImages(book).catch((err) =>
      console.error(
        "[deleteProduct] Xóa ảnh Cloudinary thất bại, có thể còn rác:",
        err,
      ),
    );

    return res.json({ success: true, message: "Đã xóa sách vĩnh viễn" });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sách" });
    }

    if (err.code === "P2003") {
      console.error(
        "[deleteProduct] Chặn xóa do khóa ngoại chưa liệt kê ở trên:",
        err.meta?.field_name ?? err.meta,
      );
      try {
        await prisma.book.update({
          where: { id: req.params.id },
          data: { isActive: false },
        });
      } catch (_) {}
      return res.status(409).json({
        success: false,
        softDeleted: true,
        message:
          "Không thể xóa vì sách vẫn còn liên kết với dữ liệu khác trong hệ thống. Sách đã được chuyển sang trạng thái ngừng kinh doanh.",
      });
    }

    console.error("[deleteProduct]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/*  CATEGORIES*/
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { books: true } } },
    });
    return res.json({ success: true, data: categories });
  } catch (err) {
    console.error("[getCategories]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Tên danh mục là bắt buộc" });
    }

    const slugify = require("slugify");
    const slug = slugify(name, { lower: true, locale: "vi", strict: true });
    const existing = await prisma.category.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        description: description ?? null,
        image: image ?? null,
      },
    });

    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error("[createCategory]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.json({ success: true, data: category });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy danh mục" });
    }
    console.error("[updateCategory]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy danh mục" });
    }

    if (category._count.books > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Không thể xóa vì danh mục vẫn còn sách. Hãy chuyển sách sang danh mục khác trước.",
      });
    }

    await prisma.category.delete({ where: { id } });

    return res.json({ success: true, message: "Đã xóa danh mục" });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy danh mục" });
    }
    console.error("[deleteCategory]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/* ORDERS*/
// Payment status hiển thị ở FE dùng PENDING, nhưng DB lưu UNPAID (xem mapPaymentStatus) —
// khi filter theo paymentStatus phải đổi ngược PENDING -> UNPAID trước khi query.
const reverseMapPaymentStatus = (status) =>
  status === "PENDING" ? "UNPAID" : status;

const VALID_PAYMENT_METHODS = ["COD", "VNPAY", "MOMO", "BANKQR", "STRIPE"];
const VALID_PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "EXPIRED",
];

exports.getOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 15);
    const status = req.query.status?.trim();
    const search = req.query.search?.trim() ?? "";
    const paymentMethod = req.query.paymentMethod?.trim() ?? "";
    const paymentStatus = req.query.paymentStatus?.trim() ?? "";
    const dateFrom = req.query.dateFrom?.trim() ?? "";
    const dateTo = req.query.dateTo?.trim() ?? "";
    const totalMin =
      req.query.totalMin !== undefined && req.query.totalMin !== ""
        ? Number(req.query.totalMin)
        : null;
    const totalMax =
      req.query.totalMax !== undefined && req.query.totalMax !== ""
        ? Number(req.query.totalMax)
        : null;
    const skip = (page - 1) * limit;

    // Mã đơn KHÔNG phải cột lưu sẵn — sinh động từ createdAt + hash(id) (xem getOrderCode
    // trong orderController.js). Nên khi search đúng định dạng ODE-mmddyyXXX, phải:
    // 1) đọc ra mm/dd/yy để khoanh vùng đúng NGÀY tạo đơn, 2) lấy các đơn trong ngày đó,
    // 3) tính lại getOrderCode() cho từng đơn rồi so khớp chính xác trong JS.
    const orderCodeMatch = search.match(
      /^ODE-(\d{2})(\d{2})(\d{2})([A-Za-z0-9]{3})$/i,
    );

    let orderIdsFromCode = null; // null = người dùng không search theo mã đơn

    if (orderCodeMatch) {
      const [, mm, dd, yy] = orderCodeMatch;
      const month = parseInt(mm, 10);
      const day = parseInt(dd, 10);
      const year = 2000 + parseInt(yy, 10); // mã chỉ lưu 2 số cuối năm -> giả định 20xx

      const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
      // Chặn kiểu mm=13, dd=32 (Date sẽ tự "cuộn" sang tháng/ngày khác thay vì báo lỗi)
      const isRealDate =
        dayStart.getMonth() === month - 1 && dayStart.getDate() === day;

      if (isRealDate) {
        const candidates = await prisma.order.findMany({
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
          select: { id: true, createdAt: true },
        });
        orderIdsFromCode = candidates
          .filter((o) => getOrderCode(o).toUpperCase() === search.toUpperCase())
          .map((o) => o.id);
      } else {
        orderIdsFromCode = [];
      }
    }

    // Điều kiện search + filter (mã đơn/tên/email, phương thức TT, trạng thái TT, khoảng ngày,
    // khoảng tổng tiền) — tách riêng khỏi filter status vì statusCounts (đếm cho từng pill)
    // cần áp các điều kiện này nhưng KHÔNG áp status hiện tại.
    const searchConditions = [];
    if (orderIdsFromCode !== null) {
      searchConditions.push({ id: { in: orderIdsFromCode } });
    } else if (search) {
      searchConditions.push({
        user: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      });
    }

    if (paymentMethod && VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      searchConditions.push({ paymentMethod });
    }
    if (paymentStatus && VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      searchConditions.push({
        paymentStatus: reverseMapPaymentStatus(paymentStatus),
      });
    }

    if (dateFrom || dateTo) {
      const createdAtRange = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from)) {
          from.setHours(0, 0, 0, 0);
          createdAtRange.gte = from;
        }
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!isNaN(to)) {
          to.setHours(23, 59, 59, 999);
          createdAtRange.lte = to;
        }
      }
      if (Object.keys(createdAtRange).length) {
        searchConditions.push({ createdAt: createdAtRange });
      }
    }

    if (totalMin !== null || totalMax !== null) {
      const totalRange = {};
      if (totalMin !== null && !isNaN(totalMin)) totalRange.gte = totalMin;
      if (totalMax !== null && !isNaN(totalMax)) totalRange.lte = totalMax;
      if (Object.keys(totalRange).length) {
        searchConditions.push({ total: totalRange });
      }
    }

    const listConditions = status
      ? [{ status }, ...searchConditions]
      : searchConditions;
    const where = listConditions.length ? { AND: listConditions } : {};

    const [orders, total, statusGroups] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: {
            include: {
              variant: {
                include: {
                  book: { select: { title: true, coverImage: true } },
                },
              },
            },
          },
          address: {
            select: {
              fullName: true,
              phone: true,
              street: true,
              ward: true,
              district: true,
              province: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
      // Đếm theo từng trạng thái CHỈ áp search/filter, không áp status hiện tại — để pill nào
      // cũng hiện đúng số lượng khớp với các điều kiện đang lọc.
      prisma.order.groupBy({
        by: ["status"],
        where: searchConditions.length ? { AND: searchConditions } : {},
        _count: { _all: true },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count._all]),
    );

    const unpaidBankQrIds = orders
      .filter((o) => o.paymentMethod === "BANKQR" && o.paymentStatus !== "PAID")
      .map((o) => o.id);

    let mismatchByOrderId = {};
    if (unpaidBankQrIds.length > 0) {
      const mismatchTxns = await prisma.paymentTransaction.findMany({
        where: {
          orderId: { in: unpaidBankQrIds },
          gateway: "BANKQR",
          type: "IPN",
          message: { startsWith: "Sai số tiền" },
        },
        orderBy: { createdAt: "desc" },
      });
      for (const txn of mismatchTxns) {
        if (!mismatchByOrderId[txn.orderId]) {
          mismatchByOrderId[txn.orderId] = {
            transferredAmount: txn.amount,
            at: txn.createdAt,
          };
        }
      }
    }

    const mapped = orders.map((o) => ({
      ...o,
      paymentStatus: mapPaymentStatus(o.paymentStatus),
      paymentMismatch: mismatchByOrderId[o.id]
        ? { ...mismatchByOrderId[o.id], expectedAmount: o.total }
        : null,
      shippingAddress: o.address
        ? {
            name: o.address.fullName,
            phone: o.address.phone,
            address: `${o.address.street}, ${o.address.ward}, ${o.address.district}, ${o.address.province}`,
          }
        : null,
      items: o.items.map((item) => ({
        ...item,
        product: item.variant?.book,
        title: item.variant?.book?.title,
      })),
    }));

    return res.json({
      success: true,
      data: {
        orders: mapped,
        total,
        totalPages: Math.ceil(total / limit),
        page,
        statusCounts,
      },
    });
  } catch (err) {
    console.error("[getOrders]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        items: {
          include: {
            variant: {
              include: {
                book: { select: { title: true, coverImage: true } },
              },
            },
          },
        },
        address: {
          select: {
            fullName: true,
            phone: true,
            street: true,
            ward: true,
            district: true,
            province: true,
          },
        },
      },
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    // Hạng thành viên tính theo chi tiêu PAID + COMPLETED, đồng bộ với các chỗ khác
    const loyaltySpend = await prisma.order.aggregate({
      where: {
        userId: order.userId,
        paymentStatus: "PAID",
        status: "COMPLETED",
      },
      _sum: { total: true },
    });

    let paymentMismatch = null;
    if (order.paymentMethod === "BANKQR" && order.paymentStatus !== "PAID") {
      const mismatchTxn = await prisma.paymentTransaction.findFirst({
        where: {
          orderId: order.id,
          gateway: "BANKQR",
          type: "IPN",
          message: { startsWith: "Sai số tiền" },
        },
        orderBy: { createdAt: "desc" },
      });
      if (mismatchTxn) {
        paymentMismatch = {
          transferredAmount: mismatchTxn.amount,
          expectedAmount: order.total,
        };
      }
    }

    return res.json({
      success: true,
      data: {
        ...order,
        paymentStatus: mapPaymentStatus(order.paymentStatus),
        user: {
          ...order.user,
          tier: buildTierSummary(loyaltySpend._sum.total ?? 0),
        },
        paymentMismatch,
        shippingAddress: order.address
          ? {
              name: order.address.fullName,
              phone: order.address.phone,
              address: `${order.address.street}, ${order.address.ward}, ${order.address.district}, ${order.address.province}`,
            }
          : null,
        items: order.items.map((item) => ({
          ...item,
          product: item.variant?.book,
          title: item.variant?.book?.title,
        })),
      },
    });
  } catch (err) {
    console.error("[getOrderById]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;

    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "SHIPPING",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
      "REFUNDED",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      select: { status: true, isDigital: true },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }
    if (existing.isDigital && ["SHIPPING", "DELIVERED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng sách điện tử không có bước vận chuyển",
      });
    }
    const isNewTransition = existing.status !== status;

    const extraData =
      status === "DELIVERED" || status === "COMPLETED"
        ? { paymentStatus: "PAID" }
        : {};

    const order = await prisma.order.update({
      where: { id },
      data: { status, ...extraData },
      include: {
        user: { select: { email: true, name: true } },
        address: true,
        items: {
          include: {
            variant: { include: { book: { select: { title: true } } } },
          },
        },
      },
    });

    if (isNewTransition && (status === "DELIVERED" || status === "CANCELLED")) {
      const emailOrder = {
        id: order.id,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          title: item.variant?.book?.title || "",
          quantity: item.quantity,
          price: item.price,
          format: item.variant?.format,
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        total: order.total,
        paymentStatus: order.paymentStatus,
        address: order.address,
      };

      if (status === "DELIVERED") {
        sendOrderEmailSafe(sendOrderDeliveredEmail, {
          to: order.user.email,
          name: order.user.name,
          order: emailOrder,
        });
      } else {
        sendOrderEmailSafe(sendOrderCancelledEmail, {
          to: order.user.email,
          name: order.user.name,
          order: emailOrder,
          reason: cancelReason || null,
        });
      }
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }
    console.error("[updateOrderStatus]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/*USERS*/
exports.getUsers = async (req, res) => {
  try {
    const viewerRole = req.user.role;
    let scopeRoles;
    if (viewerRole === "STAFF") {
      scopeRoles = ["STAFF", "CUSTOMER", "DEALER"];
    } else if (viewerRole === "ADMIN") {
      scopeRoles = ["CUSTOMER", "DEALER", "STAFF"];
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền truy cập" });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 15);
    const search = req.query.search?.trim() ?? "";
    const role = req.query.role?.trim() ?? "";
    const status = req.query.status?.trim() ?? "";
    const tierRank = parseInt(req.query.tier) || 0; // rank 1-5, 0 = tất cả hạng
    const skip = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { userCode: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (role && scopeRoles.includes(role)) {
      conditions.push({ role });
    } else {
      conditions.push({ role: { in: scopeRoles } });
    }

    if (status === "active") conditions.push({ isActive: true });
    else if (status === "locked") conditions.push({ isActive: false });

    const where = conditions.length ? { AND: conditions } : {};
    const baseSelect = {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      isActive: true,
      userCode: true,
      createdAt: true,
      _count: { select: { orders: true } },
    };

    let usersWithTier, total;

    if (tierRank > 0) {
      const allMatched = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: baseSelect,
      });
      const allIds = allMatched.map((u) => u.id);
      const spendAgg = allIds.length
        ? await prisma.order.groupBy({
            by: ["userId"],
            where: {
              userId: { in: allIds },
              paymentStatus: "PAID",
              status: "COMPLETED",
            },
            _sum: { total: true },
          })
        : [];
      const spendMap = Object.fromEntries(
        spendAgg.map((s) => [s.userId, s._sum.total || 0]),
      );
      const filtered = allMatched
        .map((u) => ({ ...u, tier: buildTierSummary(spendMap[u.id] || 0) }))
        .filter((u) => u.tier.rank === tierRank);

      total = filtered.length;
      usersWithTier = filtered.slice(skip, skip + limit);
    } else {
      const [users, count] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: baseSelect,
        }),
        prisma.user.count({ where }),
      ]);

      // Tính hạng thành viên (theo tổng chi tiêu đơn PAID + COMPLETED) cho từng user trong trang hiện tại.
      const userIds = users.map((u) => u.id);
      const spendAgg = userIds.length
        ? await prisma.order.groupBy({
            by: ["userId"],
            where: {
              userId: { in: userIds },
              paymentStatus: "PAID",
              status: "COMPLETED",
            },
            _sum: { total: true },
          })
        : [];
      const spendMap = Object.fromEntries(
        spendAgg.map((s) => [s.userId, s._sum.total || 0]),
      );
      usersWithTier = users.map((u) => ({
        ...u,
        tier: buildTierSummary(spendMap[u.id] || 0),
      }));
      total = count;
    }

    return res.json({
      success: true,
      data: {
        users: usersWithTier,
        total,
        totalPages: Math.ceil(total / limit),
        page,
      },
    });
  } catch (err) {
    console.error("[getUsers]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.toggleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerRole = req.user.role;
    const { email, reason } = req.body;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Không thể tự khóa/mở khóa tài khoản của chính mình",
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    if (viewerRole === "STAFF" && !["CUSTOMER", "DEALER"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Staff chỉ được khóa/mở khóa tài khoản Customer hoặc Dealer",
      });
    }
    if (
      viewerRole === "ADMIN" &&
      !["CUSTOMER", "DEALER", "STAFF"].includes(user.role)
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Không thể khóa tài khoản Admin" });
    }
    if (!["STAFF", "ADMIN"].includes(viewerRole)) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    }

    const willLock = user.isActive; // đang active -> hành động là khóa

    // Vô hiệu hóa (khóa) tài khoản: bắt buộc xác nhận đúng email + lý do
    if (willLock) {
      if (!email || email.trim().toLowerCase() !== user.email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: "Email xác nhận không khớp với email tài khoản",
        });
      }
      const trimmedReason = (reason || "").trim();
      if (!trimmedReason || trimmedReason.length < 10) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập lý do khóa tài khoản (tối thiểu 10 ký tự)",
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: willLock
        ? {
            isActive: false,
            lockReason: reason.trim(),
            lockedAt: new Date(),
            lockedBy: req.user.id,
          }
        : {
            isActive: true,
            lockReason: null,
            lockedAt: null,
            lockedBy: null,
          },
    });

    if (willLock) {
      sendAccountLockedEmail({
        to: updated.email,
        name: updated.name,
        reason: updated.lockReason,
        dateLocked: updated.lockedAt,
      }).catch((err) => console.error("[toggleUser lock email]", err));
    } else {
      sendAccountUnlockedEmail({
        to: updated.email,
        name: updated.name,
        dateUnlocked: new Date(),
      }).catch((err) => console.error("[toggleUser unlock email]", err));
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("[toggleUser]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerRole = req.user.role;

    const scopeRoles =
      viewerRole === "STAFF"
        ? ["STAFF", "CUSTOMER", "DEALER"]
        : viewerRole === "ADMIN"
          ? ["CUSTOMER", "DEALER", "STAFF", "ADMIN"]
          : null;

    if (!scopeRoles) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền truy cập" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        dob: true,
        avatar: true,
        role: true,
        isActive: true,
        userCode: true,
        createdAt: true,
        updatedAt: true,
        lockReason: true,
        lockedAt: true,
        _count: { select: { orders: true, children: true } },
        children: {
          select: {
            id: true,
            name: true,
            dob: true,
            avatarEmoji: true,
            avatarColor: true,
            isActive: true,
            isLocked: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        orders: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    if (!scopeRoles.includes(user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền xem tài khoản này" });
    }

    const totalSpent = await prisma.order.aggregate({
      where: { userId: id, paymentStatus: "PAID" },
      _sum: { total: true },
    });

    // Hạng thành viên tính theo chi tiêu đơn PAID + COMPLETED (đồng bộ /loyalty/me).
    const loyaltySpend = await prisma.order.aggregate({
      where: { userId: id, paymentStatus: "PAID", status: "COMPLETED" },
      _sum: { total: true },
    });

    return res.json({
      success: true,
      data: {
        ...user,
        // Mật khẩu được băm một chiều (bcrypt) — không thể và không nên hiển thị
        // dưới dạng văn bản gốc. Chỉ trả về trạng thái để FE hiển thị.
        passwordProtected: true,
        totalSpent: totalSpent._sum.total ?? 0,
        loyalty: buildLoyaltyProfile(loyaltySpend._sum.total ?? 0),
      },
    });
  } catch (err) {
    console.error("[getUserDetail]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
exports.bulkToggleUsers = async (req, res) => {
  try {
    const viewerRole = req.user.role;
    const { ids, action, reason } = req.body;

    if (!["STAFF", "ADMIN"].includes(viewerRole)) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Chưa chọn tài khoản nào" });
    }
    if (!["lock", "unlock"].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "Hành động không hợp lệ" });
    }

    const cleanIds = [...new Set(ids)].filter((id) => id !== req.user.id);
    if (cleanIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể tự khóa/mở khóa tài khoản của chính mình",
      });
    }

    const willLock = action === "lock";

    if (willLock) {
      const trimmedReason = (reason || "").trim();
      if (!trimmedReason || trimmedReason.length < 10) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập lý do khóa tài khoản (tối thiểu 10 ký tự)",
        });
      }
    }

    const allowedTargetRoles =
      viewerRole === "STAFF"
        ? ["CUSTOMER", "DEALER"]
        : ["CUSTOMER", "DEALER", "STAFF"];

    const targets = await prisma.user.findMany({
      where: { id: { in: cleanIds }, role: { in: allowedTargetRoles } },
      select: { id: true, email: true, name: true, isActive: true },
    });

    // Chỉ xử lý user đang ở đúng trạng thái ngược lại hành động (tránh khóa cái đã khóa)
    const eligible = targets.filter((u) =>
      willLock ? u.isActive : !u.isActive,
    );

    if (eligible.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có tài khoản hợp lệ để thực hiện thao tác này",
      });
    }

    const now = new Date();
    await prisma.user.updateMany({
      where: { id: { in: eligible.map((u) => u.id) } },
      data: willLock
        ? {
            isActive: false,
            lockReason: reason.trim(),
            lockedAt: now,
            lockedBy: req.user.id,
          }
        : { isActive: true, lockReason: null, lockedAt: null, lockedBy: null },
    });

    for (const u of eligible) {
      if (willLock) {
        sendAccountLockedEmail({
          to: u.email,
          name: u.name,
          reason: reason.trim(),
          dateLocked: now,
        }).catch((err) => console.error("[bulkToggleUsers lock email]", err));
      } else {
        sendAccountUnlockedEmail({
          to: u.email,
          name: u.name,
          dateUnlocked: now,
        }).catch((err) => console.error("[bulkToggleUsers unlock email]", err));
      }
    }

    return res.json({
      success: true,
      message: `Đã ${willLock ? "khóa" : "mở khóa"} ${eligible.length} tài khoản`,
      data: {
        affected: eligible.length,
        skipped: cleanIds.length - eligible.length,
      },
    });
  } catch (err) {
    console.error("[bulkToggleUsers]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

function csvEscape(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

exports.exportUsersCsv = async (req, res) => {
  try {
    const viewerRole = req.user.role;
    let scopeRoles;
    if (viewerRole === "STAFF") scopeRoles = ["STAFF", "CUSTOMER", "DEALER"];
    else if (viewerRole === "ADMIN")
      scopeRoles = ["CUSTOMER", "DEALER", "STAFF"];
    else
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền truy cập" });

    const search = req.query.search?.trim() ?? "";
    const role = req.query.role?.trim() ?? "";
    const status = req.query.status?.trim() ?? "";

    const conditions = [];
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { userCode: { contains: search, mode: "insensitive" } },
        ],
      });
    }
    if (role && scopeRoles.includes(role)) conditions.push({ role });
    else conditions.push({ role: { in: scopeRoles } });
    if (status === "active") conditions.push({ isActive: true });
    else if (status === "locked") conditions.push({ isActive: false });

    const where = conditions.length ? { AND: conditions } : {};

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        userCode: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true, children: true } },
      },
    });

    const header = [
      "Mã người dùng",
      "Họ tên",
      "Email",
      "Số điện thoại",
      "Vai trò",
      "Trạng thái",
      "Số đơn hàng",
      "Số tài khoản kid",
      "Ngày đăng ký",
    ];
    const rows = users.map((u) => [
      u.userCode ?? "",
      u.name ?? "",
      u.email ?? "",
      u.phone ?? "",
      u.role,
      u.isActive ? "Hoạt động" : "Đã khóa",
      u._count.orders,
      u._count.children,
      u.createdAt.toISOString().slice(0, 10),
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map(csvEscape).join(","))
      .join("\n");

    const fileName = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    // BOM để Excel đọc đúng UTF-8 tiếng Việt
    return res.send("\uFEFF" + csv);
  } catch (err) {
    console.error("[exportUsersCsv]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
exports.backfillUserCodes = async (req, res) => {
  try {
    const count = await backfillUserCodes();
    return res.json({
      success: true,
      message: `Đã cập nhật mã cho ${count} người dùng`,
    });
  } catch (err) {
    console.error("[backfillUserCodes]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.generateUserCode = generateUserCode;

/* COUPONS*/
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: coupons });
  } catch (err) {
    console.error("[getCoupons]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount, usageLimit, expiresAt } =
      req.body;

    if (!code || !type || !value) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (code, type, value)",
      });
    }

    const validTypes = ["PERCENTAGE", "FIXED"];
    if (!validTypes.includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Loại mã không hợp lệ" });
    }
    if (type === "PERCENTAGE" && (value < 1 || value > 100)) {
      return res
        .status(400)
        .json({ success: false, message: "Giá trị phần trăm phải từ 1–100" });
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Mã code đã tồn tại" });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: Number(value),
        minOrder: minOrder ? Number(minOrder) : 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });

    return res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    console.error("[createCoupon]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.toggleCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã giảm giá" });
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("[toggleCoupon]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      type,
      value,
      minOrder,
      maxDiscount,
      usageLimit,
      expiresAt,
      isActive,
    } = req.body;

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã giảm giá" });
    }

    if (type) {
      const validTypes = ["PERCENTAGE", "FIXED"];
      if (!validTypes.includes(type)) {
        return res
          .status(400)
          .json({ success: false, message: "Loại mã không hợp lệ" });
      }
    }
    const effectiveType = type || coupon.type;
    if (
      effectiveType === "PERCENTAGE" &&
      value !== undefined &&
      (value < 1 || value > 100)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Giá trị phần trăm phải từ 1–100" });
    }

    if (code) {
      const cleanCode = code.toUpperCase();
      const existing = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      });
      if (existing && existing.id !== id) {
        return res
          .status(409)
          .json({ success: false, message: "Mã code đã tồn tại" });
      }
    }

    const data = {};
    if (code !== undefined) data.code = code.toUpperCase();
    if (type !== undefined) data.type = type;
    if (value !== undefined) data.value = Number(value);
    if (minOrder !== undefined) data.minOrder = Number(minOrder) || 0;
    if (maxDiscount !== undefined)
      data.maxDiscount = maxDiscount === null ? null : Number(maxDiscount);
    if (usageLimit !== undefined)
      data.usageLimit = usageLimit === null ? null : Number(usageLimit);
    if (expiresAt !== undefined)
      data.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.coupon.update({
      where: { id },
      data,
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("[updateCoupon]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã giảm giá" });
    }

    await prisma.coupon.delete({ where: { id } });

    return res.json({ success: true, message: "Đã xóa mã giảm giá" });
  } catch (err) {
    console.error("[deleteCoupon]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/* AR CODE MANAGEMENT (staff)*/
const cloudinary = require("../config/cloudinary");
const crypto = require("crypto");
const {
  uploadGlbBuffer,
  uploadImageBuffer,
  deleteImageByPublicId,
  extractPublicId,
} = require("../services/cloudinaryUploadService");

const isDev = process.env.NODE_ENV !== "production";
function serverError(res, err, tag) {
  console.error(`[${tag}]`, err);
  return res.status(500).json({
    success: false,
    message: "Lỗi server",
    ...(isDev ? { debug: err.message } : {}),
  });
}

function generateArCode() {
  return crypto.randomBytes(24).toString("base64url");
}

exports.searchProductsQuick = async (req, res) => {
  try {
    const q = req.query.q?.trim() ?? "";
    const code = req.query.code?.trim() ?? "";

    // Tìm chính xác theo mã sách — mã giờ thuộc BookVariant, không thuộc Book
    if (code) {
      const variant = await prisma.bookVariant.findUnique({
        where: { productCode: code },
        include: {
          book: {
            select: { id: true, title: true, slug: true, coverImage: true },
          },
        },
      });
      if (!variant) return res.json({ success: true, data: [] });
      return res.json({
        success: true,
        data: [
          {
            id: variant.book.id,
            title: variant.book.title,
            slug: variant.book.slug,
            coverImage: variant.book.coverImage,
            productCode: variant.productCode,
            unit: variant.unit,
            stock: variant.stock,
            variantId: variant.id,
            format: variant.format,
          },
        ],
      });
    }

    if (q.length < 1) return res.json({ success: true, data: [] });

    const books = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        variants: {
          select: {
            id: true,
            format: true,
            productCode: true,
            unit: true,
            stock: true,
          },
        },
        _count: { select: { arCodes: true } },
      },
      take: 8,
      orderBy: { title: "asc" },
    });

    return res.json({ success: true, data: books });
  } catch (err) {
    console.error("[searchProductsQuick]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.getArCodes = async (req, res) => {
  try {
    const { bookId } = req.params;
    const arCodes = await prisma.arCode.findMany({
      where: { bookId },
      orderBy: { createdAt: "asc" },
    });
    return res.json({ success: true, data: arCodes });
  } catch (err) {
    return serverError(res, err, "getArCodes");
  }
};

exports.createArCode = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { label, accessType } = req.body;

    if (!label) {
      return res.status(400).json({ success: false, message: "Thiếu label" });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu file .glb" });
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sách" });
    }

    const finalAccessType =
      accessType === "PUBLIC" ? "PUBLIC" : "CUSTOMER_ONLY";

    const code = generateArCode();
    const url = await uploadGlbFile(req.file.path);
    const arCode = await prisma.arCode.create({
      data: {
        code,
        label,
        modelUrl: url,
        bookId,
        accessType: finalAccessType,
      },
    });

    return res.status(201).json({ success: true, data: arCode });
  } catch (err) {
    return serverError(res, err, "createArCode");
  }
};

exports.updateArCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, accessType } = req.body;

    const existing = await prisma.arCode.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã AR" });
    }

    const data = {};
    if (label) data.label = label;
    if (accessType === "PUBLIC" || accessType === "CUSTOMER_ONLY")
      data.accessType = accessType;

    if (req.file) {
      const uploadResult = await uploadGlbBuffer(
        req.file.buffer,
        existing.code,
      );
      data.modelUrl = uploadResult.secure_url;
    }

    const arCode = await prisma.arCode.update({ where: { id }, data });
    return res.json({ success: true, data: arCode });
  } catch (err) {
    return serverError(res, err, "updateArCode");
  }
};

exports.toggleArCode = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.arCode.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã AR" });
    }

    const arCode = await prisma.arCode.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    return res.json({ success: true, data: arCode });
  } catch (err) {
    return serverError(res, err, "toggleArCode");
  }
};

/*  AR CODES — GỘP THEO SÁCH */
exports.getArCodesGroupedAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 8);
    const search = req.query.search?.trim() ?? "";
    const accessType = req.query.accessType?.trim() ?? "";
    const status = req.query.status?.trim() ?? "";

    const arCodeWhere = {};
    if (accessType === "PUBLIC" || accessType === "CUSTOMER_ONLY") {
      arCodeWhere.accessType = accessType;
    }
    if (status === "active") arCodeWhere.isActive = true;
    if (status === "inactive") arCodeWhere.isActive = false;

    const bookWhere = { arCodes: { some: arCodeWhere } };

    if (search) {
      bookWhere.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            {
              arCodes: {
                some: {
                  ...arCodeWhere,
                  OR: [
                    { label: { contains: search, mode: "insensitive" } },
                    { code: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        },
      ];
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where: bookWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          arCodes: { where: arCodeWhere, orderBy: { createdAt: "asc" } },
        },
      }),
      prisma.book.count({ where: bookWhere }),
    ]);

    const groups = books
      .filter((b) => b.arCodes.length > 0)
      .map((b) => ({
        book: {
          id: b.id,
          title: b.title,
          slug: b.slug,
          coverImage: b.coverImage,
        },
        arCodes: b.arCodes,
      }));

    return res.json({
      success: true,
      data: {
        groups,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        page,
      },
    });
  } catch (err) {
    return serverError(res, err, "getArCodesGroupedAll");
  }
};

exports.updateArCodeAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { accessType } = req.body;

    if (accessType !== "PUBLIC" && accessType !== "CUSTOMER_ONLY") {
      return res
        .status(400)
        .json({ success: false, message: "accessType không hợp lệ" });
    }

    const arCode = await prisma.arCode.update({
      where: { id },
      data: { accessType },
    });
    return res.json({ success: true, data: arCode });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã AR" });
    }
    return serverError(res, err, "updateArCodeAccess");
  }
};

/*  NHẬP KHO  */
async function getOrCreatePhysicalVariant(tx, book, unitPrice, unit) {
  let variant = await tx.bookVariant.findUnique({
    where: { bookId_format: { bookId: book.id, format: "PHYSICAL" } },
  });
  if (!variant) {
    const productCode = await generateProductCode(tx);
    variant = await tx.bookVariant.create({
      data: {
        bookId: book.id,
        format: "PHYSICAL",
        productCode,
        unit: unit || "Cuốn",
        price: unitPrice || 0,
        stock: 0,
        isActive: true,
      },
    });
  }
  return variant;
}

exports.createInventoryImport = async (req, res) => {
  try {
    const { code, items } = req.body;

    if (!code || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã phiếu hoặc danh sách dòng nhập",
      });
    }

    const existingImport = await prisma.inventoryImport.findUnique({
      where: { code },
    });
    if (existingImport) {
      return res
        .status(409)
        .json({ success: false, message: "Mã phiếu đã tồn tại" });
    }

    const slugify = require("slugify");

    const result = await prisma.$transaction(async (tx) => {
      let fallbackCategory = await tx.category.findUnique({
        where: { slug: "chua-phan-loai" },
      });
      if (!fallbackCategory) {
        fallbackCategory = await tx.category.create({
          data: { name: "Chưa phân loại", slug: "chua-phan-loai" },
        });
      }

      const savedItems = [];

      for (const raw of items) {
        const qtyActual = Number(raw.qtyActual) || 0;
        const unitPrice = Number(raw.unitPrice) || 0;
        const qtyDocument =
          raw.qtyDocument === null ||
          raw.qtyDocument === undefined ||
          raw.qtyDocument === ""
            ? null
            : Number(raw.qtyDocument);

        let book = null;
        let variant = null;

        if (raw.productId) {
          book = await tx.book.findUnique({ where: { id: raw.productId } });
          if (!book) {
            throw Object.assign(
              new Error(`Không tìm thấy sách đã chọn (id: ${raw.productId})`),
              { status: 404 },
            );
          }
          variant = await getOrCreatePhysicalVariant(
            tx,
            book,
            unitPrice,
            raw.unit,
          );
        } else {
          const trimmedCode = raw.productCode?.trim();
          if (trimmedCode) {
            const matchedVariant = await tx.bookVariant.findUnique({
              where: { productCode: trimmedCode },
              include: { book: true },
            });
            if (matchedVariant) {
              variant = matchedVariant;
              book = matchedVariant.book;
            }
          }
          if (!book && raw.title) {
            book = await tx.book.findFirst({
              where: {
                title: { equals: raw.title.trim(), mode: "insensitive" },
              },
            });
          }

          if (!book) {
            const title = raw.title?.trim();
            if (!title) {
              throw Object.assign(
                new Error("Thiếu tên sản phẩm cho dòng nhập mã mới"),
                { status: 400 },
              );
            }

            const baseSlug = slugify(title, {
              lower: true,
              locale: "vi",
              strict: true,
            });
            const slugExists = await tx.book.findUnique({
              where: { slug: baseSlug },
            });
            const finalSlug = slugExists
              ? `${baseSlug}-${Date.now()}`
              : baseSlug;

            book = await tx.book.create({
              data: {
                title,
                slug: finalSlug,
                categoryId: fallbackCategory.id,
                isActive: false,
              },
            });
          }

          if (!variant) {
            variant = await getOrCreatePhysicalVariant(
              tx,
              book,
              unitPrice,
              raw.unit,
            );
          }
        }

        const updatedVariant = await tx.bookVariant.update({
          where: { id: variant.id },
          data: { stock: { increment: qtyActual } },
        });

        savedItems.push({
          variantId: updatedVariant.id,
          title: book.title,
          productCode: updatedVariant.productCode,
          unit: raw.unit || updatedVariant.unit,
          oldQty: Number(raw.oldQty) || 0,
          qtyDocument,
          qtyActual,
          unitPrice,
        });
      }

      return tx.inventoryImport.create({
        data: {
          code,
          createdBy: req.user.id,
          items: { create: savedItems },
        },
        include: { items: true },
      });
    });

    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.status) {
      return res
        .status(err.status)
        .json({ success: false, message: err.message });
    }
    return serverError(res, err, "createInventoryImport");
  }
};

/*  USER ROLE / MANAGED USERS / AR DETAIL / IMAGES*/
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role: newRole } = req.body;
    const viewerRole = req.user.role;

    if (!["CUSTOMER", "DEALER"].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: "Chỉ được nâng/hạ cấp giữa Customer và Dealer",
      });
    }
    if (!["STAFF", "ADMIN"].includes(viewerRole)) {
      return res
        .status(403)
        .json({ success: false, message: "Không có quyền" });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }
    if (!["CUSTOMER", "DEALER"].includes(target.role)) {
      return res.status(403).json({
        success: false,
        message: "Chỉ được nâng/hạ cấp tài khoản Customer hoặc Dealer",
      });
    }
    if (target.role === newRole) {
      return res
        .status(400)
        .json({ success: false, message: "Tài khoản đã ở cấp bậc này" });
    }

    const newUserCode = await generateUserCode(newRole, new Date());
    const newPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { id },
      data: { role: newRole, userCode: newUserCode, password: hashedPassword },
    });

    sendAccountProvisionedEmail({
      to: updated.email,
      role: newRole,
      name: updated.name,
      userCode: newUserCode,
      password: newPassword,
      dateIssued: new Date(),
      isUpgrade: true,
    }).catch((err) => console.error("[updateUserRole email]", err));

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("[updateUserRole]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.createManagedUser = async (req, res) => {
  try {
    const viewerRole = req.user.role;
    const { name, email, role, gender, phone } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (họ tên, email, vai trò)",
      });
    }

    const allowedCreateRoles =
      viewerRole === "ADMIN"
        ? ["DEALER", "STAFF"]
        : viewerRole === "STAFF"
          ? ["DEALER"]
          : [];
    if (!allowedCreateRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền tạo tài khoản vai trò này",
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Email đã được sử dụng" });
    }

    const userCode = await generateUserCode(role, new Date());
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        userCode,
        password: hashedPassword,
        gender: gender || null,
        phone: phone || null,
        isActive: true,
      },
    });

    sendAccountProvisionedEmail({
      to: email,
      role,
      name,
      userCode,
      password,
      dateIssued: new Date(),
      isUpgrade: false,
    }).catch((err) => console.error("[createManagedUser email]", err));

    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    console.error("[createManagedUser]", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.getArCodeById = async (req, res) => {
  try {
    const { id } = req.params;
    const arCode = await prisma.arCode.findUnique({
      where: { id },
      include: {
        book: {
          select: { id: true, title: true, slug: true, coverImage: true },
        },
      },
    });
    if (!arCode) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã AR" });
    }
    return res.json({ success: true, data: arCode });
  } catch (err) {
    return serverError(res, err, "getArCodeById");
  }
};

async function deleteAllBookImages(book) {
  const urls = [book.coverImage, ...(book.images ?? [])].filter(Boolean);
  await Promise.all(
    urls.map((url) => {
      const publicId = extractPublicId(url);
      return publicId ? deleteImageByPublicId(publicId).catch(() => {}) : null;
    }),
  );
}

exports.uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sách" });
    }
    if (!req.files?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu file ảnh" });
    }

    const uploaded = await Promise.all(
      req.files.map((f) => uploadImageBuffer(f.buffer, id)),
    );
    const newUrls = uploaded.map((u) => u.secure_url);

    const updated = await prisma.book.update({
      where: { id },
      data: {
        images: { push: newUrls },
        ...(book.coverImage ? {} : { coverImage: newUrls[0] }),
      },
      select: { id: true, coverImage: true, images: true },
    });

    return res.status(201).json({ success: true, data: updated });
  } catch (err) {
    return serverError(res, err, "uploadProductImages");
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;
    if (!url)
      return res.status(400).json({ success: false, message: "Thiếu url ảnh" });

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sách" });

    const publicId = extractPublicId(url);
    if (publicId) await deleteImageByPublicId(publicId).catch(() => {});

    const remainingImages = (book.images ?? []).filter((u) => u !== url);
    const isCover = book.coverImage === url;

    const updated = await prisma.book.update({
      where: { id },
      data: {
        images: remainingImages,
        ...(isCover ? { coverImage: remainingImages[0] ?? null } : {}),
      },
      select: { id: true, coverImage: true, images: true },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    return serverError(res, err, "deleteProductImage");
  }
};

exports.setProductCover = async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;
    if (!url)
      return res.status(400).json({ success: false, message: "Thiếu url ảnh" });

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sách" });
    if (!(book.images ?? []).includes(url)) {
      return res
        .status(400)
        .json({ success: false, message: "Ảnh không thuộc sách này" });
    }

    const updated = await prisma.book.update({
      where: { id },
      data: { coverImage: url },
      select: { id: true, coverImage: true, images: true },
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return serverError(res, err, "setProductCover");
  }
};

exports.deleteArCode = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.arCode.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã AR" });
    }

    const publicId = extractPublicId(existing.modelUrl);
    if (publicId) {
      await cloudinary.uploader
        .destroy(publicId, { resource_type: "raw" })
        .catch((err) =>
          console.error(
            "[deleteArCode] Xóa file Cloudinary thất bại, có thể còn rác:",
            err,
          ),
        );
    }

    await prisma.arCode.delete({ where: { id } });

    return res.json({ success: true, message: "Đã xóa mã AR" });
  } catch (err) {
    return serverError(res, err, "deleteArCode");
  }
};
