import api from "./api";

export const loyaltyService = {
  getMyProfile: () => api.get("/loyalty/me"),
  getTiers: () => api.get("/loyalty/tiers"),
};