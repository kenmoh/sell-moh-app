export interface CartItemResponse {
  id: string;
  product_id: string;
  product_public_id: string;
  name: string;
  unit_price: number;
  qty: number;
}

export interface CartCreatedResponse {
  id: string;
  session_id: string;
  store_id: string | null;
  status: string;
  customer_name: string;
  resumed: boolean;
}

export interface CartDetailResponse {
  id: string;
  session_id: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  expires_at: string | null;
  items: CartItemResponse[];
}

export interface CartListItem {
  id: string;
  session_id: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  item_count: number;
  total: number;
  created_at: string;
}

export interface CheckoutResultResponse {
  sale_id: string;
  sale_number: string;
  total: number;
  amount_paid: number;
  status: string;
  subtotal?: number;
  discount?: number;
  coupon_code?: string | null;
}

export interface CreateCartRequest {
  store_id: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface CheckoutRequest {
  items?: Array<{
    product_public_id: string;
    qty: number;
    store_id?: string;
  }>;
  customer_name?: string;
  customer_phone?: string;
  store_id?: string;
  coupon_code?: string;
  discount_id?: string;
}

export interface VoidItemRequest {
  supervisor_pin: string;
}

export interface AddToCartRequest {
  product_id: string;
  qty?: number;
}
