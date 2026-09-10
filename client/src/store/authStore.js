import { create } from "zustand";
import { queryClient } from "../lib/queryClient";

const SESSION_HINT_KEY = "eo_session_hint";

export function hasStoredSessionHint() {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return true;
  }
}

function markSessionHint() {
  try {
    localStorage.setItem(SESSION_HINT_KEY, "1");
  } catch {
    // bỏ qua nếu trình duyệt chặn localStorage
  }
}

function clearSessionHint() {
  try {
    localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // bỏ qua nếu trình duyệt chặn localStorage
  }
}

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  authChecked: false,

  setAuth: (user, accessToken) => {
    markSessionHint();
    set({ user, accessToken, isAuthenticated: true, authChecked: true });
  },

  setAuthChecked: () => set({ authChecked: true }),

  logout: () => {
    clearSessionHint();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      authChecked: true,
    });
    // Cố ý KHÔNG import/gọi trực tiếp cartStore hay wishlistStore ở đây.
    // 2 store đó tự lắng nghe isAuthenticated (subscribe ở cuối file của
    // chúng) để tự reset khi logout. Nếu authStore quay lại import cartStore/
    // wishlistStore sẽ tạo vòng lặp phụ thuộc: authStore -> cartStore ->
    // cartService -> api -> authStore (api.js luôn import authStore để lấy
    // accessToken). Vòng lặp này khiến Vite dev server mất khả năng xác định
    // ranh giới HMR khi sửa hầu như bất kỳ service/file nào (vì gần như mọi
    // service đều đi qua api.js) -> rơi về full page reload mỗi lần sửa code,
    // thay vì hot update như bình thường.
    queryClient.clear();
  },

  updateUser: (user) => set({ user }),
}));
