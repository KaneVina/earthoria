const { formatResponse } = require("../utils/helpers");
const {
  LOYALTY_TIERS,
  getUserLoyaltyProfile,
} = require("../utils/loyaltyTier");

const getMyLoyaltyProfile = async (req, res) => {
  try {
    const profile = await getUserLoyaltyProfile(req.user.id);
    return formatResponse(res, 200, "OK", profile);
  } catch (error) {
    console.error("[getMyLoyaltyProfile]", error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

// Danh sách công khai 5 hạng — dùng cho trang giới thiệu ưu đãi, không cần đăng nhập.
const getLoyaltyTiers = async (req, res) => {
  return formatResponse(res, 200, "OK", LOYALTY_TIERS);
};

module.exports = { getMyLoyaltyProfile, getLoyaltyTiers };
