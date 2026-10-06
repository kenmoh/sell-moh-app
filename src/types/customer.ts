export type CustomerType = "customer" | "vendor";

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateCustomerRequest {
  name: string;
  type?: CustomerType;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface UpdateCustomerRequest {
  name?: string | null;
  type?: CustomerType | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  page_size: number;
}
