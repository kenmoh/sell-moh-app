import {
  CashierPerformanceItem,
  CustomerInsightsResult,
  DashboardSummary,
  DocumentSummaryResult,
  InventoryAlertsResult,
  PaymentBreakdown,
  ProductSalesSeries,
  ProfitLossResult,
  SalesSummary,
  TopProduct,
} from "@/types/reports";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const URL = "/reports";

const withStore = (query: string, storeId?: string | null) =>
  storeId ? `${query}&store_id=${storeId}` : query;

export const fetchDashboard = async (
  days = 30,
  storeId?: string | null,
): Promise<DashboardSummary> => {
  const res = await apiClient.get<{ data: DashboardSummary }>(
    withStore(`${URL}/dashboard?days=${days}`, storeId),
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchSalesSummary = async (
  fromDate: string,
  toDate: string,
  storeId?: string | null,
): Promise<SalesSummary> => {
  const res = await apiClient.get<{ data: SalesSummary }>(
    withStore(`${URL}/sales-summary?from_date=${fromDate}&to_date=${toDate}`, storeId),
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchProductSales = async (
  storeId: string,
  productId: string,
  fromDate: string,
  toDate: string,
): Promise<ProductSalesSeries> => {
  const res = await apiClient.get<{ data: ProductSalesSeries }>(
    `${URL}/product-sales?store_id=${storeId}&product_id=${productId}&from_date=${fromDate}&to_date=${toDate}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchTopProducts = async (
  fromDate: string,
  toDate: string,
  limit = 10,
  storeId?: string | null,
): Promise<TopProduct[]> => {
  const res = await apiClient.get<{ data: TopProduct[] }>(
    withStore(
      `${URL}/top-products?from_date=${fromDate}&to_date=${toDate}&limit=${limit}`,
      storeId,
    ),
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const fetchPaymentMethods = async (
  fromDate: string,
  toDate: string,
  storeId?: string | null,
): Promise<PaymentBreakdown> => {
  const res = await apiClient.get<{ data: PaymentBreakdown }>(
    withStore(`${URL}/payment-methods?from_date=${fromDate}&to_date=${toDate}`, storeId),
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchCashierPerformance = async (
  fromDate: string,
  toDate: string,
  limit = 20,
  storeId?: string | null,
): Promise<CashierPerformanceItem[]> => {
  const res = await apiClient.get<{ data: CashierPerformanceItem[] }>(
    withStore(
      `${URL}/cashier-performance?from_date=${fromDate}&to_date=${toDate}&limit=${limit}`,
      storeId,
    ),
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const fetchInventoryAlerts =
  async (storeId?: string | null): Promise<InventoryAlertsResult> => {
    const res = await apiClient.get<{ data: InventoryAlertsResult }>(
      `${URL}/inventory-alerts${storeId ? `?store_id=${storeId}` : ""}`,
    );

    if (!res.ok) {
      throw new Error(getErrorMessage(res));
    }

    return res.data?.data!;
  };

export const fetchProfitLoss = async (
  fromDate: string,
  toDate: string,
  storeId?: string | null,
): Promise<ProfitLossResult> => {
  const res = await apiClient.get<{ data: ProfitLossResult }>(
    withStore(`${URL}/profit-loss?from_date=${fromDate}&to_date=${toDate}`, storeId),
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchCustomerInsights = async (
  fromDate: string,
  toDate: string,
  storeId?: string | null,
): Promise<CustomerInsightsResult> => {
  const res = await apiClient.get<{ data: CustomerInsightsResult }>(
    withStore(`${URL}/customer-insights?from_date=${fromDate}&to_date=${toDate}`, storeId),
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchDocumentSummary = async (
  fromDate: string,
  toDate: string,
  storeId?: string | null,
): Promise<DocumentSummaryResult> => {
  const res = await apiClient.get<{ data: DocumentSummaryResult }>(
    withStore(`${URL}/document-summary?from_date=${fromDate}&to_date=${toDate}`, storeId),
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};
