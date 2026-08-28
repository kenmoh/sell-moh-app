import { DataMessageResponse } from "@/types/auth";
import {
  AdjustProduct,
  CategoryResponse,
  CreateCategory,
  CreateProduct,
  PaginatedResponse,
  ProductQueryParams,
  ProductResponse,
} from "@/types/product";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const INVENTORY_URL = "/inventory";

// _____________________________CATEGORY OPERATIONS_____________________________

export const createCategory = async (
  data: CreateCategory,
): Promise<DataMessageResponse> => {
  const res = await apiClient.post<DataMessageResponse>(
    `${INVENTORY_URL}/categories`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const fetchTenantCategories = async (): Promise<CategoryResponse[]> => {
  const res = await apiClient.get<{ data: CategoryResponse[] }>(
    `${INVENTORY_URL}/categories`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const getCategoryById = async (id: string) => {
  const res = await apiClient.get<DataMessageResponse>(
    `${INVENTORY_URL}/categories/${id}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const updateCategory = async (id: string, data: CreateCategory) => {
  const res = await apiClient.patch<DataMessageResponse>(
    `${INVENTORY_URL}/categories/${id}`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const deleteCategory = async (id: string) => {
  const res = await apiClient.delete<DataMessageResponse>(
    `${INVENTORY_URL}/categories/${id}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

// _____________________________PRODUCT OPERATIONS_____________________________

export const fetchProducts = async (
  params: ProductQueryParams = {},
): Promise<PaginatedResponse<ProductResponse>> => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.page_size) query.append("page_size", String(params.page_size));
  if (params.low_stock !== undefined)
    query.append("low_stock", String(params.low_stock));
  if (params.category) query.append("category", params.category);
  if (params.search) query.append("search", params.search);

  const qs = query.toString();
  const url = `${INVENTORY_URL}/products${qs ? `?${qs}` : ""}`;

  const res = await apiClient.get<PaginatedResponse<ProductResponse>>(url);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const createProduct = async (data: CreateProduct) => {
  const res = await apiClient.post<DataMessageResponse>(
    `${INVENTORY_URL}/products`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const getProductById = async (id: string): Promise<ProductResponse> => {
  const res = await apiClient.get<{ data: ProductResponse }>(
    `${INVENTORY_URL}/products/${id}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const updateProduct = async (id: string, data: CreateProduct) => {
  const res = await apiClient.patch<DataMessageResponse>(
    `${INVENTORY_URL}/products/${id}`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const deleteProduct = async (id: string) => {
  const res = await apiClient.delete<DataMessageResponse>(
    `${INVENTORY_URL}/products/${id}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const adjustProduct = async (data: AdjustProduct) => {
  const res = await apiClient.post<DataMessageResponse>(
    `${INVENTORY_URL}/adjust`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};
