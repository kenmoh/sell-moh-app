import { apiClient } from "./client";
import { getErrorMessage } from "./auth";
import type {
  CashierTipSummary,
  ListTipsParams,
  Settlement,
  SettleTipsRequest,
  Tip,
  TipsSummary,
} from "@/types/tips";

const URL = "/tips";

export const listTips = async (
  params: ListTipsParams = {},
): Promise<{ items: Tip[]; page: number; page_size: number; total: number }> => {
  const query = new URLSearchParams();
  if (params.cashier_id) query.append("cashier_id", params.cashier_id);
  if (params.status) query.append("status", params.status);
  if (params.from_date) query.append("from_date", params.from_date);
  if (params.to_date) query.append("to_date", params.to_date);
  if (params.page) query.append("page", String(params.page));
  if (params.page_size) query.append("page_size", String(params.page_size));

  const url = `${URL}${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await apiClient.get<{
    data: Tip[];
    total: number;
    page: number;
    page_size: number;
  }>(url);

  if (!res.ok) throw new Error(getErrorMessage(res));
  return {
    items: res.data?.data ?? [],
    total: res.data?.total ?? 0,
    page: res.data?.page ?? 1,
    page_size: res.data?.page_size ?? 50,
  };
};

export const fetchTipsSummary = async (
  cashier_id: string,
): Promise<TipsSummary> => {
  const query = new URLSearchParams({ cashier_id });
  const res = await apiClient.get<{ data: TipsSummary }>(
    `${URL}/summary?${query.toString()}`,
  );
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};

export const listSettlements = async (): Promise<Settlement[]> => {
  const res = await apiClient.get<{ data: Settlement[] }>(`${URL}/settlements`);
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data ?? [];
};

export const getSettlement = async (
  settlementId: string,
): Promise<Settlement> => {
  const res = await apiClient.get<{ data: Settlement }>(
    `${URL}/settlements/${settlementId}`,
  );
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};

export const settleTips = async (
  data: SettleTipsRequest,
): Promise<Settlement> => {
  const res = await apiClient.post<{ data: Settlement }>(
    `${URL}/settlements`,
    data,
  );
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};
