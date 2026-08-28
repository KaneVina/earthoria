const prisma = require("../config/db");
const SUCCESSFUL_ORDER_STATUSES = ["CONFIRMED", "SHIPPING", "DELIVERED", "COMPLETED"];
const DEFAULT_FREE_SHIP_THRESHOLD = 300_000;
const LOYALTY_TIERS = [
  {
    rank: 1,
    roman: "I",
    code: "HANOI",
    name: "Chùa Một Cột",
    emoji: "🪷",
    image: "/loyalty/chua-mot-cot.png",
    city: "Hà Nội",
    cityCode: "HAN",
    region: "Miền Bắc",
    spirit: "Khởi nguồn",
    distanceKm: 0,
    minSpend: 0,
    discountPercent: 0,
    maxDiscountPerOrder: 0,
    freeShipThreshold: DEFAULT_FREE_SHIP_THRESHOLD,
    color: "#4a9e3f",
    colorSoft: "rgba(74,158,63,0.12)",
    tagline: "Khởi hành — mọi hành trình đều bắt đầu từ đây",
  },
  {
    rank: 2,
    roman: "II",
    code: "HUE",
    name: "Cố Đô Huế",
    emoji: "🏯",
    image: "/loyalty/kinh-thanh-hue.png",
    city: "Huế",
    cityCode: "HUI",
    region: "Bắc Trung Bộ",
    spirit: "Di sản",
    distanceKm: 630,
    minSpend: 3_000_000,
    discountPercent: 3,
    maxDiscountPerOrder: 100_000,
    freeShipThreshold: 200_000,
    color: "#2a78d6",
    colorSoft: "rgba(42,120,214,0.12)",
    tagline: "Bước chân đầu tiên vượt khỏi vùng an toàn",
  },
  {
    rank: 3,
    roman: "III",
    code: "DANANG",
    name: "Cầu Rồng",
    emoji: "🐉",
    image: "/loyalty/cau-rong.png",
    city: "Đà Nẵng",
    cityCode: "DAD",
    region: "Trung Bộ",
    spirit: "Bứt phá",
    distanceKm: 765,
    minSpend: 7_000_000,
    discountPercent: 5,
    maxDiscountPerOrder: 200_000,
    freeShipThreshold: 100_000,
    color: "#b8862e",
    colorSoft: "rgba(184,134,46,0.12)",
    tagline: "Vươn mình bứt phá như rồng bay ra biển lớn",
  },
  {
    rank: 4,
    roman: "IV",
    code: "NHATRANG",
    name: "Tháp Bà Ponagar",
    emoji: "🏛️",
    image: "/loyalty/thap-ba-ponagar.png",
    city: "Nha Trang",
    cityCode: "CXR",
    region: "Nam Trung Bộ",
    spirit: "Khám phá",
    distanceKm: 1200,
    minSpend: 15_000_000,
    discountPercent: 8,
    maxDiscountPerOrder: 350_000,
    freeShipThreshold: 0,
    color: "#7a4fb5",
    colorSoft: "rgba(122,79,181,0.12)",
    tagline: "Khám phá vùng đất của tháp cổ và biển xanh",
  },
  {
    rank: 5,
    roman: "V",
    code: "HOCHIMINH",
    name: "Landmark 81",
    emoji: "🏙️",
    image: "/loyalty/landmark-81.png",
    city: "TP. Hồ Chí Minh",
    cityCode: "SGN",
    region: "Miền Nam",
    spirit: "Vươn tới đỉnh cao",
    distanceKm: 1710,
    minSpend: 30_000_000,
    discountPercent: 12,
    maxDiscountPerOrder: 600_000,
    freeShipThreshold: 0,
    color: "#c0392b",
    colorSoft: "rgba(192,57,43,0.12)",
    tagline: "Đỉnh cao — chạm tới nóc nhà của Sài Gòn hoa lệ",
  },
];

const getTierByCode = (code) => LOYALTY_TIERS.find((t) => t.code === code) || null;

// Hạng tương ứng với 1 mức chi tiêu — luôn trả về tối thiểu Hạng I (không có "hạng 0").
const resolveTierBySpend = (spend) => {
  const safeSpend = Number.isFinite(spend) && spend > 0 ? spend : 0;
  let matched = LOYALTY_TIERS[0];
  for (const tier of LOYALTY_TIERS) {
    if (safeSpend >= tier.minSpend) matched = tier;
  }
  return matched;
};

const getNextTier = (tier) => {
  const idx = LOYALTY_TIERS.findIndex((t) => t.code === tier.code);
  if (idx === -1 || idx === LOYALTY_TIERS.length - 1) return null;
  return LOYALTY_TIERS[idx + 1];
};

const getUserLifetimeSpend = async (userId, txClient = prisma) => {
  const result = await txClient.order.aggregate({
    where: {
      userId,
      paymentStatus: "PAID",
      status: "COMPLETED",
    },
    _sum: { total: true },
  });
  return result._sum.total || 0;
};

// Dựng hồ sơ hạng đầy đủ từ 1 mức chi tiêu — dùng chung cho API /loyalty/me và lúc tạo đơn.
const buildLoyaltyProfile = (spend) => {
  const safeSpend = Number.isFinite(spend) && spend > 0 ? spend : 0;
  const tier = resolveTierBySpend(safeSpend);
  const nextTier = getNextTier(tier);
  const amountToNext = nextTier ? Math.max(nextTier.minSpend - safeSpend, 0) : 0;
  const spendIntoCurrentTier = safeSpend - tier.minSpend;
  const currentTierRange = nextTier ? nextTier.minSpend - tier.minSpend : 0;
  const progressPercent = !nextTier
    ? 100
    : currentTierRange <= 0
      ? 100
      : Math.max(0, Math.min(100, Math.round((spendIntoCurrentTier / currentTierRange) * 100)));

  return {
    spend: safeSpend,
    tier,
    nextTier,
    amountToNext,
    progressPercent,
    isMaxTier: !nextTier,
    tiers: LOYALTY_TIERS.map((t) => ({
      ...t,
      unlocked: safeSpend >= t.minSpend,
      isCurrent: t.code === tier.code,
    })),
  };
};

// Hồ sơ hạng đầy đủ của 1 user (truy vấn DB + build).
const getUserLoyaltyProfile = async (userId, txClient = prisma) => {
  const spend = await getUserLifetimeSpend(userId, txClient);
  return buildLoyaltyProfile(spend);
};

// Số tiền được giảm nhờ hạng thành viên trên 1 đơn — theo % của subtotal, chặn trần maxDiscountPerOrder và không bao giờ vượt quá subtotal.
const computeTierDiscount = (tier, subtotal) => {
  if (!tier || !subtotal || subtotal <= 0 || tier.discountPercent <= 0) return 0;
  let discount = Math.round((subtotal * tier.discountPercent) / 100);
  if (tier.maxDiscountPerOrder > 0) discount = Math.min(discount, tier.maxDiscountPerOrder);
  return Math.min(discount, subtotal);
};

// Ngưỡng miễn phí ship áp dụng — lấy theo hạng (đã bao gồm mặc định hệ thống ở Hạng I).
const getFreeShipThreshold = (tier) =>
  tier ? tier.freeShipThreshold : DEFAULT_FREE_SHIP_THRESHOLD;

module.exports = {
  LOYALTY_TIERS,
  SUCCESSFUL_ORDER_STATUSES,
  DEFAULT_FREE_SHIP_THRESHOLD,
  getTierByCode,
  resolveTierBySpend,
  getNextTier,
  getUserLifetimeSpend,
  buildLoyaltyProfile,
  getUserLoyaltyProfile,
  computeTierDiscount,
  getFreeShipThreshold,
};