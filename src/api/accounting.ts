import {
    AccountResponse,
    BalanceSheetResponse,
    CashFlowResponse,
    CreateAccountRequest,
    CreateExpenseRequest,
    CreateJournalRequest,
    CreatePayableRequest,
    CreateReceivableRequest,
    ExpenseResponse,
    FinancialDashboardResponse,
    JournalCreatedResponse,
    JournalListItem,
    PayableResponse,
    PaymentRecord,
    ProfitAndLossResponse,
    ReceivableResponse,
    RecordPaymentRequest,
    TaxOwedLine,
    TaxRemitRequest,
    TaxRemitResponse,
    TaxRemittanceItem,
    TaxesCollectedResponse,
    ToggleAccountStatusRequest,
    TrialBalanceItem,
    UpdateAccountRequest,
} from "@/types/accounting";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const URL = "/accounting";

type AccountingListEnvelope<T> = {
  data?: T[];
  total?: number;
  page?: number;
  page_size?: number;
  pagination?: unknown;
};

const logAccountingListSample = <T>(
  name: string,
  response: AccountingListEnvelope<T> | undefined,
) => {
  if (!__DEV__) return;
  console.log(
    `[Accounting] ${name} response sample`,
    JSON.stringify(
      {
        responseKeys: Object.keys(response ?? {}),
        pagination: response?.pagination ?? {
          total: response?.total,
          page: response?.page,
          page_size: response?.page_size,
        },
        records: response?.data?.slice(0, 3) ?? [],
      },
      null,
      2,
    ),
  );
};

export type AccountingPage<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

type AccountingPageParams = {
  page: number;
  page_size: number;
  store_id?: string;
};

/**
 * Paginated variants used by the accounting hub so its lists can grow with
 * infinite scroll instead of loading the whole ledger up front.
 */
const fetchAccountingPage = async <T>(
  path: "receivable" | "payable" | "expenses",
  params: AccountingPageParams,
): Promise<AccountingPage<T>> => {
  const query = new URLSearchParams();
  query.append("page", String(params.page));
  query.append("page_size", String(params.page_size));
  if (params.store_id) query.append("store_id", params.store_id);
  const qs = query.toString();
  const res = await apiClient.get<AccountingListEnvelope<T>>(
    `${URL}/${path}${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return {
    items: res.data?.data ?? [],
    total: res.data?.total ?? 0,
    page: res.data?.page ?? params.page,
    page_size: res.data?.page_size ?? params.page_size,
  };
};

export const fetchReceivablesPaged = (params: AccountingPageParams) =>
  fetchAccountingPage<ReceivableResponse>("receivable", params);

export const fetchPayablesPaged = (params: AccountingPageParams) =>
  fetchAccountingPage<PayableResponse>("payable", params);

export const fetchExpensesPaged = (params: AccountingPageParams) =>
  fetchAccountingPage<ExpenseResponse>("expenses", params);

// ── Chart of Accounts ──────────────────────────────────────────────────────

export const fetchAccounts = async (): Promise<AccountResponse[]> => {
  const res = await apiClient.get<{ data: AccountResponse[] }>(
    `${URL}/accounts`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const createAccount = async (
  data: CreateAccountRequest,
): Promise<AccountResponse> => {
  const res = await apiClient.post<{ data: AccountResponse }>(
    `${URL}/accounts`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const updateAccount = async (
  accountId: string,
  data: UpdateAccountRequest,
): Promise<AccountResponse> => {
  const res = await apiClient.put<{ data: AccountResponse }>(
    `${URL}/accounts/${accountId}`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const toggleAccountStatus = async (
  accountId: string,
  data: ToggleAccountStatusRequest,
): Promise<AccountResponse> => {
  const res = await apiClient.patch<{ data: AccountResponse }>(
    `${URL}/accounts/${accountId}/status`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const deleteAccount = async (accountId: string): Promise<void> => {
  const res = await apiClient.delete(`${URL}/accounts/${accountId}`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

// ── Journals ───────────────────────────────────────────────────────────────

export const createJournal = async (
  data: CreateJournalRequest,
): Promise<JournalCreatedResponse> => {
  const res = await apiClient.post<{ data: JournalCreatedResponse }>(
    `${URL}/journals`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchJournals = async (
  page = 1,
  pageSize = 50,
  storeId?: string | null,
): Promise<{
  items: JournalListItem[];
  total: number;
  page: number;
  page_size: number;
}> => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  if (storeId) params.append("store_id", storeId);
  const res = await apiClient.get<{
    data: JournalListItem[];
    total: number;
    page: number;
    page_size: number;
  }>(`${URL}/journals?${params.toString()}`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return {
    items: res.data?.data ?? [],
    total: res.data?.total ?? 0,
    page: res.data?.page ?? 1,
    page_size: res.data?.page_size ?? 50,
  };
};

// ── Financial Statements ───────────────────────────────────────────────────

export const fetchTrialBalance = async (
  asAt?: string,
  storeId?: string | null,
): Promise<TrialBalanceItem[]> => {
  const params = new URLSearchParams();
  if (asAt) params.append("as_at", asAt);
  if (storeId) params.append("store_id", storeId);
  const qs = params.toString();
  const res = await apiClient.get<{ data: TrialBalanceItem[] }>(
    `${URL}/trial-balance${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const fetchProfitAndLoss = async (
  fromDate: string,
  toDate: string,
  storeId?: string | null,
): Promise<ProfitAndLossResponse> => {
  const params = new URLSearchParams();
  params.append("from_date", fromDate);
  params.append("to_date", toDate);
  if (storeId) params.append("store_id", storeId);
  const res = await apiClient.get<{ data: ProfitAndLossResponse }>(
    `${URL}/profit-and-loss?${params.toString()}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchBalanceSheet = async (
  asAt?: string,
  storeId?: string | null,
): Promise<BalanceSheetResponse> => {
  const params = new URLSearchParams();
  if (asAt) params.append("as_at", asAt);
  if (storeId) params.append("store_id", storeId);
  const qs = params.toString();
  const res = await apiClient.get<{ data: BalanceSheetResponse }>(
    `${URL}/balance-sheet${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchCashFlow = async (
  fromDate?: string,
  toDate?: string,
  storeId?: string | null,
): Promise<CashFlowResponse> => {
  const params = new URLSearchParams();
  if (fromDate) params.append("from_date", fromDate);
  if (toDate) params.append("to_date", toDate);
  if (storeId) params.append("store_id", storeId);
  const qs = params.toString();
  const res = await apiClient.get<{ data: CashFlowResponse }>(
    `${URL}/cash-flow${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchTaxesCollected = async ({
  fromDate,
  toDate,
  storeId,
  page = 1,
  pageSize = 20,
}: {
  fromDate?: string;
  toDate?: string;
  storeId?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<TaxesCollectedResponse> => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  if (fromDate) params.append("from_date", fromDate);
  if (toDate) params.append("to_date", toDate);
  if (storeId) params.append("store_id", storeId);
  const res = await apiClient.get<{ data: TaxesCollectedResponse }>(
    `${URL}/taxes-collected?${params.toString()}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

// ── Tax Remittance ────────────────────────────────────────────────────────

export const fetchTaxesOwed = async (
  storeId?: string | null,
): Promise<TaxOwedLine[]> => {
  const params = new URLSearchParams();
  if (storeId) params.append("store_id", storeId);
  const qs = params.toString();
  const res = await apiClient.get<{ data: TaxOwedLine[] }>(
    `${URL}/taxes-owed${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const fetchRemittanceHistory = async ({
  page = 1,
  pageSize = 20,
  storeId,
}: {
  page?: number;
  pageSize?: number;
  storeId?: string | null;
}): Promise<AccountingPage<TaxRemittanceItem>> => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  if (storeId) params.append("store_id", storeId);
  const res = await apiClient.get<{
    data: TaxRemittanceItem[];
    total: number;
    page: number;
    page_size: number;
  }>(`${URL}/taxes-remit?${params.toString()}`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return {
    items: res.data?.data ?? [],
    total: res.data?.total ?? 0,
    page: res.data?.page ?? page,
    page_size: res.data?.page_size ?? pageSize,
  };
};

export const remitTax = async (
  payload: TaxRemitRequest,
): Promise<TaxRemitResponse> => {
  const res = await apiClient.post<{ data: TaxRemitResponse }>(
    `${URL}/taxes-remit`,
    payload,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

// ── Accounts Receivable ────────────────────────────────────────────────────

export const fetchReceivables = async (
  status?: string,
  storeId?: string | null,
): Promise<ReceivableResponse[]> => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (storeId) params.append("store_id", storeId);
  const qs = params.toString();
  const res = await apiClient.get<AccountingListEnvelope<ReceivableResponse>>(
    `${URL}/receivable${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  logAccountingListSample("receivables", res.data);
  return res.data?.data ?? [];
};

export const createReceivable = async (
  data: CreateReceivableRequest,
): Promise<ReceivableResponse> => {
  const res = await apiClient.post<{ data: ReceivableResponse }>(
    `${URL}/receivable`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchReceivablePayments = async (
  arId: string,
): Promise<PaymentRecord[]> => {
  const res = await apiClient.get<{ data: PaymentRecord[] }>(
    `${URL}/receivable/${arId}/payments`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const fetchPayablePayments = async (
  apId: string,
): Promise<PaymentRecord[]> => {
  const res = await apiClient.get<{ data: PaymentRecord[] }>(
    `${URL}/payable/${apId}/payments`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const recordArPayment = async (
  arId: string,
  data: RecordPaymentRequest,
): Promise<ReceivableResponse> => {
  const res = await apiClient.post<{ data: ReceivableResponse }>(
    `${URL}/receivable/${arId}/payment`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

// ── Accounts Payable ───────────────────────────────────────────────────────

export const fetchPayables = async (
  status?: string,
  storeId?: string | null,
): Promise<PayableResponse[]> => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (storeId) params.append("store_id", storeId);
  const qs = params.toString();
  const res = await apiClient.get<AccountingListEnvelope<PayableResponse>>(
    `${URL}/payable${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  logAccountingListSample("payables", res.data);
  return res.data?.data ?? [];
};

export const createPayable = async (
  data: CreatePayableRequest,
): Promise<PayableResponse> => {
  const res = await apiClient.post<{ data: PayableResponse }>(
    `${URL}/payable`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const recordApPayment = async (
  apId: string,
  data: RecordPaymentRequest,
): Promise<PayableResponse> => {
  const res = await apiClient.post<{ data: PayableResponse }>(
    `${URL}/payable/${apId}/payment`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

/**
 * Re-attribute a receivable, payable or expense to another store
 * (null = All Stores). This is a correction, not an edit: the server requires
 * a supervisor PIN unless the caller is an owner, and records the change in
 * the audit trail.
 */
const MOVE_TO_STORE_PATHS = {
  receivable: "receivable",
  payable: "payable",
  expense: "expenses",
} as const;

const moveToStore = async <T>(
  kind: keyof typeof MOVE_TO_STORE_PATHS,
  id: string,
  storeId: string | null,
  supervisorPin?: string,
): Promise<T> => {
  const res = await apiClient.patch<{ data: T }>(
    `${URL}/${MOVE_TO_STORE_PATHS[kind]}/${id}/store`,
    {
      store_id: storeId,
      ...(supervisorPin ? { supervisor_pin: supervisorPin } : {}),
    },
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const moveReceivableToStore = (
  arId: string,
  storeId: string | null,
  supervisorPin?: string,
): Promise<ReceivableResponse> =>
  moveToStore<ReceivableResponse>("receivable", arId, storeId, supervisorPin);

export const movePayableToStore = (
  apId: string,
  storeId: string | null,
  supervisorPin?: string,
): Promise<PayableResponse> =>
  moveToStore<PayableResponse>("payable", apId, storeId, supervisorPin);

export const moveExpenseToStore = (
  expenseId: string,
  storeId: string | null,
  supervisorPin?: string,
): Promise<ExpenseResponse> =>
  moveToStore<ExpenseResponse>("expense", expenseId, storeId, supervisorPin);

// ── Expenses ───────────────────────────────────────────────────────────────

export const fetchExpenses = async (params?: {
  category?: string;
  from_date?: string;
  to_date?: string;
  store_id?: string;
}): Promise<ExpenseResponse[]> => {
  const query = new URLSearchParams();
  if (params?.category) query.append("category", params.category);
  if (params?.from_date) query.append("from_date", params.from_date);
  if (params?.to_date) query.append("to_date", params.to_date);
  if (params?.store_id) query.append("store_id", params.store_id);
  const qs = query.toString();
  const res = await apiClient.get<AccountingListEnvelope<ExpenseResponse>>(
    `${URL}/expenses${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  logAccountingListSample("expenses", res.data);
  return res.data?.data ?? [];
};

export const createExpense = async (
  data: CreateExpenseRequest,
): Promise<ExpenseResponse> => {
  const res = await apiClient.post<{ data: ExpenseResponse }>(
    `${URL}/expenses`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchExpenseSummary = async (params?: {
  from_date?: string;
  to_date?: string;
  store_id?: string;
}): Promise<Record<string, number>> => {
  const query = new URLSearchParams();
  if (params?.from_date) query.append("from_date", params.from_date);
  if (params?.to_date) query.append("to_date", params.to_date);
  if (params?.store_id) query.append("store_id", params.store_id);
  const qs = query.toString();
  const res = await apiClient.get<{ data: Record<string, number> }>(
    `${URL}/expenses/summary${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? {};
};

// ── Financial Dashboard ────────────────────────────────────────────────────

export const fetchFinancialDashboard = async (
  storeId?: string | null,
): Promise<FinancialDashboardResponse> => {
  const qs = storeId ? `?store_id=${storeId}` : "";
  const res = await apiClient.get<{ data: FinancialDashboardResponse }>(
    `${URL}/dashboard${qs}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};
