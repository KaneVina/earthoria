import { create } from 'zustand'

// LƯU Ý: accessToken KHÔNG còn lưu localStorage nữa — chỉ giữ trong memory.
// Lý do: localStorage đọc được bởi bất kỳ script nào chạy trên trang (rủi ro
// XSS), trong khi giờ token sống rất ngắn (15-30p) và refresh token thật sự
// nằm trong cookie HttpOnly nên JS không đọc được. Hệ quả: F5 trang sẽ mất
// accessToken trong state, cần bootstrap lại bằng gọi /auth/refresh lúc app
// khởi động (xem App.jsx).
export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  authChecked: false, // đã thử bootstrap (gọi /auth/refresh) lúc load app chưa

  setAuth: (user, accessToken) => {
    set({ user, accessToken, isAuthenticated: true, authChecked: true })
  },

  setAuthChecked: () => set({ authChecked: true }),

  logout: () => {
    set({ user: null, accessToken: null, isAuthenticated: false, authChecked: true })
  },

  updateUser: (user) => set({ user }),
}))