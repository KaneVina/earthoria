import api, { refreshSession } from "./api";

export const authService = {
  login: (data) => api.post("/auth/login", data),
  refresh: (opts) => refreshSession(opts),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/update-profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  sendRegisterOtp: (data) => api.post("/auth/send-register-otp", data),
  verifyRegisterOtp: (data) => api.post("/auth/verify-register-otp", data),
  verifyOtp: (data) => api.post("/auth/verify-otp", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  sendCreatePasswordOtp: () => api.post("/auth/send-create-password-otp"),
  createPassword: (data) => api.post("/auth/create-password", data),
};
