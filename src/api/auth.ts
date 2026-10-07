import {
  CreateEmployee,
  CreateRole,
  DataMessageResponse,
  Employee,
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
/**
 * Pull a human-readable message out of a failed response.
 *
 * The backend is FastAPI, and FastAPI puts the reason under `detail` — an
 * HTTPException gives a string, a 422 validation failure gives a list of
 * {loc, msg} objects. Reading only `message` meant every failure fell through
 * to apisauce's `problem`, so a 403 rendered as the word "CLIENT_ERROR" and a
 * validation failure lost its field names entirely. Any toast built on this
 * was useless, which is why so many call sites had no error handling at all:
 * there was nothing useful to show.
 */
export const getErrorMessage = (res: any): string => {
  const body = res?.data;

  // Some handlers answer with a plain {message}.
  if (body && typeof body === "object" && typeof body.message === "string") {
    return body.message;
  }

  const detail = body?.detail ?? body?.error;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  // 422: a list of field errors. Name the fields so the user knows what to fix.
  if (Array.isArray(detail) && detail.length) {
    return detail
      .map((item: any) => {
        const field = Array.isArray(item?.loc)
          ? item.loc.filter((part: unknown) => part !== "body").join(".")
          : "";
        const message = item?.msg ?? String(item);
        return field ? `${field}: ${message}` : message;
      })
      .join("\n");
  }

  return res?.problem || "An unknown error occurred";
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

/**
 * Replace a role's permission set.
 *
 * Needs a supervisor PIN unless the caller is an owner, so `supervisorPin` is
 * only sent once the server has asked for it — sending it eagerly would leak a
 * credential the owner was never asked for.
 */
export const setRolePermissions = async (
  roleId: string,
  permissionIds: string[],
  supervisorPin?: string,
): Promise<FetchTenantRoles> => {
  const res = await apiClient.put<{ data: FetchTenantRoles }>(
    `${URL}/roles/${roleId}/permissions`,
    {
      permission_ids: permissionIds,
      ...(supervisorPin ? { supervisor_pin: supervisorPin } : {}),
    },
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data!.data;
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

export const getEmployees = async (): Promise<Employee[]> => {
  const res = await apiClient.get<{ data: Employee[] }>(`${URL}/employees`);

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
/**
 * Role assignment, per employee.
 *
 * These hit the per-user routes rather than the older PATCH /employees/role:
 * a user can hold several roles, so assignment has to be able to add one
 * without disturbing the others, and removal needs its own call.
 */
export const getEmployeeRoles = async (
  employeeId: string,
): Promise<FetchTenantRoles[]> => {
  const res = await apiClient.get<{ data: FetchTenantRoles[] }>(
    `${URL}/employees/${employeeId}/roles`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data ?? [];
};

/** Add a role. Returns false when the user already holds it. */
export const assignEmployeeRole = async (
  employeeId: string,
  roleName: string,
): Promise<boolean> => {
  const res = await apiClient.post<{ message: string }>(
    `${URL}/employees/${employeeId}/roles`,
    { user_id: employeeId, new_role: roleName },
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return true;
};

/** Remove one role, leaving the others in place. */
export const removeEmployeeRole = async (
  employeeId: string,
  roleName: string,
): Promise<void> => {
  const res = await apiClient.delete(
    `${URL}/employees/${employeeId}/roles/${encodeURIComponent(roleName)}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
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
