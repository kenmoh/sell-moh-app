import {
  CreateCustomerRequest,
  Customer,
  CustomerListResponse,
  UpdateCustomerRequest,
} from "@/types/customer";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const URL = "/customers";

export const fetchCustomers = async (
  page = 1,
  pageSize = 50,
  search?: string,
): Promise<CustomerListResponse> => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  if (search) params.append("search", search);
  const res = await apiClient.get<{
    data: Customer[];
    total: number;
    page: number;
    page_size: number;
  }>(`${URL}?${params.toString()}`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return {
    items: res.data?.data ?? [],
    total: res.data?.total ?? 0,
    page: res.data?.page ?? 1,
    page_size: res.data?.page_size ?? pageSize,
  };
};

export const fetchCustomer = async (customerId: string): Promise<Customer> => {
  const res = await apiClient.get<{ data: Customer }>(`${URL}/${customerId}`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const createCustomer = async (
  data: CreateCustomerRequest,
): Promise<Customer> => {
  const res = await apiClient.post<{ data: Customer }>(URL, data);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const updateCustomer = async (
  customerId: string,
  data: UpdateCustomerRequest,
): Promise<Customer> => {
  const res = await apiClient.patch<{ data: Customer }>(
    `${URL}/${customerId}`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  const res = await apiClient.delete(`${URL}/${customerId}`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};
