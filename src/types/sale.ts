export interface SaleItem {
  product_id: string;
  product_name: string;
  qty: number;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
}

export interface CreateSaleRequest {
  store_id: string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  discount?: number;
  items: SaleItem[];
}

export interface SaleListItem {
  id: string;
  sale_number: string;
  status: string;
  customer_name: string | null;
  total: number;
  amount_paid: number;
  created_at: string | null;
}

export interface SaleDetail {
  id: string;
  sale_number: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amount_paid: number;
  payment_methods: Record<string, number> | null;
  notes: string | null;
  items: SaleItem[];
  created_at: string | null;
}

export interface SaleReturnResult {
  sale_id: string;
  status: string;
  refund_amount: number;
}

export interface SaleQueryParams {
  page?: number;
  page_size?: number;
  status?: string;
  from_date?: string;
  to_date?: string;
  cashier_id?: string;
}
