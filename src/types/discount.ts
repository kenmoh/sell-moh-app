// ── Discount (Promotion) ──────────────────────────────────────────────────

export interface Discount {
  id: string;
  name: string;
  discount_type: "percentage" | "fixed_amount" | "buy_x_get_y";
  value: number;
  buy_x_get_y_free_qty: number;
  scope: "all" | "specific_products" | "specific_categories";
  min_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  product_ids: string[];
  category_ids: string[];
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateDiscountRequest {
  name: string;
  discount_type: "percentage" | "fixed_amount" | "buy_x_get_y";
  value: number;
  buy_x_get_y_free_qty?: number;
  scope?: "all" | "specific_products" | "specific_categories";
  min_order?: number;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  product_ids?: string[];
  category_ids?: string[];
}

export interface UpdateDiscountRequest {
  name?: string;
  discount_type?: "percentage" | "fixed_amount" | "buy_x_get_y";
  value?: number;
  buy_x_get_y_free_qty?: number;
  scope?: "all" | "specific_products" | "specific_categories";
  min_order?: number;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  product_ids?: string[];
  category_ids?: string[];
}

// ── Coupon ───────────────────────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  value: number;
  max_uses: number;
  used_count: number;
  min_order: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateCouponRequest {
  code: string;
  discount_type: "percentage" | "fixed_amount";
  value: number;
  max_uses?: number;
  min_order?: number;
  is_active?: boolean;
  expires_at?: string | null;
}

export interface UpdateCouponRequest {
  code?: string;
  discount_type?: "percentage" | "fixed_amount";
  value?: number;
  max_uses?: number;
  min_order?: number;
  is_active?: boolean;
  expires_at?: string | null;
}

export interface ValidateCouponResponse {
  valid: boolean;
  coupon_id: string | null;
  code: string | null;
  discount_type: string | null;
  discount_amount: number;
  final_total: number;
  message: string;
}

// ── Paginated ────────────────────────────────────────────────────────────

export interface PaginatedDiscounts {
  items: Discount[];
  total: number;
  page: number;
  page_size: number;
}

export interface PaginatedCoupons {
  items: Coupon[];
  total: number;
  page: number;
  page_size: number;
}
