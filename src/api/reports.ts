import {
  CashierPerformanceItem,
  CustomerInsightsResult,
  DashboardSummary,
  DocumentSummaryResult,
  InventoryAlertsResult,
  PaymentBreakdown,
  ProfitLossResult,
  SalesSummary,
  TopProduct,
} from "@/types/reports";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const URL = "/reports";

export const fetchDashboard = async (days = 30): Promise<DashboardSummary> => {
  const res = await apiClient.get<{ data: DashboardSummary }>(
    `${URL}/dashboard?days=${days}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchSalesSummary = async (
  fromDate: string,
  toDate: string,
): Promise<SalesSummary> => {
  const res = await apiClient.get<{ data: SalesSummary }>(
    `${URL}/sales-summary?from_date=${fromDate}&to_date=${toDate}`,
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
): Promise<TopProduct[]> => {
  const res = await apiClient.get<{ data: TopProduct[] }>(
    `${URL}/top-products?from_date=${fromDate}&to_date=${toDate}&limit=${limit}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const fetchPaymentMethods = async (
  fromDate: string,
  toDate: string,
): Promise<PaymentBreakdown> => {
  const res = await apiClient.get<{ data: PaymentBreakdown }>(
    `${URL}/payment-methods?from_date=${fromDate}&to_date=${toDate}`,
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
): Promise<CashierPerformanceItem[]> => {
  const res = await apiClient.get<{ data: CashierPerformanceItem[] }>(
    `${URL}/cashier-performance?from_date=${fromDate}&to_date=${toDate}&limit=${limit}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const fetchInventoryAlerts =
  async (): Promise<InventoryAlertsResult> => {
    const res = await apiClient.get<{ data: InventoryAlertsResult }>(
      `${URL}/inventory-alerts`,
    );

    if (!res.ok) {
      throw new Error(getErrorMessage(res));
    }

    return res.data?.data!;
  };

export const fetchProfitLoss = async (
  fromDate: string,
  toDate: string,
): Promise<ProfitLossResult> => {
  const res = await apiClient.get<{ data: ProfitLossResult }>(
    `${URL}/profit-loss?from_date=${fromDate}&to_date=${toDate}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchCustomerInsights = async (
  fromDate: string,
  toDate: string,
): Promise<CustomerInsightsResult> => {
  const res = await apiClient.get<{ data: CustomerInsightsResult }>(
    `${URL}/customer-insights?from_date=${fromDate}&to_date=${toDate}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchDocumentSummary =
  async (): Promise<DocumentSummaryResult> => {
    const res = await apiClient.get<{ data: DocumentSummaryResult }>(
      `${URL}/document-summary`,
    );

    if (!res.ok) {
      throw new Error(getErrorMessage(res));
    }

    return res.data?.data!;
  };
