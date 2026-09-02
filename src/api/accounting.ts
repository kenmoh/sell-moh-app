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
  ProfitAndLossResponse,
  ReceivableResponse,
  RecordPaymentRequest,
  TrialBalanceItem,
} from "@/types/accounting";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const URL = "/accounting";

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
): Promise<{ items: JournalListItem[]; total: number; page: number; page_size: number }> => {
  const res = await apiClient.get<{
    data: JournalListItem[];
    total: number;
    page: number;
    page_size: number;
  }>(`${URL}/journals?page=${page}&page_size=${pageSize}`);

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
): Promise<TrialBalanceItem[]> => {
  const qs = asAt ? `?as_at=${asAt}` : "";
  const res = await apiClient.get<{ data: TrialBalanceItem[] }>(
    `${URL}/trial-balance${qs}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const fetchProfitAndLoss = async (
  fromDate: string,
  toDate: string,
): Promise<ProfitAndLossResponse> => {
  const res = await apiClient.get<{ data: ProfitAndLossResponse }>(
    `${URL}/profit-and-loss?from_date=${fromDate}&to_date=${toDate}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchBalanceSheet = async (
  asAt?: string,
): Promise<BalanceSheetResponse> => {
  const qs = asAt ? `?as_at=${asAt}` : "";
  const res = await apiClient.get<{ data: BalanceSheetResponse }>(
    `${URL}/balance-sheet${qs}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchCashFlow = async (
  fromDate?: string,
  toDate?: string,
): Promise<CashFlowResponse> => {
  const params = new URLSearchParams();
  if (fromDate) params.append("from_date", fromDate);
  if (toDate) params.append("to_date", toDate);
  const qs = params.toString();
  const res = await apiClient.get<{ data: CashFlowResponse }>(
    `${URL}/cash-flow${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

// ── Accounts Receivable ────────────────────────────────────────────────────

export const fetchReceivables = async (
  status?: string,
): Promise<ReceivableResponse[]> => {
  const qs = status ? `?status=${status}` : "";
  const res = await apiClient.get<{ data: ReceivableResponse[] }>(
    `${URL}/receivable${qs}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

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
): Promise<PayableResponse[]> => {
  const qs = status ? `?status=${status}` : "";
  const res = await apiClient.get<{ data: PayableResponse[] }>(
    `${URL}/payable${qs}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

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

// ── Expenses ───────────────────────────────────────────────────────────────

export const fetchExpenses = async (params?: {
  category?: string;
  from_date?: string;
  to_date?: string;
}): Promise<ExpenseResponse[]> => {
  const query = new URLSearchParams();
  if (params?.category) query.append("category", params.category);
  if (params?.from_date) query.append("from_date", params.from_date);
  if (params?.to_date) query.append("to_date", params.to_date);
  const qs = query.toString();
  const res = await apiClient.get<{ data: ExpenseResponse[] }>(
    `${URL}/expenses${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

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
}): Promise<Record<string, number>> => {
  const query = new URLSearchParams();
  if (params?.from_date) query.append("from_date", params.from_date);
  if (params?.to_date) query.append("to_date", params.to_date);
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

export const fetchFinancialDashboard =
  async (): Promise<FinancialDashboardResponse> => {
    const res = await apiClient.get<{ data: FinancialDashboardResponse }>(
      `${URL}/dashboard`,
    );

    if (!res.ok) {
      throw new Error(getErrorMessage(res));
    }

    return res.data?.data!;
  };
