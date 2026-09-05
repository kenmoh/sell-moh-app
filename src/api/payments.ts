import {
  AccountVerifyRequest,
  BankInfo,
  CardPaymentRequest,
  CardPaymentResult,
  CashPaymentRequest,
  CashPaymentResult,
  PaymentStatusResponse,
  PendingPayment,
  ResolvedAccount,
  SplitPaymentRequest,
  SplitPaymentResult,
  SplitSuggestion,
  SubaccountCreateRequest,
  SubaccountResponse,
  SubaccountUpdateRequest,
  TransferPaymentRequest,
  TransferPaymentResult,
} from "@/types/payments";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const URL = "/payments";

// ── Cash Payment ───────────────────────────────────────────────────────────

export const recordCashPayment = async (
  data: CashPaymentRequest,
): Promise<CashPaymentResult> => {
  const res = await apiClient.post<{ data: CashPaymentResult }>(
    `${URL}/cash`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

// ── Card Payment ───────────────────────────────────────────────────────────

export const initiateCardPayment = async (
  data: CardPaymentRequest,
): Promise<CardPaymentResult> => {
  const res = await apiClient.post<{ data: CardPaymentResult }>(
    `${URL}/card`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

// ── Transfer Payment ───────────────────────────────────────────────────────

export const initiateTransferPayment = async (
  data: TransferPaymentRequest,
): Promise<TransferPaymentResult> => {
  const res = await apiClient.post<{ data: TransferPaymentResult }>(
    `${URL}/transfer`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

// ── Split Payment ──────────────────────────────────────────────────────────

export const suggestSplit = async (
  saleId: string,
): Promise<SplitSuggestion> => {
  const res = await apiClient.get<{ data: SplitSuggestion }>(
    `${URL}/split/suggest/${saleId}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const recordSplitPayment = async (
  data: SplitPaymentRequest,
): Promise<SplitPaymentResult> => {
  const res = await apiClient.post<{ data: SplitPaymentResult }>(
    `${URL}/split`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

// ── Subaccount ─────────────────────────────────────────────────────────────

export const createSubaccount = async (
  data: SubaccountCreateRequest,
): Promise<SubaccountResponse> => {
  const res = await apiClient.post<{ data: SubaccountResponse }>(
    `${URL}/setup/subaccount`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const getSubaccount = async (): Promise<SubaccountResponse> => {
  const res = await apiClient.get<{ data: SubaccountResponse }>(
    `${URL}/setup/subaccount`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const updateSubaccount = async (
  data: SubaccountUpdateRequest,
): Promise<SubaccountResponse> => {
  const res = await apiClient.patch<{ data: SubaccountResponse }>(
    `${URL}/setup/subaccount`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const deleteSubaccount = async (): Promise<void> => {
  const res = await apiClient.delete(`${URL}/setup/subaccount`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

// ── Banks / Account Verification ───────────────────────────────────────────

export const fetchBanks = async (country = "NG"): Promise<BankInfo[]> => {
  const res = await apiClient.get<{ data: BankInfo[] }>(
    `${URL}/setup/banks?country=${country}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const verifyAccount = async (
  data: AccountVerifyRequest,
): Promise<ResolvedAccount> => {
  const res = await apiClient.post<{ data: ResolvedAccount }>(
    `${URL}/setup/verify-account`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

// ── Payment Status Polling ────────────────────────────────────────────────

export const getPaymentStatus = async (
  saleId: string,
): Promise<PaymentStatusResponse> => {
  const res = await apiClient.get<{ data: PaymentStatusResponse }>(
    `${URL}/status/${saleId}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

// ── Pending Payments ──────────────────────────────────────────────────────

export const cancelPendingIntents = async (
  saleId: string,
): Promise<{ cancelled: number }> => {
  const res = await apiClient.post<{ data: { cancelled: number } }>(
    `${URL}/cancel-pending`,
    { sale_id: saleId },
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const getPendingPayments = async (): Promise<PendingPayment[]> => {
  const res = await apiClient.get<{ data: PendingPayment[] }>(
    `${URL}/pending`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};
