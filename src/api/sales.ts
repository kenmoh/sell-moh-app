import {
  CreateSaleRequest,
  SaleDetail,
  SaleListItem,
  SaleQueryParams,
  SaleReturnResult,
} from "@/types/sale";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const URL = "/sales";

export const createSale = async (
  data: CreateSaleRequest,
): Promise<{ id: string; sale_number: string; total: number; status: string }> => {
  const res = await apiClient.post<{ data: any }>(URL, data);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchSales = async (
  params: SaleQueryParams = {},
): Promise<{ items: SaleListItem[]; total: number; page: number; page_size: number }> => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.page_size) query.append("page_size", String(params.page_size));
  if (params.status) query.append("status", params.status);
  if (params.from_date) query.append("from_date", params.from_date);
  if (params.to_date) query.append("to_date", params.to_date);
  if (params.cashier_id) query.append("cashier_id", params.cashier_id);

  const qs = query.toString();
  const url = `${URL}${qs ? `?${qs}` : ""}`;

  const res = await apiClient.get<{
    data: SaleListItem[];
    total: number;
    page: number;
    page_size: number;
  }>(url);

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

export const getSaleById = async (saleId: string): Promise<SaleDetail> => {
  const res = await apiClient.get<{ data: SaleDetail }>(`${URL}/${saleId}`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const voidSale = async (
  saleId: string,
  reason: string,
): Promise<void> => {
  const res = await apiClient.post(`${URL}/${saleId}/void`, { reason });

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

export const returnSale = async (
  saleId: string,
): Promise<SaleReturnResult> => {
  const res = await apiClient.post<{ data: SaleReturnResult }>(
    `${URL}/${saleId}/return`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};
