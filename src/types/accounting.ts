/* ==========================================================================
   Accounting Types — sell_moh_app
   Mapped from services/accounting/storeflow_accounting/schemas.py
   ========================================================================== */

export interface JournalEntry {
  id: string;
  journal_number: string;
  description: string;
  reference_id: string;
  reference_type: "sale" | "payment" | "expense" | "adjustment";
  status: "draft" | "posted";
  posted_at?: string;
  created_at: string;
}

export interface JournalEntryLine {
  id: string;
  account_id: string;
  account_code: string;
  debit: number; // NGN
  credit: number;
  description?: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  status: "posted";
  posted_at?: string;
  amount: number;
}

export interface AccountReceivable {
  id: string;
  customer_name: string;
  invoice_number: string;
  amount: number; // NGN
  amount_paid: number;
  balance: number;
  due_date: string;
  status: "pending" | "overdue" | "partial" | "paid";
}

export interface ProfitLoss {
  period: "week" | "month" | "year";
  revenue: number;
  expenses: number;
  net_profit: number;
  profit_margin_pct: number;
}

export interface CashFlow {
  period: "week" | "month" | "year";
  operating: number;
  investing: number;
  financing: number;
  net_change: number;
}

/* =========================================================================
   Accounting — API Envelope
   ========================================================================= */

export interface AccountingAPIResponse {
  data: JournalEntry | JournalEntryLine | AccountReceivable | ProfitLoss | CashFlow;
  message?: string;
}