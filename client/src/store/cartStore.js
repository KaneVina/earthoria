import { create } from 'zustand'
import { cartService } from '../services/cartService'

export const useCartStore = create((set, get) => ({
  cart: null,
  itemCount: 0,
  loading: false,

  fetchCart: async () => {
    try {
      set({ loading: true })
      const res = await cartService.getCart()
      const cart = res.data.data
      set({
        cart,
        itemCount: cart.items.reduce((sum, i) => sum + i.quantity, 0),
        loading: false
      })
    } catch {
      set({ loading: false })
    }
  },

  addToCart: async (hashId, quantity = 1) => {
    await cartService.addToCart({ hashId, quantity })
    get().fetchCart()
  },

  updateItem: async (itemId, quantity) => {
    await cartService.updateItem(itemId, quantity)
    get().fetchCart()
  },

  removeItem: async (itemId) => {
    await cartService.removeItem(itemId)
    get().fetchCart()
  },

  clearCart: async () => {
    await cartService.clearCart()
    set({ cart: null, itemCount: 0 })
  }
}))