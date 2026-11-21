import { apiClient } from "./client";

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  annual_discount_pct: number;
}

export interface MerchantSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  pending_plan_id: string | null;
  plan_change_requested_at: string | null;
  status: string;
  billing_interval: string;
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  grace_period_end: string | null;
  auto_debit_enabled: boolean;
  accrued_debt: number;
  debt_cap: number;
  created_at: string;
  updated_at: string;
}

export interface PlanChangeRequest {
  plan_slug: string;
}

export interface BillingInvoice {
  id: string;
  tenant_id: string;
  billing_period_id: string | null;
  invoice_number: string;
  subscription_amount: number;
  transaction_fee_total: number;
  credit_total: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  issued_at: string;
  due_at: string;
  grace_until: string;
  paid_at: string | null;
  auto_debit_attempted: boolean;
  created_at: string;
}

export interface TenantWallet {
  tenant_id: string;
  balance: number;
  currency: string;
  status: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  tenant_id: string;
  wallet_id: string | null;
  entry_type: string;
  amount: number;
  currency: string;
  reference: string | null;
  invoice_id: string | null;
  gateway_reference: string | null;
  description: string | null;
  created_at: string;
}

export interface BillableTransaction {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  sale_id: string;
  subscription_id: string | null;
  plan_id: string | null;
  pricing_version_id: string | null;
  fee_tier_id: string | null;
  transaction_amount: number;
  transaction_fee: number;
  fee_label_snapshot: string | null;
  currency: string;
  transaction_status: string;
  completed_at: string;
  created_at: string;
}

export interface WalletFundRequest {
  amount: number;
  gateway_reference?: string | null;
  description?: string | null;
}

export interface WalletFundLinkRequest {
  amount: number;
}

export interface WalletFundLinkResponse {
  link: string;
  amount: number;
  intent_id: string;
  tx_ref: string;
}

export const formatCurrency = (n: number) =>
  `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const URL = "/billing";
const PRICING_URL = "/pricing";

export async function fetchSubscription() {
  const res = await apiClient.get<{ data: MerchantSubscription }>(
    `${URL}/subscription`,
  );
  if (!res.ok) throw new Error("Failed to load subscription");
  return res.data?.data!;
}

export async function changePlan(data: PlanChangeRequest) {
  const res = await apiClient.post<{ data: MerchantSubscription }>(
    `${URL}/subscription/plan`,
    data,
  );
  if (!res.ok) throw new Error("Failed to change plan");
  return res.data?.data!;
}

export async function fetchPublicPlans() {
  const res = await apiClient.get<{ data: Plan[] }>(`${PRICING_URL}/plans`);
  if (!res.ok) throw new Error("Failed to load plans");
  return res.data?.data!;
}

export async function fetchInvoices() {
  const res = await apiClient.get<{ data: BillingInvoice[] }>(
    `${URL}/invoices`,
  );
  if (!res.ok) throw new Error("Failed to load invoices");
  return res.data?.data!;
}

export async function fetchWallet() {
  const res = await apiClient.get<{ data: TenantWallet }>(`${URL}/wallet`);
  if (!res.ok) throw new Error("Failed to load wallet");
  return res.data?.data!;
}

export async function fetchWalletTransactions() {
  const res = await apiClient.get<{ data: WalletTransaction[] }>(
    `${URL}/wallet/transactions`,
  );
  if (!res.ok) throw new Error("Failed to load wallet transactions");
  return res.data?.data!;
}

export async function fundWallet(data: WalletFundRequest) {
  const res = await apiClient.post<{ data: WalletTransaction }>(
    `${URL}/wallet/fund`,
    data,
  );
  if (!res.ok) throw new Error("Failed to fund wallet");
  return res.data?.data!;
}

export async function createWalletFundingLink(data: WalletFundLinkRequest) {
  const res = await apiClient.post<{ data: WalletFundLinkResponse }>(
    `${URL}/wallet/funding-link`,
    data,
  );
  if (!res.ok) throw new Error("Failed to create funding link");
  return res.data?.data!;
}

export async function fetchBillableTransactions() {
  const res = await apiClient.get<{ data: BillableTransaction[] }>(
    `${URL}/billable-transactions`,
  );
  if (!res.ok) throw new Error("Failed to load billable transactions");
  return res.data?.data!;
}

export async function createBillingSettleLink() {
  const res = await apiClient.post<{
    data: {
      link: string;
      amount: number;
      intent_id: string;
      tx_ref: string;
    };
  }>(`${URL}/wallet/settle-link`);
  if (!res.ok) throw new Error("Failed to create settlement link");
  return res.data?.data!;
}
