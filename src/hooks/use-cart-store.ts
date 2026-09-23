import { Product } from "@/types/product-types";
import { create } from "zustand";

export interface CartItem {
  product: Product;
  quantity: number;
  itemId?: string;
}

export interface Cart {
  id: string;
  name: string;
  sessionId?: string;
  storeId?: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  couponCode?: string | null;
  discountAmount?: number;
}

let cartCounter = 1;

interface CartState {
  carts: Cart[];
  activeCartId: string;
  storeCartIds: Record<string, string>;
  switchStore: (storeId: string) => void;
  createCart: (name?: string, sessionId?: string, customerName?: string, customerPhone?: string, storeId?: string) => string;
  deleteCart: (cartId: string) => void;
  setActiveCart: (cartId: string) => void;
  addItemToCart: (cartId: string, product: Product, quantity?: number, itemId?: string) => void;
  removeItemFromCart: (cartId: string, productId: string) => void;
  updateQuantityInCart: (
    cartId: string,
    productId: string,
    quantity: number,
  ) => void;
  clearCartById: (cartId: string) => void;
  removeCart: (cartId: string) => void;
  setCartCoupon: (cartId: string, code: string | null, discountAmount?: number) => void;
  clearCartCoupon: (cartId: string) => void;
  addItem: (product: Product, quantity?: number, itemId?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  activeCouponCode: () => string | null;
  activeDiscountAmount: () => number;
}

const useCartStore = create<CartState>((set, get) => ({
  carts: [],
  activeCartId: "",
  storeCartIds: {},

  switchStore: (storeId) => {
    if (!storeId) {
      set({ activeCartId: "" });
      return;
    }
    const { storeCartIds, carts } = get();
    const cartId = storeCartIds[storeId];
    if (cartId && carts.find((c) => c.id === cartId)) {
      set({ activeCartId: cartId });
    } else {
      set({ activeCartId: "" });
    }
  },

  createCart: (name?, sessionId?, customerName?, customerPhone?, storeId?) => {
    const id = `cart-${cartCounter}`;
    const cartName = name || `Cart ${cartCounter}`;
    cartCounter++;
    set((state) => {
      const newStoreCartIds = storeId
        ? { ...state.storeCartIds, [storeId]: id }
        : state.storeCartIds;
      return {
        carts: [
          ...state.carts,
          { id, name: cartName, sessionId, storeId, customerName, customerPhone, items: [] },
        ],
        activeCartId: id,
        storeCartIds: newStoreCartIds,
      };
    });
    return id;
  },

  deleteCart: (cartId) =>
    set((state) => {
      const filtered = state.carts.filter((c) => c.id !== cartId);
      const deletedCart = state.carts.find((c) => c.id === cartId);
      const newStoreCartIds = { ...state.storeCartIds };
      if (deletedCart?.storeId && newStoreCartIds[deletedCart.storeId] === cartId) {
        delete newStoreCartIds[deletedCart.storeId];
      }
      return {
        carts: filtered,
        activeCartId:
          state.activeCartId === cartId ? (filtered[0]?.id ?? "") : state.activeCartId,
        storeCartIds: newStoreCartIds,
      };
    }),

  setActiveCart: (cartId) => set({ activeCartId: cartId }),

  addItemToCart: (cartId, product, quantity = 1, itemId) =>
    set((state) => ({
      carts: state.carts.map((cart) => {
        if (cart.id !== cartId) return cart;
        const existing = cart.items.find((i) => i.product.id === product.id);
        if (existing) {
          return {
            ...cart,
            items: cart.items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            ),
          };
        }
        return {
          ...cart,
          items: [...cart.items, { product, quantity, itemId }],
        };
      }),
    })),

  removeItemFromCart: (cartId, productId) =>
    set((state) => ({
      carts: state.carts.map((cart) =>
        cart.id === cartId
          ? { ...cart, items: cart.items.filter((i) => i.product.id !== productId) }
          : cart,
      ),
    })),

  updateQuantityInCart: (cartId, productId, quantity) =>
    set((state) => ({
      carts: state.carts.map((cart) =>
        cart.id === cartId
          ? {
              ...cart,
              items:
                quantity <= 0
                  ? cart.items.filter((i) => i.product.id !== productId)
                  : cart.items.map((i) =>
                      i.product.id === productId ? { ...i, quantity } : i,
                    ),
            }
          : cart,
      ),
    })),

  clearCartById: (cartId) =>
    set((state) => ({
      carts: state.carts.map((cart) =>
        cart.id === cartId ? { ...cart, items: [], couponCode: null, discountAmount: 0 } : cart,
      ),
    })),

  removeCart: (cartId) =>
    set((state) => {
      const removedCart = state.carts.find((c) => c.id === cartId);
      const newStoreCartIds = { ...state.storeCartIds };
      if (removedCart?.storeId && newStoreCartIds[removedCart.storeId] === cartId) {
        delete newStoreCartIds[removedCart.storeId];
      }
      return {
        carts: state.carts.filter((cart) => cart.id !== cartId),
        activeCartId: state.activeCartId === cartId ? "" : state.activeCartId,
        storeCartIds: newStoreCartIds,
      };
    }),

  setCartCoupon: (cartId, code, discountAmount = 0) =>
    set((state) => ({
      carts: state.carts.map((cart) =>
        cart.id === cartId
          ? { ...cart, couponCode: code, discountAmount }
          : cart,
      ),
    })),

  clearCartCoupon: (cartId) =>
    set((state) => ({
      carts: state.carts.map((cart) =>
        cart.id === cartId
          ? { ...cart, couponCode: null, discountAmount: 0 }
          : cart,
      ),
    })),

  addItem: (product, quantity, itemId) => {
    const { activeCartId, addItemToCart } = get();
    addItemToCart(activeCartId, product, quantity, itemId);
  },

  removeItem: (productId) => {
    const { activeCartId, removeItemFromCart } = get();
    removeItemFromCart(activeCartId, productId);
  },

  updateQuantity: (productId, quantity) => {
    const { activeCartId, updateQuantityInCart } = get();
    updateQuantityInCart(activeCartId, productId, quantity);
  },

  clearCart: () => {
    const { activeCartId, clearCartById } = get();
    clearCartById(activeCartId);
  },

  totalItems: () => {
    const { carts, activeCartId } = get();
    const cart = carts.find((c) => c.id === activeCartId);
    return cart ? cart.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  },

  totalPrice: () => {
    const { carts, activeCartId } = get();
    const cart = carts.find((c) => c.id === activeCartId);
    return cart
      ? cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
      : 0;
  },

  activeCouponCode: () => {
    const { carts, activeCartId } = get();
    const cart = carts.find((c) => c.id === activeCartId);
    return cart?.couponCode ?? null;
  },

  activeDiscountAmount: () => {
    const { carts, activeCartId } = get();
    const cart = carts.find((c) => c.id === activeCartId);
    return cart?.discountAmount ?? 0;
  },
}));

export default useCartStore;
