import { DataMessageResponse } from "@/types/auth";
import {
  AdjustProduct,
  CategoryResponse,
  CreateCategory,
  CreateProduct,
  DistributeResult,
  LowStockItem,
  MinStockLevelResult,
  PaginatedResponse,
  ProductQueryParams,
  ProductResponse,
  ProductStockSeries,
  SetMinStockLevelPayload,
  StockBalancesPaginatedResponse,
  StockMovementsPaginatedResponse,
  StoreDistributePayload,
  UpdateProduct,
} from "@/types/product";
import { File, Paths } from "expo-file-system";
import { requestPermissionsAsync } from "expo-media-library";
import { saveToLibraryAsync } from "expo-media-library/legacy";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const INVENTORY_URL = "/inventory";

export const fetchProductStockSeries = async (
  storeId: string,
  productId: string,
  fromDate: string,
  toDate: string,
): Promise<ProductStockSeries> => {
  const res = await apiClient.get<{ data: ProductStockSeries }>(
    `${INVENTORY_URL}/${storeId}/products/${productId}/stock-series?from_date=${fromDate}&to_date=${toDate}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

// _____________________________CATEGORY OPERATIONS_____________________________

export const createCategory = async (
  storeId: string,
  data: CreateCategory,
): Promise<DataMessageResponse> => {
  const res = await apiClient.post<DataMessageResponse>(
    `${INVENTORY_URL}/${storeId}/categories`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const fetchTenantCategories = async (
  storeId: string,
): Promise<CategoryResponse[]> => {
  const res = await apiClient.get<{ data: CategoryResponse[] }>(
    `${INVENTORY_URL}/${storeId}/categories`,
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
  storeId: string,
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
  const url = `${INVENTORY_URL}/${storeId}/products${qs ? `?${qs}` : ""}`;

  const res = await apiClient.get<PaginatedResponse<ProductResponse>>(url);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const createProduct = async (storeId: string, data: CreateProduct) => {
  const res = await apiClient.post<DataMessageResponse>(
    `${INVENTORY_URL}/${storeId}/products/create`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const getProductById = async (
  productId: string,
  storeId: string,
): Promise<ProductResponse> => {
  const res = await apiClient.get<{ data: ProductResponse }>(
    `${INVENTORY_URL}/${storeId}/products/${productId}`,
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

/** Change a product as one of its stores sees it. */
export const updateStoreProduct = async (
  storeId: string,
  productId: string,
  data: UpdateProduct,
) => {
  const res = await apiClient.patch<{ data: unknown }>(
    `${INVENTORY_URL}/${storeId}/products/${productId}`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data;
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

export const adjustProduct = async (stooreId: string, data: AdjustProduct) => {
  const res = await apiClient.post<DataMessageResponse>(
    `${INVENTORY_URL}/${stooreId}/adjust`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

// Downloads a QR image URL to the salesos folder in app documents.
export const downloadQrToGallery = async (
  url: string,
): Promise<{ savedToGallery: boolean }> => {
  const output = await File.downloadFileAsync(url, Paths.cache, {
    idempotent: true,
  });
  const file = new File(output.uri);
  try {
    const savedToGallery = await saveQrToGallery(file.uri);
    return { savedToGallery };
  } finally {
    file.delete();
  }
};

export const saveQrToGallery = async (fileUri: string): Promise<boolean> => {
  const permission = await requestPermissionsAsync();
  if (!permission.granted) {
    return false;
  }
  await saveToLibraryAsync(fileUri);
  return true;
};

// _____________________________STOCK OPERATIONS_____________________________

export const fetchStockBalances = async (
  storeId: string,
  params?: { product_id?: string; page?: number; page_size?: number },
): Promise<StockBalancesPaginatedResponse> => {
  const query = new URLSearchParams();
  if (params?.product_id) query.append("product_id", params.product_id);
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));
  const qs = query.toString();

  const res = await apiClient.get<StockBalancesPaginatedResponse>(
    `${INVENTORY_URL}/${storeId}/stock${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const fetchStockHistory = async (
  storeId: string,
  params?: { product_id?: string; page?: number; page_size?: number },
): Promise<StockMovementsPaginatedResponse> => {
  const query = new URLSearchParams();
  if (params?.product_id) query.append("product_id", params.product_id);
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));
  const qs = query.toString();

  const res = await apiClient.get<StockMovementsPaginatedResponse>(
    `${INVENTORY_URL}/${storeId}/history${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const fetchLowStock = async (
  storeId: string,
): Promise<LowStockItem[]> => {
  const res = await apiClient.get<{ data: LowStockItem[] }>(
    `${INVENTORY_URL}/${storeId}/low-stock`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const setMinStockLevel = async (
  storeId: string,
  productId: string,
  data: SetMinStockLevelPayload,
): Promise<MinStockLevelResult> => {
  const res = await apiClient.patch<{ data: MinStockLevelResult }>(
    `${INVENTORY_URL}/${storeId}/min-level/${productId}`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!.data;
};

export const distributeStock = async (
  storeId: string,
  data: StoreDistributePayload,
): Promise<DistributeResult> => {
  const res = await apiClient.post<{ data: DistributeResult }>(
    `${INVENTORY_URL}/${storeId}/distribute`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!.data;
};
