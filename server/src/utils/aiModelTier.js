const { LOYALTY_TIERS, getUserLifetimeSpend } = require("./loyaltyTier");

const AI_MODEL_TIERS = [
  {
    rank: 1,
    code: "YEN_TU",
    name: "Yên Tử",
    emoji: "⛰️",
    altitude: 1068,
    minSpend: LOYALTY_TIERS[0].minSpend, // 0 — luôn mở khóa, kể cả khách vãng lai
    model: "llama-3.1-8b-instant",
    label: "Yên Tử · Cơ bản",
    icon: "/icon-modal-ai/yen-tu.png",
    tagline: "Cấp mặc định — nhanh, nhẹ, đủ dùng cho tư vấn thường ngày",
    maxTokens: 450,
    historyMessages: 8,
    toolRounds: 2,
    requestsPerMinute: 8,
  },
  {
    rank: 2,
    code: "BACH_MA",
    name: "Bạch Mã",
    emoji: "🌫️",
    altitude: 1450,
    minSpend: LOYALTY_TIERS[1].minSpend, // 3.000.000đ — cùng ngưỡng hạng "Cố Đô Huế"
    model: "llama-3.3-70b-versatile",
    label: "Bạch Mã · Nâng cao",
    icon: "/icon-modal-ai/bach-ma.png",
    tagline: "Hiểu ngữ cảnh tốt hơn, trả lời chi tiết hơn",
    maxTokens: 650,
    historyMessages: 12,
    toolRounds: 3,
    requestsPerMinute: 12,
  },
  {
    rank: 3,
    code: "BA_NA",
    name: "Bà Nà",
    emoji: "🌉",
    altitude: 1487,
    minSpend: LOYALTY_TIERS[2].minSpend, // 7.000.000đ — cùng ngưỡng hạng "Cầu Rồng"
    model: "openai/gpt-oss-20b",
    label: "Bà Nà · Chuyên sâu",
    icon: "/icon-modal-ai/ba-na.png",
    tagline: "Tư vấn sâu, ghi nhớ hội thoại dài hơn",
    maxTokens: 850,
    historyMessages: 16,
    toolRounds: 3,
    requestsPerMinute: 15,
  },
  {
    rank: 4,
    code: "TAM_DAO",
    name: "Tam Đảo",
    emoji: "🏔️",
    altitude: 1591,
    minSpend: LOYALTY_TIERS[3].minSpend, // 15.000.000đ — cùng ngưỡng hạng "Tháp Bà Ponagar"
    model: "meta-llama/llama-4-maverick-17b-128e-instruct",
    label: "Tam Đảo · Cao cấp",
    icon: "/icon-modal-ai/tam-dao.png",
    tagline: "Suy luận tốt hơn, trả lời dài & mạch lạc hơn",
    maxTokens: 1100,
    historyMessages: 20,
    toolRounds: 4,
    requestsPerMinute: 18,
  },
  {
    rank: 5,
    code: "FANSIPAN",
    name: "Fansipan",
    emoji: "🗻",
    altitude: 3143,
    minSpend: LOYALTY_TIERS[4].minSpend, // 30.000.000đ — cùng ngưỡng hạng "Landmark 81"
    model: "openai/gpt-oss-120b",
    label: "Fansipan · Đỉnh cao",
    icon: "/icon-modal-ai/fansipan.png",
    tagline: "Model mạnh nhất — dành cho hạng thành viên cao nhất",
    maxTokens: 1400,
    historyMessages: 24,
    toolRounds: 5,
    requestsPerMinute: 22,
  },
];

const DEFAULT_TIER = AI_MODEL_TIERS[0];

const getTierByCode = (code) =>
  AI_MODEL_TIERS.find((t) => t.code === code) || null;

// Hạng CAO NHẤT mà 1 mức chi tiêu cho phép mở khóa (giống resolveTierBySpend bên loyaltyTier.js).
const resolveMaxTierBySpend = (spend) => {
  const safeSpend = Number.isFinite(spend) && spend > 0 ? spend : 0;
  let matched = DEFAULT_TIER;
  for (const tier of AI_MODEL_TIERS) {
    if (safeSpend >= tier.minSpend) matched = tier;
  }
  return matched;
};

// Danh sách đầy đủ 5 hạng kèm trạng thái unlocked — dùng cho API /ai/models.
const buildModelTierList = (spend) => {
  const safeSpend = Number.isFinite(spend) && spend > 0 ? spend : 0;
  const maxUnlocked = resolveMaxTierBySpend(safeSpend);
  return AI_MODEL_TIERS.map((t) => ({
    rank: t.rank,
    code: t.code,
    name: t.name,
    emoji: t.emoji,
    icon: t.icon,
    label: t.label,
    tagline: t.tagline,
    minSpend: t.minSpend,
    unlocked: safeSpend >= t.minSpend,
    isMaxUnlocked: t.code === maxUnlocked.code,
  }));
};

/**
 * Khách vãng lai (chưa đăng nhập) chỉ dùng được hạng mặc định (Yên Tử).
 * Khách đã đăng nhập: tra tổng chi tiêu thật để biết hạng cao nhất được mở khóa.
 */
const resolveUserMaxTier = async (user) => {
  if (!user?.id) return DEFAULT_TIER;
  const spend = await getUserLifetimeSpend(user.id);
  return resolveMaxTierBySpend(spend);
};

/**
 * Xác thực + chốt hạng model thực sự dùng cho 1 lượt chat:
 * - Nếu không truyền / truyền mã không hợp lệ -> dùng hạng cao nhất đã mở khóa.
 * - Nếu truyền mã hợp lệ nhưng CHƯA mở khóa -> hạ về hạng cao nhất đã mở khóa
 *   (không bao giờ tin tưởng lựa chọn từ client vượt quá quyền thật sự).
 * - Nếu truyền mã hợp lệ và đã mở khóa -> cho phép dùng (kể cả chọn hạng thấp hơn).
 */
const resolveEffectiveTier = async (user, requestedCode) => {
  const maxTier = await resolveUserMaxTier(user);
  if (!requestedCode) return maxTier;

  const requested = getTierByCode(requestedCode);
  if (!requested) return maxTier;
  if (requested.rank > maxTier.rank) return maxTier;
  return requested;
};

module.exports = {
  AI_MODEL_TIERS,
  DEFAULT_TIER,
  getTierByCode,
  resolveMaxTierBySpend,
  buildModelTierList,
  resolveUserMaxTier,
  resolveEffectiveTier,
};
