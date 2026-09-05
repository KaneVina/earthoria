const prisma = require("../config/db");
const SUCCESSFUL_ORDER_STATUSES = [
  "CONFIRMED",
  "SHIPPING",
  "DELIVERED",
  "COMPLETED",
];
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
    maxChildAccounts: 2,
    color: "#4a9e3f",
    colorSoft: "rgba(74,158,63,0.12)",
    tagline: "Khởi hành — mọi hành trình đều bắt đầu từ đây",
    // Mỗi hạng thành viên mở khóa 1 hạng trợ lý AI Eira tương ứng (đồng bộ rank/minSpend với AI_MODEL_TIERS trong aiModelTier.js).
    aiModel: {
      code: "YEN_TU",
      name: "Yên Tử",
      emoji: "⛰️",
      icon: "/icon-modal-ai/yen-tu.png",
      tagline: "Đáp ứng trọn vẹn những nhu cầu thường nhật.",
    },
    story: {
      title: "Diên Hựu Tự — nơi một giấc mơ của vua Lý hóa thành kiến trúc.",
      desc: "Từ một giấc mơ trên tòa sen, một biểu tượng đã được dựng nên — mở đầu cho hành trình đi qua những dấu ấn của thời gian.",
      next: "Và từ giấc mơ ấy, ta bước vào một kinh đô nơi con người từng kiến tạo cả một vũ trụ bằng kiến trúc.",
    },
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
    maxChildAccounts: 4,
    color: "#2a78d6",
    colorSoft: "rgba(42,120,214,0.12)",
    tagline: "Bước chân đầu tiên vượt khỏi vùng an toàn",
    aiModel: {
      code: "BACH_MA",
      name: "Bạch Mã",
      emoji: "🌫️",
      icon: "/icon-modal-ai/bach-ma.png",
      tagline: "Thấu hiểu sâu hơn, nắm bắt ngữ cảnh và phản hồi tinh tế hơn.",
    },
    story: {
      title:
        "Kinh đô triều Nguyễn — nơi Ngũ phương, Ngũ hành, Ngũ sắc hòa thành một trật tự.",
      desc: "Không chỉ là cung điện, Huế là cách người xưa đưa thiên nhiên, văn hóa và quyền lực vào cùng một không gian.",
      next: "Rời khỏi vẻ trầm mặc của kinh thành, hành trình bắt đầu chuyển mình — từ những triều đại xưa đến một Việt Nam đang vươn ra phía trước.",
    },
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
    maxChildAccounts: 6,
    color: "#b8862e",
    colorSoft: "rgba(184,134,46,0.12)",
    tagline: "Vươn mình bứt phá như rồng bay ra biển lớn",
    aiModel: {
      code: "BA_NA",
      name: "Bà Nà",
      emoji: "🌉",
      icon: "/icon-modal-ai/ba-na.png",
      tagline: "Tư duy sắc bén, trả lời chặt chẽ, mạch lạc.",
    },
    story: {
      title:
        "666 mét, 6 làn xe — một con rồng thời Lý vươn mình qua sông Hàn, hướng ra biển lớn.",
      desc: "Hình tượng nghìn năm được tái hiện bằng thép, ánh sáng và chuyển động — nơi quá khứ bắt đầu bước vào hiện tại.",
      next: "Nhưng dòng chảy văn hóa không chỉ đi từ quá khứ đến hiện đại; nó còn gặp nhau giữa những nền văn hóa và những niềm tin khác nhau.",
    },
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
    maxChildAccounts: 8,
    color: "#7a4fb5",
    colorSoft: "rgba(122,79,181,0.12)",
    tagline: "Khám phá vùng đất của tháp cổ và biển xanh",
    aiModel: {
      code: "TAM_DAO",
      name: "Tam Đảo",
      emoji: "🏔️",
      icon: "/icon-modal-ai/tam-dao.png",
      tagline: "Suy luận và tư vấn sâu hơn.",
    },
    story: {
      title:
        "Pô Nagar — nơi tín ngưỡng Chăm gặp gỡ văn hóa Việt, hòa vào hình tượng Thiên Y A Na Thánh Mẫu.",
      desc: "Qua hàng thế kỷ, một vị thần bản địa vẫn sống trong đời sống tinh thần của những thế hệ hôm nay.",
      next: "Và khi những giá trị xưa tiếp tục được truyền lại, hành trình cuối cùng đưa ta đến một biểu tượng của Việt Nam trong hiện tại.",
    },
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
    maxChildAccounts: 10,
    color: "#c0392b",
    colorSoft: "rgba(192,57,43,0.12)",
    tagline: "Đỉnh cao — chạm tới nóc nhà của Sài Gòn hoa lệ",
    aiModel: {
      code: "FANSIPAN",
      name: "Fansipan",
      emoji: "🗻",
      icon: "/icon-modal-ai/fansipan.png",
      tagline:
        "Xử lý yêu cầu phức tạp với khả năng suy luận mạnh mẽ và toàn diện nhất.",
    },
    story: {
      title: "Từ hình ảnh bó tre Việt Nam đến tòa nhà cao nhất Việt Nam.",
      desc: "Nếu Chùa Một Cột bắt đầu bằng một giấc mơ, thì Landmark 81 là hình ảnh của một giấc mơ đã chạm tới bầu trời.",
      conclusion:
        "Kết thúc hành trình từ kiến trúc cổ đến kiến trúc hiện đại, từ tín ngưỡng đến văn hóa, từ ký ức của nghìn năm đến khát vọng của hôm nay — và vẫn còn tiếp tục hướng về tương lai.",
    },
  },
];
const ABSOLUTE_MAX_CHILD_ACCOUNTS =
  LOYALTY_TIERS[LOYALTY_TIERS.length - 1].maxChildAccounts;
const getTierByCode = (code) =>
  LOYALTY_TIERS.find((t) => t.code === code) || null;
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
  const amountToNext = nextTier
    ? Math.max(nextTier.minSpend - safeSpend, 0)
    : 0;
  const spendIntoCurrentTier = safeSpend - tier.minSpend;
  const currentTierRange = nextTier ? nextTier.minSpend - tier.minSpend : 0;
  const progressPercent = !nextTier
    ? 100
    : currentTierRange <= 0
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            Math.round((spendIntoCurrentTier / currentTierRange) * 100),
          ),
        );

  return {
    spend: safeSpend,
    tier,
    nextTier,
    amountToNext,
    progressPercent,
    isMaxTier: !nextTier,
    childAccountLimit: tier.maxChildAccounts,
    nextChildAccountLimit: nextTier ? nextTier.maxChildAccounts : null,
    tiers: LOYALTY_TIERS.map((t) => ({
      ...t,
      unlocked: safeSpend >= t.minSpend,
      isCurrent: t.code === tier.code,
      isNextUp: !!nextTier && t.code === nextTier.code,
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
  if (!tier || !subtotal || subtotal <= 0 || tier.discountPercent <= 0)
    return 0;
  let discount = Math.round((subtotal * tier.discountPercent) / 100);
  if (tier.maxDiscountPerOrder > 0)
    discount = Math.min(discount, tier.maxDiscountPerOrder);
  return Math.min(discount, subtotal);
};

// Ngưỡng miễn phí ship áp dụng — lấy theo hạng (đã bao gồm mặc định hệ thống ở Hạng I).
const getFreeShipThreshold = (tier) =>
  tier ? tier.freeShipThreshold : DEFAULT_FREE_SHIP_THRESHOLD;

module.exports = {
  LOYALTY_TIERS,
  SUCCESSFUL_ORDER_STATUSES,
  DEFAULT_FREE_SHIP_THRESHOLD,
  ABSOLUTE_MAX_CHILD_ACCOUNTS,
  getTierByCode,
  resolveTierBySpend,
  getNextTier,
  getUserLifetimeSpend,
  buildLoyaltyProfile,
  getUserLoyaltyProfile,
  computeTierDiscount,
  getFreeShipThreshold,
};
