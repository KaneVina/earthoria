import { create } from 'zustand'
import { wishlistService } from '../services/wishlistService'

export const useWishlistStore = create((set, get) => ({
  items: [],
  wishlistCount: 0,
  loading: false,

  fetchWishlist: async () => {
    try {
      set({ loading: true })
      const res = await wishlistService.getWishlist()
      const items = res.data.data.items
      set({
        items,
        wishlistCount: items.length,
        loading: false
      })
    } catch {
      set({ loading: false })
    }
  },

  toggleWishlist: async (hashId) => {
    await wishlistService.toggleWishlist(hashId)
    get().fetchWishlist()
  },

  removeFromWishlist: async (hashId) => {
    await wishlistService.removeFromWishlist(hashId)
    get().fetchWishlist()
  },

  isInWishlist: (bookId) => {
    return get().items.some((item) => item.bookId === bookId)
  }
}))