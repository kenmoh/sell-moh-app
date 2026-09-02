export interface CreateStore {
  name: string;
  address?: string;
  is_warehouse?: boolean;
}

// ── Store Details ───────────────────────────────────────────────────────────

export interface StoreDetailSummary {
  id: string;
  name: string;
  address: string | null;
  is_warehouse: boolean;
  status: string;
  created_at: string | null;
}

export interface StoreDetailCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface StoreDetailProduct {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number;
  qty: number;
  reserved_qty: number;
  committed_qty: number;
  available: number;
  status: string;
}

export interface StoreDetailTopProduct {
  product_id: string;
  product_name: string;
  total_qty: number;
  total_revenue: number;
}

export interface StoreDetailInventoryHealth {
  total_products: number;
  low_stock: number;
  out_of_stock: number;
}

export interface StoreDetailStats {
  revenue: number;
  sales_count: number;
  avg_order_value: number;
  top_products: StoreDetailTopProduct[];
  inventory_health: StoreDetailInventoryHealth;
  period: { from_date: string | null; to_date: string | null };
}

export interface StoreDetailResponse {
  store: StoreDetailSummary;
  categories: StoreDetailCategory[];
  products: StoreDetailProduct[];
  stats: StoreDetailStats;
}
