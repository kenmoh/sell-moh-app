import { Product } from "@/types/product-types";
import { create } from "zustand";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  id: string;
  name: string;
  sessionId?: string;
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
  createCart: (name?: string, sessionId?: string, customerName?: string, customerPhone?: string) => string;
  deleteCart: (cartId: string) => void;
  setActiveCart: (cartId: string) => void;
  addItemToCart: (cartId: string, product: Product, quantity?: number) => void;
  removeItemFromCart: (cartId: string, productId: string) => void;
  updateQuantityInCart: (
    cartId: string,
    productId: string,
    quantity: number,
  ) => void;
  clearCartById: (cartId: string) => void;
  setCartCoupon: (cartId: string, code: string | null, discountAmount?: number) => void;
  clearCartCoupon: (cartId: string) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  activeCouponCode: () => string | null;
  activeDiscountAmount: () => number;
}

const initialCart: Cart = { id: "cart-1", name: "Cart 1", items: [] };
cartCounter = 2;

const useCartStore = create<CartState>((set, get) => ({
  carts: [initialCart],
  activeCartId: "cart-1",

  createCart: (name?: string, sessionId?: string, customerName?: string, customerPhone?: string) => {
    const id = `cart-${cartCounter}`;
    const cartName = name || `Cart ${cartCounter}`;
    cartCounter++;
    set((state) => ({
      carts: [
        ...state.carts,
        { id, name: cartName, sessionId, customerName, customerPhone, items: [] },
      ],
      activeCartId: id,
    }));
    return id;
  },

  deleteCart: (cartId) =>
    set((state) => {
      const filtered = state.carts.filter((c) => c.id !== cartId);
      if (filtered.length === 0) {
        const newCart: Cart = { id: "cart-1", name: "Cart 1", items: [] };
        cartCounter = 2;
        return { carts: [newCart], activeCartId: "cart-1" };
      }
      return {
        carts: filtered,
        activeCartId:
          state.activeCartId === cartId ? filtered[0].id : state.activeCartId,
      };
    }),

  setActiveCart: (cartId) => set({ activeCartId: cartId }),

  addItemToCart: (cartId, product, quantity = 1) =>
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
        return { ...cart, items: [...cart.items, { product, quantity }] };
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

  addItem: (product, quantity) => {
    const { activeCartId, addItemToCart } = get();
    addItemToCart(activeCartId, product, quantity);
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
