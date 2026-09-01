// _____________________________CATEGORY OPERATIONS_____________________________

import { DataMessageResponse } from "@/types/auth";
import { CreateStore } from "@/types/store";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const STORE_URL = "/stores";

interface StoreData {
  id: string;
  name: string;
  address: string;
  is_warehouse: boolean;
  status: string;
  created_at: string;
}

interface CreateStoreResponse {
  message: string;
  data: StoreData;
}

interface DeleteResponse {
  message: string;
  data: { status: string };
}

export const createStore = async (
  data: CreateStore,
): Promise<CreateStoreResponse> => {
  const res = await apiClient.post<CreateStoreResponse>(`${STORE_URL}`, data);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data as CreateStoreResponse;
};

export const fetchTenantStores = async (): Promise<StoreData[]> => {
  const res = await apiClient.get<{ data: StoreData[]; message: string }>(
    `${STORE_URL}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const updateTenantStore = async (
  storeId: string,
  data: CreateStore,
): Promise<CreateStoreResponse> => {
  const res = await apiClient.patch<CreateStoreResponse>(
    `${STORE_URL}/${storeId}`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data as CreateStoreResponse;
};
export const deleteTenantStore = async (
  storeId: string,
): Promise<DeleteResponse> => {
  const res = await apiClient.delete<DeleteResponse>(`${STORE_URL}/${storeId}`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data as DeleteResponse;
};

export const syncStore = async (storeId: string) => {
  const res = await apiClient.get(`${STORE_URL}/${storeId}/sync`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data;
};

export const fetchTenantStoreProducts = async (storeId: string) => {
  const res = await apiClient.get<DataMessageResponse>(
    `${STORE_URL}/${storeId}/products`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const createTenantStoreProduct = async (
  data: CreateStore,
): Promise<DataMessageResponse> => {
  const res = await apiClient.post<DataMessageResponse>(`${STORE_URL}`, data);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};
