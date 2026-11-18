import { getDb } from '..';

export interface LocalCartItemInput {
  product_id: string;
  product_name: string;
  price: number;
  qty: number;
  extra?: number;
  item_id?: string;
}

export interface LocalCartItem {
  id: number;
  cart_id: string;
  product_id: string;
  product_name: string;
  price: number;
  qty: number;
  extra: number;
  item_id: string | null;
  updated_at: string;
}

export interface LocalCart {
  id: string;
  name: string;
  store_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  coupon_code: string | null;
  discount_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export class LocalCartRepository {
  async createCart(input: {
    id: string;
    name: string;
    store_id?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
  }): Promise<LocalCart> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO local_carts (id, name, store_id, customer_name, customer_phone, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`,
      [input.id, input.name, input.store_id ?? null, input.customer_name ?? null, input.customer_phone ?? null, now, now]
    );
    return {
      id: input.id,
      name: input.name,
      store_id: input.store_id ?? null,
      customer_name: input.customer_name ?? null,
      customer_phone: input.customer_phone ?? null,
      coupon_code: null,
      discount_amount: 0,
      status: 'open',
      created_at: now,
      updated_at: now,
    };
  }

  async getCart(cartId: string): Promise<LocalCart | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<LocalCart>('SELECT * FROM local_carts WHERE id = ?', [cartId]);
    return row ?? null;
  }

  async listOpenCarts(): Promise<LocalCart[]> {
    const db = await getDb();
    return db.getAllAsync<LocalCart>('SELECT * FROM local_carts WHERE status = ? ORDER BY updated_at DESC', ['open']);
  }

  async updateCart(cartId: string, updates: Partial<LocalCart>): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: (string | number | null | boolean)[] = [];
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.store_id !== undefined) { fields.push('store_id = ?'); values.push(updates.store_id); }
    if (updates.customer_name !== undefined) { fields.push('customer_name = ?'); values.push(updates.customer_name); }
    if (updates.customer_phone !== undefined) { fields.push('customer_phone = ?'); values.push(updates.customer_phone); }
    if (updates.coupon_code !== undefined) { fields.push('coupon_code = ?'); values.push(updates.coupon_code); }
    if (updates.discount_amount !== undefined) { fields.push('discount_amount = ?'); values.push(updates.discount_amount); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (!fields.length) return;
    values.push(now, cartId);
    await db.runAsync(`UPDATE local_carts SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`, ...values);
  }

  async deleteCart(cartId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM local_cart_items WHERE cart_id = ?', [cartId]);
    await db.runAsync('DELETE FROM local_carts WHERE id = ?', [cartId]);
  }

  async getCartItems(cartId: string): Promise<LocalCartItem[]> {
    const db = await getDb();
    return db.getAllAsync<LocalCartItem>(
      'SELECT * FROM local_cart_items WHERE cart_id = ? ORDER BY id ASC',
      [cartId]
    );
  }

  async upsertCartItem(cartId: string, item: LocalCartItemInput): Promise<LocalCartItem> {
    const db = await getDb();
    const now = new Date().toISOString();
    const existing = await db.getFirstAsync<LocalCartItem>(
      'SELECT * FROM local_cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, item.product_id]
    );
    if (existing) {
      const qty = Number(existing.qty) + Number(item.qty);
      await db.runAsync(
        `UPDATE local_cart_items SET qty = ?, price = ?, extra = COALESCE(?, extra), updated_at = ? WHERE id = ?`,
        [qty, item.price, item.extra ?? 0, now, existing.id]
      );
      return { ...existing, qty, price: item.price, extra: item.extra ?? 0, updated_at: now };
    }
    const result = await db.runAsync(
      `INSERT INTO local_cart_items (cart_id, product_id, product_name, price, qty, extra, item_id, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      cartId,
      item.product_id,
      item.product_name,
      item.price,
      item.qty,
      item.extra ?? 0,
      item.item_id ?? null,
      now
    );
    return {
      id: Number(result.lastInsertRowId),
      cart_id: cartId,
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      qty: item.qty,
      extra: item.extra ?? 0,
      item_id: item.item_id ?? null,
      updated_at: now,
    };
  }

  async updateCartItemQty(cartId: string, productId: string, qty: number): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    if (qty <= 0) {
      await db.runAsync('DELETE FROM local_cart_items WHERE cart_id = ? AND product_id = ?', [cartId, productId]);
      return;
    }
    await db.runAsync(
      'UPDATE local_cart_items SET qty = ?, updated_at = ? WHERE cart_id = ? AND product_id = ?',
      [qty, now, cartId, productId]
    );
  }

  async updateCartItemExtra(cartId: string, productId: string, extra: number): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE local_cart_items SET extra = ?, updated_at = ? WHERE cart_id = ? AND product_id = ?',
      [extra, now, cartId, productId]
    );
  }

  async removeCartItem(cartId: string, productId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM local_cart_items WHERE cart_id = ? AND product_id = ?', [cartId, productId]);
  }

  async clearCartItems(cartId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM local_cart_items WHERE cart_id = ?', [cartId]);
  }
}

export const localCartRepo = new LocalCartRepository();
