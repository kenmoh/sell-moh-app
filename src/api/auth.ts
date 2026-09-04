import {
  CreateEmployee,
  CreateRole,
  DataMessageResponse,
  EmployeeResponse,
  FetchTenantRoles,
  LoginRequest,
  Permissions,
  RegisterRequest,
  UpdateRole,
} from "@/types/auth";
import { apiClient } from "./client";

const URL = "/auth";

interface DeleteResponse {
  message: string;
  data: { success: boolean };
}

/**
 * Extracts a readable error message from the API response
 */
export const getErrorMessage = (res: any): string => {
  if (res.data && typeof res.data === "object" && res.data.message) {
    return res.data.message;
  }
  return res.problem || "An unknown error occurred";
};

export const createTenant = async (
  data: RegisterRequest,
): Promise<DataMessageResponse> => {
  const res = await apiClient.post<DataMessageResponse>(
    `${URL}/register`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const login = async (
  data: LoginRequest,
): Promise<DataMessageResponse> => {
  const res = await apiClient.post<DataMessageResponse>(`${URL}/login`, data);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

// ____________________________________Permissions____________________________________
export const getPermissions = async (): Promise<Permissions> => {
  const res = await apiClient.get<Permissions>(`${URL}/permissions`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

// ____________________________________Role Management____________________________________
export const getRoles = async (): Promise<Permissions> => {
  const res = await apiClient.get<Permissions>(`${URL}/roles`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const createRole = async (
  data: CreateRole,
): Promise<DataMessageResponse> => {
  const res = await apiClient.post<DataMessageResponse>(`${URL}/roles`, data);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const updateRole = async (
  data: UpdateRole,
): Promise<DataMessageResponse> => {
  const res = await apiClient.patch<DataMessageResponse>(`${URL}/roles`, data);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const deleteRole = async (
  data: UpdateRole,
): Promise<DataMessageResponse> => {
  const res = await apiClient.delete<DataMessageResponse>(`${URL}/roles`, data);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const fetchTenantRoles = async (): Promise<FetchTenantRoles[]> => {
  const res = await apiClient.get<{ data: FetchTenantRoles[] }>(`${URL}/roles`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

// ____________________________________Employee Management____________________________________
export const createEmployee = async (
  data: CreateEmployee,
): Promise<EmployeeResponse> => {
  const res = await apiClient.post<EmployeeResponse>(`${URL}/employees`, data);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data as EmployeeResponse;
};

export const getEmployees = async (): Promise<EmployeeResponse[]> => {
  const res = await apiClient.get<{ data: EmployeeResponse[] }>(
    `${URL}/employees`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

export const updateEmployee = async (
  employeeId: string,
  data: Omit<CreateEmployee, "password | role">,
): Promise<EmployeeResponse> => {
  const res = await apiClient.patch<EmployeeResponse>(
    `${URL}/employees/${employeeId}`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data as EmployeeResponse;
};
export const setEmployeeStatus = async (
  employeeId: string,
  data: { status: "active" | "suspended" },
): Promise<EmployeeResponse> => {
  const res = await apiClient.patch<EmployeeResponse>(
    `${URL}/employees/${employeeId}/status`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data as EmployeeResponse;
};

export const deleteEmployee = async (
  employeeId: string,
): Promise<DeleteResponse> => {
  const res = await apiClient.delete<DeleteResponse>(
    `${URL}/employees/${employeeId}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data as DeleteResponse;
};

// ____________________________________Auto Create Cart____________________________________
export const toggleAutoCreateCart = async (): Promise<{ auto_create_cart: boolean }> => {
  const res = await apiClient.patch<{ data: { auto_create_cart: boolean } }>(
    `${URL}/auto-create-cart`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const fetchMe = async (): Promise<any> => {
  const res = await apiClient.get<{ data: any }>(`${URL}/me`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const getPinStatus = async (): Promise<{
  has_pin: boolean;
  expires_at: string | null;
}> => {
  const res = await apiClient.get<{ data: { has_pin: boolean; expires_at: string | null } }>(
    `${URL}/pin/status`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const setSupervisorPin = async (pin: string): Promise<void> => {
  const res = await apiClient.post(`${URL}/pin`, { pin });

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};
