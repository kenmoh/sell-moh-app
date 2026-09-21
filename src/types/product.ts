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

// ── Stock Store-Level Types ──────────────────────────────────────────────────

export interface StockBalanceItem {
  product_id: string;
  product_name: string | null;
  sku: string | null;
  qty: number;
  reserved_qty: number;
  committed_qty: number;
  available: number;
  min_stock_level: number;
  unit_cost: number | null;
}

export interface StockMovementItem {
  id: string;
  product_id: string;
  product_name: string | null;
  product_sku: string | null;
  store_id: string;
  store_name: string | null;
  movement_type: string;
  qty_change: number;
  balance_before: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  unit_cost: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface LowStockItem {
  product_id: string;
  product_name: string;
  sku: string | null;
  store_id: string;
  store_name: string | null;
  qty: number;
  min_stock_level: number;
  available: number;
}

export interface DistributeResult {
  from_adjustment_id: string;
  to_adjustment_id: string;
  from_new_balance: number;
  to_new_balance: number;
}

export interface MinStockLevelResult {
  store_id: string;
  product_id: string;
  min_stock_level: number;
}

export interface StoreDistributePayload {
  product_id: string;
  to_store_id: string;
  qty: number;
  notes?: string | null;
}

export interface SetMinStockLevelPayload {
  min_stock_level: number;
}

export interface StockBalancesPaginatedResponse {
  data: StockBalanceItem[];
  total: number;
  page: number;
  page_size: number;
  message: string | null;
}

export interface StockMovementsPaginatedResponse {
  data: StockMovementItem[];
  total: number;
  page: number;
  page_size: number;
  message: string | null;
}
