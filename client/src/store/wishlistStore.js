import { create } from 'zustand'
import { wishlistService } from '../services/wishlistService'

export const useWishlistStore = create((set, get) => ({
  items: [],          // array of book object (đã encodeBook, có hashId, slug, ...)
  wishlistCount: 0,
  loading: false,
  toggling: new Set(), // track hashId đang pending để chặn double-click

  fetchWishlist: async () => {
    try {
      set({ loading: true })
      const res = await wishlistService.getWishlist()
      // bookController getWishlist trả về: res.data.data = array book
      const items = res.data.data || []
      set({ items, wishlistCount: items.length, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  // Optimistic toggle — chặn double-click bằng toggling Set
  toggleWishlist: async (slug, hashId) => {
    const { toggling, items } = get()

    // Chặn nếu đang xử lý
    if (toggling.has(hashId)) return

    // Lock
    const newToggling = new Set(toggling)
    newToggling.add(hashId)
    set({ toggling: newToggling })

    const isIn = items.some((b) => b.hashId === hashId)

    // Optimistic update ngay
    const newItems = isIn
      ? items.filter((b) => b.hashId !== hashId)
      : [...items, { hashId, slug }] // placeholder, sẽ sync sau

    set({ items: newItems, wishlistCount: newItems.length })

    try {
      await wishlistService.toggleWishlist(slug, hashId)
      // Sync để lấy full book data từ server
      const res = await wishlistService.getWishlist()
      const synced = res.data.data || []
      set({ items: synced, wishlistCount: synced.length })
    } catch {
      // Rollback
      set({ items, wishlistCount: items.length })
    } finally {
      // Unlock
      const finalToggling = new Set(get().toggling)
      finalToggling.delete(hashId)
      set({ toggling: finalToggling })
    }
  },

  isInWishlist: (hashId) => {
    return get().items.some((b) => b.hashId === hashId)
  },
}))