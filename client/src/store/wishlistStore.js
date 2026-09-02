import { create } from "zustand";
import { wishlistService } from "../services/wishlistService";

export const useWishlistStore = create((set, get) => ({
  items: [], // array of book object (đã encodeBook, có hashId, slug, ...)
  wishlistCount: 0,
  loading: false,
  toggling: new Set(), // track hashId đang pending để chặn double-click
  _seq: 0,

  fetchWishlist: async () => {
    const mySeq = get()._seq + 1;
    set({ _seq: mySeq, loading: true });
    try {
      const res = await wishlistService.getWishlist();
      // bookController getWishlist trả về: res.data.data = array book
      const items = res.data.data || [];
      if (get()._seq !== mySeq) return;
      set({ items, wishlistCount: items.length, loading: false });
    } catch {
      if (get()._seq !== mySeq) return;
      set({ loading: false });
    }
  },

  // Optimistic toggle để chặn double-click bằng toggling Set
  toggleWishlist: async (slug, hashId) => {
    const { toggling, items } = get();

    // Chặn nếu đang xử lý
    if (toggling.has(hashId)) return false;

    // Lock
    const newToggling = new Set(toggling);
    newToggling.add(hashId);
    set({ toggling: newToggling });

    const isIn = items.some((b) => b.hashId === hashId);

    // Optimistic update ngay
    const newItems = isIn
      ? items.filter((b) => b.hashId !== hashId)
      : [...items, { hashId, slug }]; // placeholder, sẽ sync sau

    const mySeq = get()._seq + 1;
    set({ _seq: mySeq, items: newItems, wishlistCount: newItems.length });

    try {
      await wishlistService.toggleWishlist(slug, hashId);
      // Sync để lấy full book data từ server
      const res = await wishlistService.getWishlist();
      const synced = res.data.data || [];
      if (get()._seq === mySeq) {
        set({ items: synced, wishlistCount: synced.length });
      }
      return true;
    } catch {
      // Rollback — chỉ rollback nếu vẫn là thao tác mới nhất, tránh đè lên 1 thao tác
      // mới hơn đã chạy sau đó
      if (get()._seq === mySeq) {
        set({ items, wishlistCount: items.length });
      }
      return false;
    } finally {
      // Unlock
      const finalToggling = new Set(get().toggling);
      finalToggling.delete(hashId);
      set({ toggling: finalToggling });
    }
  },

  isInWishlist: (hashId) => {
    return get().items.some((b) => b.hashId === hashId);
  },

  isToggling: (hashId) => {
    return get().toggling.has(hashId);
  },
}));
