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

export interface ProductResponse {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number;
  category: string | null;
  status: string;
  qr_url: string | null;
  qr_payload: string;
  qty: number;
  min_stock_level: number;
  available: number;
  history: Array<{}>;
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
