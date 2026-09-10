import { create } from "zustand";
import { cartService } from "../services/cartService";
import { useAuthStore } from "./authStore";

const calcCount = (items) => items.reduce((sum, i) => sum + i.quantity, 0);

export const useCartStore = create((set, get) => ({
  cart: null,
  itemCount: 0,
  loading: false,
  _seq: 0,

  fetchCart: async () => {
    const mySeq = get()._seq + 1;
    set({ _seq: mySeq, loading: true });
    try {
      const res = await cartService.getCart();
      const cart = res.data.data;
      if (get()._seq !== mySeq) return; // đã có thao tác mới hơn -> bỏ qua, không đè state
      set({
        cart,
        itemCount: calcCount(cart.items),
        loading: false,
      });
    } catch {
      if (get()._seq !== mySeq) return;
      set({ cart: null, itemCount: 0, loading: false });
    }
  },

  addToCart: async (hashId, quantity = 1, format = "PHYSICAL") => {
    const prev = get().cart;
    const existing = prev?.items?.find(
      (i) => i.variant?.book?.hashId === hashId && i.variant?.format === format,
    );

    const mySeq = get()._seq + 1;
    set({ _seq: mySeq });

    if (prev) {
      const newItems = existing
        ? prev.items.map((i) =>
            i.variant?.book?.hashId === hashId && i.variant?.format === format
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          )
        : [
            ...prev.items,
            {
              id: `temp-${hashId}-${format}`,
              quantity,
              variant: {
                price: 0,
                salePrice: null,
                format,
                book: { hashId, title: "", coverImage: "" },
              },
            },
          ];
      set({
        cart: { ...prev, items: newItems },
        itemCount: calcCount(newItems),
      });
    }

    try {
      const res = await cartService.addToCart({ hashId, quantity, format });
      const cart = res.data.data;
      if (get()._seq !== mySeq) return; // đã có thao tác mới hơn -> không ghi đè
      set({ cart, itemCount: calcCount(cart.items) });
    } catch (err) {
      if (get()._seq === mySeq) await get().fetchCart();
      throw err;
    }
  },

  setLocalQuantity: (itemId, quantity) => {
    const prev = get().cart;
    if (!prev) return;
    const newItems = prev.items.map((i) =>
      i.id === itemId ? { ...i, quantity } : i,
    );
    set({ cart: { ...prev, items: newItems }, itemCount: calcCount(newItems) });
  },

  updateItem: async (itemId, quantity) => {
    const mySeq = get()._seq + 1;
    set({ _seq: mySeq });

    try {
      const res = await cartService.updateItem(itemId, quantity);
      const cart = res.data.data;

      // Nếu đã có request mới hơn gửi đi sau request này => bỏ qua, không ghi đè state
      if (get()._seq !== mySeq) return;

      set({ cart, itemCount: calcCount(cart.items) });
    } catch (err) {
      if (get()._seq !== mySeq) return;
      await get().fetchCart();
      throw err;
    }
  },

  removeItem: async (itemId) => {
    const prev = get().cart;
    const mySeq = get()._seq + 1;
    set({ _seq: mySeq });

    // Optimistic: xoá ngay khỏi danh sách
    if (prev) {
      const newItems = prev.items.filter((i) => i.id !== itemId);
      const newCart = { ...prev, items: newItems };
      set({ cart: newCart, itemCount: calcCount(newItems) });
    }

    try {
      const res = await cartService.removeItem(itemId);
      const cart = res.data.data;
      if (get()._seq !== mySeq) return;
      set({ cart, itemCount: calcCount(cart.items) });
    } catch (err) {
      if (get()._seq === mySeq) await get().fetchCart();
      throw err;
    }
  },

  // Reset state cục bộ (KHÔNG gọi API) - dùng khi logout để header không còn
  // hiển thị số lượng giỏ hàng của phiên cũ.
  resetCart: () => {
    const mySeq = get()._seq + 1; // huỷ mọi request cart đang bay dở
    set({ _seq: mySeq, cart: null, itemCount: 0, loading: false });
  },

  clearCart: async () => {
    const prev = get().cart;
    const mySeq = get()._seq + 1;
    set({
      _seq: mySeq,
      cart: prev ? { ...prev, items: [], total: 0 } : prev,
      itemCount: 0,
    });

    try {
      const res = await cartService.clearCart();
      const cart = res.data.data;
      if (get()._seq !== mySeq) return;
      set({ cart, itemCount: 0 });
    } catch (err) {
      if (get()._seq === mySeq) await get().fetchCart();
      throw err;
    }
  },
}));

// Tự reset ngay khi isAuthenticated chuyển true -> false (logout, kể cả
// logout tự động do 401 hết phiên). Đặt ở đây (thay vì để authStore import
// cartStore rồi gọi resetCart) để tránh vòng lặp phụ thuộc: authStore ->
// cartStore -> cartService -> api -> authStore (api.js luôn import authStore
// để lấy accessToken) - vòng lặp đó khiến Vite dev server full-reload thay
// vì HMR mỗi khi sửa gần như bất kỳ file service nào.
useAuthStore.subscribe((state, prevState) => {
  if (prevState.isAuthenticated && !state.isAuthenticated) {
    useCartStore.getState().resetCart();
  }
});
