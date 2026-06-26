import { create } from 'zustand'
import { cartService } from '../services/cartService'

const calcCount = (items) => items.reduce((sum, i) => sum + i.quantity, 0)

export const useCartStore = create((set, get) => ({
  cart: null,
  itemCount: 0,
  loading: false,

  // Giữ nguyên — chỉ gọi 1 lần lúc mount
  fetchCart: async () => {
    try {
      set({ loading: true })
      const res = await cartService.getCart()
      const cart = res.data.data
      set({
        cart,
        itemCount: calcCount(cart.items),
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  // Optimistic: cập nhật UI ngay, sync API ngầm, rollback nếu lỗi
  addToCart: async (hashId, quantity = 1) => {
    const prev = get().cart

    // 1. Tìm item đã có chưa
    const existing = prev?.items?.find((i) => i.book?.hashId === hashId)

    // 2. Cập nhật state ngay lập tức
    if (prev) {
      const newItems = existing
        ? prev.items.map((i) =>
            i.book?.hashId === hashId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        : [
            ...prev.items,
            // Placeholder — sẽ được ghi đè sau fetchCart nếu cần
            {
              id: `temp-${hashId}`,
              quantity,
              book: { hashId, title: '', price: 0, coverImage: '' },
            },
          ]

      const newCart = { ...prev, items: newItems }
      set({ cart: newCart, itemCount: calcCount(newItems) })
    }

    // 3. Gọi API ngầm — không await ở UI
    try {
      await cartService.addToCart({ hashId, quantity })
      // Sync lại để lấy đúng id/price từ server (chỉ 1 lần)
      const res = await cartService.getCart()
      const cart = res.data.data
      set({ cart, itemCount: calcCount(cart.items) })
    } catch {
      // Rollback về state trước khi optimistic
      set({
        cart: prev,
        itemCount: prev ? calcCount(prev.items) : 0,
      })
    }
  },

  updateItem: async (itemId, quantity) => {
    const prev = get().cart

    // Optimistic: cập nhật số lượng ngay
    if (prev) {
      const newItems = prev.items.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      )
      const newCart = { ...prev, items: newItems }
      set({ cart: newCart, itemCount: calcCount(newItems) })
    }

    try {
      await cartService.updateItem(itemId, quantity)
      // Không cần fetchCart — UI đã đúng rồi
    } catch {
      // Rollback
      set({
        cart: prev,
        itemCount: prev ? calcCount(prev.items) : 0,
      })
    }
  },

  removeItem: async (itemId) => {
    const prev = get().cart

    // Optimistic: xoá ngay khỏi danh sách
    if (prev) {
      const newItems = prev.items.filter((i) => i.id !== itemId)
      const newCart = { ...prev, items: newItems }
      set({ cart: newCart, itemCount: calcCount(newItems) })
    }

    try {
      await cartService.removeItem(itemId)
    } catch {
      // Rollback
      set({
        cart: prev,
        itemCount: prev ? calcCount(prev.items) : 0,
      })
    }
  },

  clearCart: async () => {
    const prev = get().cart
    set({ cart: { ...prev, items: [] }, itemCount: 0 })

    try {
      await cartService.clearCart()
    } catch {
      set({ cart: prev, itemCount: prev ? calcCount(prev.items) : 0 })
    }
  },
}))