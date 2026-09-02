// ── Payment Requests ───────────────────────────────────────────────────────

export interface CashPaymentRequest {
  sale_id: string;
  amount: number;
}

export interface CardPaymentRequest {
  sale_id: string;
  amount: number;
  customer_email: string;
  customer_name?: string;
}

export interface TransferPaymentRequest {
  sale_id: string;
  amount: number;
  customer_email: string;
  customer_name?: string;
}

export interface SplitPaymentRequest {
  sale_id: string;
  splits: {
    cash?: number;
    card?: number;
    transfer?: number;
  };
}

// ── Payment Responses ──────────────────────────────────────────────────────

export interface CashPaymentResult {
  payment_id: string;
  sale_id: string;
  amount: number;
  method: string;
}

export interface CardPaymentResult {
  payment_id: string;
  sale_id: string;
  amount: number;
  status: string;
  method: string;
  flutterwave_ref: string | null;
  payment_link: string | null;
  payment_url: string | null;
  qr_code_base64: string | null;
  tx_ref: string | null;
}

export interface TransferPaymentResult {
  payment_id: string;
  sale_id: string;
  amount: number;
  status: string;
  method: string;
  account_number: string | null;
  bank_name: string | null;
  instructions: string | null;
}

export interface SplitSuggestion {
  cash: number;
  card: number;
  transfer: number;
  total: number;
}

export interface SplitPaymentResult {
  payment_id: string;
  sale_id: string;
  splits: Record<string, number>;
  sale_status: string | null;
  balance: number | null;
}

// ── Subaccount ─────────────────────────────────────────────────────────────

export interface SubaccountCreateRequest {
  account_bank: string;
  account_number: string;
  business_name: string;
  business_mobile: string;
  business_email?: string;
  business_contact?: string;
  split_value?: number;
  split_type?: string;
}

export interface SubaccountUpdateRequest {
  account_bank?: string;
  account_number?: string;
  business_name?: string;
  business_mobile?: string;
  business_email?: string;
  split_value?: number;
  split_type?: string;
}

export interface SubaccountResponse {
  id: string;
  account_number: string | null;
  bank_name: string | null;
  status: string;
}

// ── Bank / Account Verification ────────────────────────────────────────────

export interface BankInfo {
  name: string;
  code: string;
}

export interface ResolvedAccount {
  account_number: string;
  account_name: string;
  bank_code: string;
  bank_name: string | null;
}

export interface AccountVerifyRequest {
  account_number: string;
  bank_code: string;
}
