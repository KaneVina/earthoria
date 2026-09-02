import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  authChecked: false,

  setAuth: (user, accessToken) => {
    set({ user, accessToken, isAuthenticated: true, authChecked: true });
  },

  setAuthChecked: () => set({ authChecked: true }),

  logout: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      authChecked: true,
    });
  },

  updateUser: (user) => set({ user }),
}));
