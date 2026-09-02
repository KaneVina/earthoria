import api from "./api";

export const arService = {
  // kidToken: truyền khi xem từ link/QR riêng của bé (chưa đăng nhập tài khoản chính)
  getArCode: (code, kidToken) =>
    api.get(`/ar/${code}`, kidToken ? { params: { kidToken } } : undefined),
  getMyArBooks: () => api.get("/ar/my-books"),
};
