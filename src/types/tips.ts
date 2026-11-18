export interface Tip {
  id: string;
  sale_id: string;
  sale_number: string;
  sale_item_id: string;
  product_name: string;
  cashier_id: string;
  cashier_name: string;
  store_id: string;
  extra: number;
  qty: number;
  amount: number;
  status: "pending" | "settled" | "voided";
  sale_status: string;
  earned_at: string | null;
  settlement_id: string | null;
  settled_at: string | null;
}

export interface TipsSummary {
  cashier_id: string;
  cashier_name: string;
  unsettled_amount: number;
  unsettled_count: number;
  settled_amount: number;
  settled_count: number;
  last_settlement_at: string | null;
}

export interface CashierTipSummary {
  cashier_id: string;
  cashier_name: string;
  unsettled_amount: number;
  unsettled_count: number;
}

export interface SettleTipsRequest {
  cashier_id: string;
  period_start: string;
  period_end: string;
  note?: string;
}

export interface SettlementTip extends Tip {}

export interface Settlement {
  id: string;
  cashier_id: string;
  cashier_name: string;
  period_start: string | null;
  period_end: string | null;
  note: string | null;
  amount: number;
  tip_count: number;
  status: string;
  paid_by: string | null;
  paid_at: string | null;
  tips: SettlementTip[];
}

export interface ListTipsParams {
  cashier_id?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}
