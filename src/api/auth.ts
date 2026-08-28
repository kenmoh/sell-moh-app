import {
  CreateRole,
  DataMessageResponse,
  FetchTenantRoles,
  LoginRequest,
  Permissions,
  RegisterRequest,
  UpdateRole,
} from "@/types/auth";
import { apiClient } from "./client";

const URL = "/auth";

/**
 * Extracts a readable error message from the API response
 */
const getErrorMessage = (res: any): string => {
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
