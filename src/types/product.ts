export interface CreateCategory {
  name: string;
  description: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  created_at: string;
}

export interface StockHistoryItem {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  store_id: string;
  store_name?: string;
  movement_type: string;
  qty_change: number;
  balance_before: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  reason?: string;
  unit_cost?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number;
  cost_price: number;
  category: string | null;
  status: string;
  image_url: string | null;
  qr_url: string | null;
  reorder_point: number;
  qty: number;
  reserved_qty: number;
  available: number;
  min_stock_level: number;
  unit_cost: number | null;
  history: StockHistoryItem[];
}

export interface PaginatedResponse<T> {
  data: ProductResponse[];
  total: number;
  page: number;
  page_size: number;
  message: string | null;
}

export interface ProductQueryParams {
  page?: number;
  page_size?: number;
  low_stock?: boolean;
  category?: string;
  search?: string;
}

export interface CreateProduct {
  name: string;
  description?: string | null;
  category_id?: string | null;
  unit?: string | null;
  cost_price: number;
  selling_price: number;
  tax_rate?: number | null;
  reorder_point: number;
  qty?: number;
  metadata?: Record<string, any> | null;
}

export interface AdjustProduct {
  product_id: string;
  store_id?: string;
  reason: string;
  qty_change: number;
  unit_cost: number;
  notes?: string | null;
}
