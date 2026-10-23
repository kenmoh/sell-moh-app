import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const URL = "/payments/settlement";

export interface SettlementEntry {
  id: string;
  sale_id: string;
  amount: number;
  fee_type: string;
  rate: number;
  payment_method: string;
  status: string;
  settled_at: string | null;
  created_at: string;
}

export interface SettlementResponse {
  items: SettlementEntry[];
  total_pending: number;
  total_deducted: number;
  total: number;
}

export interface SettlementBalanceResponse {
  pending_balance: number;
  max_pending_balance: number;
  is_blocked: boolean;
}

export const fetchSettlement = async (
  status?: string,
): Promise<SettlementResponse> => {
  const qs = status ? `?status=${status}` : "";
  const res = await apiClient.get<{ data: SettlementResponse }>(
    `${URL}${qs}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const createSettlementLink = async (): Promise<{
  link: string;
  amount: number;
  intent_id: string;
  tx_ref: string;
  reused: boolean;
}> => {  const res = await apiClient.post<{
    data: {
      link: string;
      amount: number;
      intent_id: string;
      tx_ref: string;
      reused: boolean;
    };
  }>(`${URL}/link`, {});

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchSettlementBalance =
  async (): Promise<SettlementBalanceResponse> => {
    const res = await apiClient.get<{ data: SettlementBalanceResponse }>(
      `${URL}/balance`,
    );

    if (!res.ok) {
      throw new Error(getErrorMessage(res));
    }

    return res.data?.data!;
  };

// Recovery for settled money a lost webhook never swept.
export const reconcileSettlement = async (
  tx_ref?: string,
): Promise<{ cleared: number; amount: number; intent_id: string }> => {
  const res = await apiClient.post<{ data: {
    cleared: number;
    amount: number;
    intent_id: string;
  } }>(`${URL}/reconcile`, tx_ref ? { tx_ref } : {});

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};
