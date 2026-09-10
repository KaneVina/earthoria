import { create } from "zustand";

// Cờ KHÔNG nhạy cảm, chỉ đánh dấu trình duyệt này đã từng đăng nhập thành công
// ít nhất 1 lần. Dùng để quyết định lúc khởi động app có cần gọi /auth/refresh
// hay không: khách chưa từng đăng nhập thì bỏ qua hẳn request đó, tránh 1 lượt
// gọi mạng thừa và tránh hiện loader "Đang khôi phục phiên làm việc" khi thực
// ra chẳng có phiên nào để khôi phục.
// accessToken vẫn chỉ nằm trong bộ nhớ (state), refreshToken vẫn là cookie
// httpOnly như cũ - cờ này không lưu bất kỳ thông tin đăng nhập nào nên không
// ảnh hưởng tới bảo mật, chỉ là 1 "gợi ý" cho UI.
const SESSION_HINT_KEY = "eo_session_hint";

export function hasStoredSessionHint() {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    // localStorage có thể bị chặn (private mode nghiêm ngặt...) -> không chắc
    // chắn, nên coi như CÓ hint để giữ hành vi an toàn cũ (luôn gọi refresh).
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
  },

  updateUser: (user) => set({ user }),
}));
