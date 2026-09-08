// ── Dashboard ──────────────────────────────────────────────────────────────

export interface MetricDelta {
  current: number;
  previous: number;
  change_pct: number;
}

export interface DashboardSummary {
  revenue: MetricDelta;
  sales_count: MetricDelta;
  avg_order_value: MetricDelta;
  top_product: {
    product_id: string;
    product_name: string;
    total_qty: number;
    total_revenue: number;
  } | null;
  low_stock_count: number;
  active_users: number;
  pending_documents: number;
  payment_collection_rate: number;
}

// ── Sales Summary ──────────────────────────────────────────────────────────

export interface SalesSummaryItem {
  period: string;
  revenue: number;
  sales_count: number;
  avg_order_value: number;
  discount_total: number;
  tax_total: number;
}

export interface SalesSummary {
  items: SalesSummaryItem[];
  totals: {
    revenue: number;
    sales_count: number;
    discount_total: number;
    tax_total: number;
  };
}

// ── Top Products ───────────────────────────────────────────────────────────

export interface TopProduct {
  product_id: string;
  product_name: string;
  sku: string;
  qty_sold: number;
  revenue: number;
  avg_selling_price: number;
  margin_pct: number;
}

// ── Payment Breakdown ──────────────────────────────────────────────────────

export interface PaymentBreakdown {
  cash: number;
  card: number;
  transfer: number;
  total: number;
}

// ── Cashier Performance ────────────────────────────────────────────────────

export interface CashierPerformanceItem {
  user_id: string;
  sales_count: number;
  total_revenue: number;
  avg_transaction: number;
  void_count: number;
}

// ── Inventory Alerts ───────────────────────────────────────────────────────

export interface InventoryAlertsSummary {
  total_products: number;
  low_stock: number;
  out_of_stock: number;
}

export interface InventoryAlertItem {
  product_id: string;
  product_name: string;
  qty: number;
  min_stock_level: number;
  status: string;
}

export interface InventoryAlertsResult {
  summary: InventoryAlertsSummary;
  items: InventoryAlertItem[];
}

// ── Profit & Loss ──────────────────────────────────────────────────────────

export interface ProfitLossResult {
  revenue: number;
  cost_of_goods: number;
  gross_profit: number;
  expenses: number;
  net_profit: number;
  items: Array<{
    category: string;
    amount: number;
  }>;
  totals: Record<string, number>;
}

// ── Customer Insights ──────────────────────────────────────────────────────

export interface CustomerInsightsSummary {
  unique_customers: number;
  new_customers: number;
  returning_customers: number;
  avg_customer_value: number;
  repeat_purchase_rate: number;
}

export interface TopCustomer {
  customer_name: string;
  total_purchases: number;
  total_revenue: number;
  avg_order_value: number;
  last_purchase: string;
}

export interface CustomerInsightsResult {
  summary: CustomerInsightsSummary;
  top_customers: TopCustomer[];
}

// ── Document Summary ───────────────────────────────────────────────────────

export interface DocumentSummaryStats {
  total_documents: number;
  total_amount: number;
  paid: number;
  paid_amount: number;
  overdue: number;
  overdue_amount: number;
  collection_rate: number;
}

export interface AgingBucket {
  bucket: string;
  count: number;
  amount: number;
}

export interface DocumentSummaryResult {
  summary: DocumentSummaryStats;
  aging: AgingBucket[];
}
