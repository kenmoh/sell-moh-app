import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const URL = "/taxes";

export interface TaxType {
  id: string;
  tenant_id: string;
  name: string;
  rate: number;
  is_active: boolean;
  /** Liability account the tax is owed to, e.g. "2300". */
  account_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaxRequest {
  name: string;
  rate: number;
  account_code?: string;
}

export interface UpdateTaxRequest {
  name?: string;
  rate?: number;
  is_active?: boolean;
  account_code?: string;
}

export const fetchTaxTypes = async (
  includeInactive = false,
): Promise<TaxType[]> => {
  const res = await apiClient.get<{ data: TaxType[] }>(
    `${URL}?include_inactive=${includeInactive}`,
  );
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data ?? [];
};

export const createTaxType = async (
  data: CreateTaxRequest,
): Promise<TaxType> => {
  const res = await apiClient.post<{ data: TaxType }>(URL, data);
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};

export const updateTaxType = async (
  id: string,
  data: UpdateTaxRequest,
): Promise<TaxType> => {
  const res = await apiClient.patch<{ data: TaxType }>(`${URL}/${id}`, data);
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};

export const deleteTaxType = async (id: string): Promise<void> => {
  const res = await apiClient.delete(`${URL}/${id}`);
  if (!res.ok) throw new Error(getErrorMessage(res));
};
