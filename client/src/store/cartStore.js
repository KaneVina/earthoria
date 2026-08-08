import { create } from 'zustand'
import { cartService } from '../services/cartService'

const calcCount = (items) => items.reduce((sum, i) => sum + i.quantity, 0)

export const useCartStore = create((set, get) => ({
  cart: null,
  itemCount: 0,
  loading: false,
  _updateSeq: {},

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
      set({ cart: null, itemCount: 0, loading: false })
    }
  },

  addToCart: async (hashId, quantity = 1) => {
    const prev = get().cart
    const existing = prev?.items?.find((i) => i.book?.hashId === hashId)

    if (prev) {
      const newItems = existing
        ? prev.items.map((i) =>
            i.book?.hashId === hashId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        : [
            ...prev.items,
            { id: `temp-${hashId}`, quantity, book: { hashId, title: '', price: 0, coverImage: '' } },
          ]
      set({ cart: { ...prev, items: newItems }, itemCount: calcCount(newItems) })
    }

    try {
      const res = await cartService.addToCart({ hashId, quantity })
      const cart = res.data.data
      set({ cart, itemCount: calcCount(cart.items) })
    } catch (err) {
      await get().fetchCart()
      throw err // để component bắt được lỗi và hiện toast.error
    }
  },

  setLocalQuantity: (itemId, quantity) => {
    const prev = get().cart
    if (!prev) return
    const newItems = prev.items.map((i) =>
      i.id === itemId ? { ...i, quantity } : i
    )
    set({ cart: { ...prev, items: newItems }, itemCount: calcCount(newItems) })
  },

 updateItem: async (itemId, quantity) => {
    const seq = get()._updateSeq
    const mySeq = (seq[itemId] || 0) + 1
    set({ _updateSeq: { ...seq, [itemId]: mySeq } })

    try {
      const res = await cartService.updateItem(itemId, quantity)
      const cart = res.data.data

      // Nếu đã có request mới hơn gửi đi sau request này => bỏ qua, không ghi đè state
      if (get()._updateSeq[itemId] !== mySeq) return

      set({ cart, itemCount: calcCount(cart.items) })
    } catch (err) {
      if (get()._updateSeq[itemId] !== mySeq) return
      await get().fetchCart()
      throw err
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
      const res = await cartService.removeItem(itemId)
      const cart = res.data.data
      set({ cart, itemCount: calcCount(cart.items) })
    } catch (err) {
      await get().fetchCart()
      throw err
    }
  },

  clearCart: async () => {
    const prev = get().cart
    set({ cart: prev ? { ...prev, items: [], total: 0 } : prev, itemCount: 0 })

    try {
      const res = await cartService.clearCart()
      const cart = res.data.data
      set({ cart, itemCount: 0 })
    } catch (err) {
      await get().fetchCart()
      throw err
    }
  },
}))