import { create } from "zustand";
import { useCartStore } from "./cartStore";
import { useWishlistStore } from "./wishlistStore";
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
    useCartStore.getState().resetCart();
    useWishlistStore.getState().resetWishlist();
    queryClient.clear();
  },

  updateUser: (user) => set({ user }),
}));
