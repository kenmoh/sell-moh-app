/* ==========================================================================
   Accounting Types — sell_moh_app
   Mapped from app/accounting/schemas.py
   ========================================================================== */

// ── Chart of Accounts ──────────────────────────────────────────────────────

export interface CreateAccountRequest {
  code: string;
  name: string;
  account_type: string;
  parent_id?: string;
}

export interface AccountResponse {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  account_type: string;
  status: string;
}

// ── Journals ───────────────────────────────────────────────────────────────

export interface JournalEntryLineRequest {
  account_id: string;
  account_code: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface CreateJournalRequest {
  description: string;
  entries: JournalEntryLineRequest[];
  reference_id?: string;
  ref_type?: string;
}

export interface JournalCreatedResponse {
  journal_id: string;
}

export interface JournalListItem {
  id: string;
  journal_number: string;
  description: string;
  status: string;
  entry_count: number;
  total_debit: number;
  total_credit: number;
  created_at: string | null;
}

// ── Trial Balance ──────────────────────────────────────────────────────────

export interface TrialBalanceItem {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
}

// ── Profit & Loss ──────────────────────────────────────────────────────────

export interface PnLLineItem {
  account_id: string;
  account_code: string;
  account_name: string;
  amount: number;
}

export interface ProfitAndLossResponse {
  revenue: PnLLineItem[];
  expenses: PnLLineItem[];
  total_revenue: number;
  total_expenses: number;
}

// ── Balance Sheet ──────────────────────────────────────────────────────────

export interface BalanceSheetResponse {
  assets: PnLLineItem[];
  liabilities: PnLLineItem[];
  equity: PnLLineItem[];
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
}

// ── Cash Flow ──────────────────────────────────────────────────────────────

export interface CashFlowResponse {
  inflows: PnLLineItem[];
  outflows: PnLLineItem[];
  net_cash_flow: number;
}

// ── Accounts Receivable ────────────────────────────────────────────────────

export interface CreateReceivableRequest {
  customer_id: string;
  customer_name: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  invoice_id?: string;
}

export interface ReceivableResponse {
  id: string;
  tenant_id: string;
  customer_id: string;
  customer_name: string;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  status: string;
}

// ── Accounts Payable ───────────────────────────────────────────────────────

export interface CreatePayableRequest {
  bill_number: string;
  vendor_name: string;
  description?: string;
  amount: number;
  due_date: string;
}

export interface PayableResponse {
  id: string;
  tenant_id: string;
  bill_number: string;
  vendor_name: string;
  description: string | null;
  amount: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  status: string;
}

// ── Expenses ───────────────────────────────────────────────────────────────

export interface CreateExpenseRequest {
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  vendor?: string;
  receipt_url?: string;
}

export interface ExpenseResponse {
  id: string;
  tenant_id: string;
  expense_number: string;
  category: string;
  description: string;
  amount: number;
  vendor: string | null;
  receipt_url: string | null;
  expense_date: string;
  account_id: string;
  journal_id: string | null;
  created_by: string;
}

// ── Payment Recording ──────────────────────────────────────────────────────

export interface RecordPaymentRequest {
  amount: number;
  payment_date: string;
  notes?: string;
}

// ── Financial Dashboard ────────────────────────────────────────────────────

export interface FinancialDashboardResponse {
  cash_balance: number;
  outstanding_receivable: number;
  outstanding_payable: number;
  total_expenses_this_month: number;
  expense_by_category: Record<string, number>;
}
