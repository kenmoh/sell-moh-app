interface TenantCreate {
  actor_id?: string | null;
  business_name: string;
  business_email: string;
  owner_name: string;
  owner_email: string;
  owner_phone?: string | null;
  owner_password_hash: string;
  tier?: string;
  correlation_id?: string | null;
}

interface TenantResult {
  tenant_id: string;
  slug: string;
  subdomain: string;
  business_name: string;
  tier: string;
  status: string;
  owner_user_id: string;
}

interface TierChange {
  tenant_id: string;
  actor_id?: string | null;
  new_tier: string;
  correlation_id?: string | null;
}

export interface CreateEmployee {
  email: string;
  full_name: string;
  phone?: string | null;
  role: string;
  password: string;
}

export interface EmployeeResponse {
  user_id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  totp_enabled: boolean;
  last_login_at: string | null;
}

interface RoleResponse {
  id: string;
  name: string;
  rank: number;
  description: string | null;
}

interface PermissionResponse {
  id: string;
  name: string;
  description: string | null;
}

interface UserRoleAssign {
  user_id: string;
  role_name: string;
  actor_id?: string | null;
  correlation_id?: string | null;
}

interface UserRoleRemove {
  user_id: string;
  role_name: string;
  correlation_id?: string | null;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  business_name: string;
  business_email: string;
  owner_name: string;
  owner_email: string;
  owner_phone?: string;
  password: string;
  confirm_password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthUser {
  user_id: string;
  business_id: string;
  email: string;
  full_name: string;
  store_id: string | null;
  role: string;
  status: string;
  permissions: string[];
  totp_enabled: boolean;
  last_login_at: string | null;
  avatar_url: string | null;
}

export interface LoginResponseData {
  tokens: AuthTokens;
  user: AuthUser;
  requires_totp: boolean;
}

export interface DataMessageResponse<T = unknown> {
  data?: T | null;
  message: string;
}

interface Permission {
  id: string;
  name: string;
  description: string | null;
}

export interface Permissions {
  data: Permission[];
}

export interface CreateRole {
  name: string;
  rank: number;
  description: string | null;
  permission_ids: string[];
}

export interface UpdateRole extends CreateRole {}

export interface FetchTenantRoles extends RoleResponse {
  permissions: string[];
}
