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

/** A tax as a product carries it: who it is, what it costs, where it is owed. */
export interface TaxEntry {
  id: string | null;
  name: string;
  rate: number;
  account_code?: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number;
  cost_price: number;
  category: string | null;
  category_id?: string | null;
  status: string;
  image_url: string | null;
  qr_url: string | null;
  reorder_point: number;
  qty: number;
  reserved_qty: number;
  available: number;
  min_stock_level: number;
  unit_cost: number | null;
  /** Best-before date (YYYY-MM-DD), null when the product never expires. */
  expiry_date: string | null;
  /** Days before expiry to start warning; null means no near-expiry warning. */
  expiry_warning_days?: number | null;
  /** When true, sale paths refuse this product after its expiry day. */
  block_sale_after_expiry?: boolean;
  taxes: TaxEntry[];
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
  /** The taxes this product carries. Empty means untaxed. */
  tax_ids?: string[];
  reorder_point: number;
  qty?: number;
  metadata?: Record<string, any> | null;
  store_id?: string | null;
  expiry_date?: string | null;
  expiry_warning_days?: number | null;
  block_sale_after_expiry?: boolean;
}

/** Fields the catalog lets a store change after creation. */
export interface UpdateProduct {
  name?: string;
  cost_price?: number;
  selling_price?: number;
  tax_ids?: string[];
  reorder_point?: number;
  category_id?: string | null;
  description?: string | null;
  unit?: string | null;
  expiry_date?: string | null;
  expiry_warning_days?: number | null;
  block_sale_after_expiry?: boolean;
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

// ── Stock series (per-day chart) ────────────────────────────────────────────

export interface StockSeriesPoint {
  date: string;
  balance: number;
  /** What the stock was before this day's first movement. */
  balance_before: number;
  qty_change: number;
}

export interface ProductStockSeries {
  items: StockSeriesPoint[];
  totals: {
    balance: number;
    qty_change: number;
  };
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

// ── Inter-store transfer requests ───────────────────────────────────────────

export type TransferRequestStatus =
  | "pending"
  | "approved"
  | "fulfilled"
  | "rejected";

export type TransferDirection = "incoming" | "outgoing";

export interface TransferRequest {
  id: string;
  request_number: string | null;
  item_name: string | null;
  product_id: string;
  supplying_product_id: string | null;
  requesting_store_id: string;
  supplying_store_id: string;
  requesting_store_name: string | null;
  supplying_store_name: string | null;
  requested_qty: number;
  approved_qty: number | null;
  fulfilled_qty: number | null;
  status: TransferRequestStatus;
  notes: string | null;
  decision_note: string | null;
  rejection_reason: string | null;
  created_by: string | null;
  created_by_name: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  fulfilled_by: string | null;
  fulfilled_by_name: string | null;
  pin_verified_by: string | null;
  pin_verified_by_name: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  fulfilled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TransferRequestCreatePayload {
  item_name: string;
  supplying_store_id: string;
  requested_qty: number;
  notes?: string | null;
}

export interface TransferRequestDecisionPayload {
  approved_qty?: number;
  rejection_reason?: string | null;
  notes?: string | null;
  supervisor_pin?: string | null;
}

export interface TransferRequestsPaginatedResponse {
  data: TransferRequest[];
  total: number;
  page: number;
  page_size: number;
  message: string | null;
}
