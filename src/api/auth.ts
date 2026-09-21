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

export const socialSignIn = async (
  data: { id_token: string; provider: "google" | "apple" },
): Promise<DataMessageResponse> => {
  const res = await apiClient.post<DataMessageResponse>(`${URL}/social`, data);

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
  const res = await apiClient.patch<DataMessageResponse>(
    `${URL}/roles/${data.id}`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!;
};

export const deleteRole = async (
  roleId: string,
): Promise<DataMessageResponse> => {
  const res = await apiClient.delete<DataMessageResponse>(
    `${URL}/roles/${roleId}`,
  );

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

// ____________________________________Session Management____________________________________

export const logoutApi = async (
  refreshToken: string,
  allDevices = false,
): Promise<void> => {
  const res = await apiClient.post(`${URL}/logout`, {
    refresh_token: refreshToken,
    all_devices: allDevices,
  });
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

export const listSessions = async (): Promise<SessionItem[]> => {
  const res = await apiClient.get<{ data: SessionItem[] }>(`${URL}/sessions`);
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data?.data ?? [];
};

export const revokeSession = async (sessionId: string): Promise<void> => {
  const res = await apiClient.delete(`${URL}/sessions/${sessionId}`);
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

export interface SessionItem {
  id: string;
  device_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  last_active_at: string | null;
}

// ____________________________________Password Management____________________________________

export const forgotPassword = async (email: string): Promise<void> => {
  const res = await apiClient.post(`${URL}/forgot-password`, { email });
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<void> => {
  const res = await apiClient.post(`${URL}/reset-password`, {
    token,
    new_password: newPassword,
  });
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
}): Promise<void> => {
  const res = await apiClient.post(`${URL}/change-password`, data);
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

// ____________________________________2FA / TOTP____________________________________

export const setupTotp = async (): Promise<{
  secret: string;
  otpauth_url: string;
}> => {
  const res = await apiClient.post<{ data: { secret: string; otpauth_url: string } }>(
    `${URL}/totp/setup`,
  );
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data!.data;
};

export const verifyTotp = async (code: string): Promise<void> => {
  const res = await apiClient.post(`${URL}/totp/verify`, { code });
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

export const disableTotp = async (
  password: string,
  code: string,
): Promise<void> => {
  const res = await apiClient.post(`${URL}/totp/disable`, { password, code });
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string | null;
}

export const getAuditLogs = async (opts?: {
  action?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> => {
  const params: Record<string, string> = {};
  if (opts?.action) params.action = opts.action;
  if (opts?.limit) params.limit = String(opts.limit);
  if (opts?.offset) params.offset = String(opts.offset);

  const res = await apiClient.get<{ data: AuditLogEntry[] }>(`${URL}/audit`, {
    params,
  });

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};
