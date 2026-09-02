import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_COMPARE = 3;

export const useCompareStore = create(
  persist(
    (set, get) => ({
      items: [],

      isSelected: (hashId) => get().items.some((i) => i.hashId === hashId),

      toggleItem: (book) => {
        const { items } = get();
        const exists = items.some((i) => i.hashId === book.hashId);
        if (exists) {
          set({ items: items.filter((i) => i.hashId !== book.hashId) });
          return { added: false };
        }
        if (items.length >= MAX_COMPARE) {
          return { added: false, limitReached: true };
        }
        set({ items: [...items, book] });
        return { added: true };
      },

      removeItem: (hashId) =>
        set({ items: get().items.filter((i) => i.hashId !== hashId) }),

      clear: () => set({ items: [] }),

      maxCompare: MAX_COMPARE,
    }),
    { name: "earthoria-compare" },
  ),
);
