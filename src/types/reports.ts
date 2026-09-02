// ── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_revenue: number;
  total_sales: number;
  avg_order_value: number;
  top_products: Array<{
    product_id: string;
    product_name: string;
    total_qty: number;
    total_revenue: number;
  }>;
  recent_sales: Array<{
    id: string;
    sale_number: string;
    total: number;
    created_at: string;
  }>;
}

// ── Sales Summary ──────────────────────────────────────────────────────────

export interface SalesSummary {
  total_revenue: number;
  total_sales: number;
  avg_order_value: number;
  period: Record<string, number>;
}

// ── Top Products ───────────────────────────────────────────────────────────

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_qty: number;
  total_revenue: number;
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
  cashier_id: string;
  cashier_name: string | null;
  total_sales: number;
  total_revenue: number;
  avg_order_value: number;
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

export interface CustomerInsightsResult {
  total_customers: number;
  repeat_customers: number;
  avg_order_value: number;
  top_customers: Array<{
    customer_name: string;
    total_orders: number;
    total_spent: number;
  }>;
}

// ── Document Summary ───────────────────────────────────────────────────────

export interface DocumentSummaryResult {
  total_invoices: number;
  total_quotes: number;
  total_receipts: number;
  outstanding_amount: number;
}
