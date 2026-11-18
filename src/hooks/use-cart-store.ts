import { Product } from "@/types/product-types";
import { create } from "zustand";
import { localCartRepo } from "@/database/repositories/local-cart.repo";

export interface CartItem {
  product: Product;
  quantity: number;
  itemId?: string;
  extra?: number;
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
  addItemToCart: (
    cartId: string,
    product: Product,
    quantity?: number,
    itemId?: string,
    extra?: number,
  ) => void;
  removeItemFromCart: (cartId: string, productId: string) => void;
  updateQuantityInCart: (
    cartId: string,
    productId: string,
    quantity: number,
  ) => void;
  updateItemExtra: (cartId: string, productId: string, extra: number) => void;
  clearCartById: (cartId: string) => void;
  removeCart: (cartId: string) => void;
  setCartCoupon: (cartId: string, code: string | null, discountAmount?: number) => void;
  clearCartCoupon: (cartId: string) => void;
  createLocalCart: (name?: string, storeId?: string) => string;
  saveLocalCart: (cartId: string) => Promise<void>;
  loadLocalCart: (cartId: string) => Promise<void>;
  deleteLocalCart: (cartId: string) => Promise<void>;
  addItem: (product: Product, quantity?: number, itemId?: string, extra?: number) => void;
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

  addItemToCart: (cartId, product, quantity = 1, itemId, extra) =>
    set((state) => ({
      carts: state.carts.map((cart) => {
        if (cart.id !== cartId) return cart;
        const existing = cart.items.find((i) => i.product.id === product.id);
        if (existing) {
          return {
            ...cart,
            items: cart.items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + quantity, extra: extra ?? i.extra }
                : i,
            ),
          };
        }
        return {
          ...cart,
          items: [...cart.items, { product, quantity, itemId, extra }],
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

  updateItemExtra: (cartId, productId, extra) =>
    set((state) => ({
      carts: state.carts.map((cart) =>
        cart.id === cartId
          ? {
              ...cart,
              items: cart.items.map((i) =>
                i.product.id === productId ? { ...i, extra } : i,
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

  createLocalCart: (name?, storeId?) => {
    const id = `local-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const cartName = name || `Offline Sale ${Math.floor(Math.random() * 1000)}`;
    set((state) => ({
      carts: [
        ...state.carts,
        { id, name: cartName, storeId, customerName: "", customerPhone: "", items: [] },
      ],
      activeCartId: id,
    }));
    void localCartRepo.createCart({ id, name: cartName, store_id: storeId ?? null });
    return id;
  },

  saveLocalCart: async (cartId) => {
    const { carts } = get();
    const cart = carts.find((c) => c.id === cartId);
    if (!cart || !cart.id.startsWith("local-")) return;
    await localCartRepo.updateCart(cartId, {
      name: cart.name,
      store_id: cart.storeId ?? null,
      customer_name: cart.customerName ?? null,
      customer_phone: cart.customerPhone ?? null,
      coupon_code: cart.couponCode ?? null,
      discount_amount: cart.discountAmount ?? 0,
    });
    await localCartRepo.clearCartItems(cartId);
    for (const item of cart.items) {
      await localCartRepo.upsertCartItem(cartId, {
        product_id: item.product.id,
        product_name: item.product.name,
        price: item.product.price,
        qty: item.quantity,
        extra: item.extra,
        item_id: item.itemId ?? undefined,
      });
    }
  },

  loadLocalCart: async (cartId) => {
    const { setActiveCart, addItemToCart } = get();
    const cart = await localCartRepo.getCart(cartId);
    if (!cart) return;
    const items = await localCartRepo.getCartItems(cartId);
    set((state) => {
      const existing = state.carts.find((c) => c.id === cartId);
      const cartRecord = existing
        ? { ...existing, name: cart.name, storeId: cart.store_id ?? undefined, customerName: cart.customer_name ?? undefined, customerPhone: cart.customer_phone ?? undefined, couponCode: cart.coupon_code ?? null, discountAmount: cart.discount_amount ?? 0 }
        : { id: cart.id, name: cart.name, storeId: cart.store_id ?? undefined, customerName: cart.customer_name ?? undefined, customerPhone: cart.customer_phone ?? undefined, couponCode: cart.coupon_code ?? null, discountAmount: cart.discount_amount ?? 0, items: [] };
      return {
        carts: existing
          ? state.carts.map((c) => (c.id === cartId ? cartRecord : c))
          : [...state.carts, cartRecord],
        activeCartId: cartId,
      };
    });
    for (const item of items) {
      const product: Product = {
        id: item.product_id,
        name: item.product_name,
        price: item.price,
        in_stock: 0,
      };
      addItemToCart(cartId, product, item.qty, item.item_id ?? undefined, item.extra);
    }
  },

  deleteLocalCart: async (cartId) => {
    const { removeCart } = get();
    removeCart(cartId);
    await localCartRepo.deleteCart(cartId);
  },

  addItem: (product, quantity, itemId, extra) => {
    const { activeCartId, addItemToCart } = get();
    addItemToCart(activeCartId, product, quantity, itemId, extra);
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
      ? cart.items.reduce((sum, i) => sum + (i.product.price + (i.extra ?? 0)) * i.quantity, 0)
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
