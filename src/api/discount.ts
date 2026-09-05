import {
  CreateCouponRequest,
  CreateDiscountRequest,
  Coupon,
  Discount,
  PaginatedCoupons,
  PaginatedDiscounts,
  UpdateCouponRequest,
  UpdateDiscountRequest,
  ValidateCouponResponse,
} from "@/types/discount";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const DISCOUNT_URL = "/discounts";
const COUPON_URL = "/coupons";

// ── Discounts (Promotions) ─────────────────────────────────────────────

export const fetchDiscounts = async (
  page = 1,
  pageSize = 50,
  activeOnly = false,
): Promise<PaginatedDiscounts> => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  if (activeOnly) params.append("active_only", "true");
  const res = await apiClient.get(
    `${DISCOUNT_URL}?${params.toString()}`,
  );
  if (!res.ok) throw new Error(getErrorMessage(res));
  const body = res.data as any;
  return {
    items: body.data ?? [],
    total: body.total ?? 0,
    page: body.page ?? page,
    page_size: body.page_size ?? pageSize,
  };
};

export const fetchDiscount = async (id: string): Promise<Discount> => {
  const res = await apiClient.get<{ data: Discount }>(`${DISCOUNT_URL}/${id}`);
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};

export const createDiscount = async (
  data: CreateDiscountRequest,
): Promise<Discount> => {
  const res = await apiClient.post<{ data: Discount }>(DISCOUNT_URL, data);
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};

export const updateDiscount = async (
  id: string,
  data: UpdateDiscountRequest,
): Promise<Discount> => {
  const res = await apiClient.patch<{ data: Discount }>(
    `${DISCOUNT_URL}/${id}`,
    data,
  );
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};

export const toggleDiscount = async (id: string): Promise<Discount> => {
  const res = await apiClient.patch<{ data: Discount }>(
    `${DISCOUNT_URL}/${id}/toggle`,
  );
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};

export const deleteDiscount = async (id: string): Promise<void> => {
  const res = await apiClient.delete(`${DISCOUNT_URL}/${id}`);
  if (!res.ok) throw new Error(getErrorMessage(res));
};

// ── Coupons ────────────────────────────────────────────────────────────

export const fetchCoupons = async (
  page = 1,
  pageSize = 50,
): Promise<PaginatedCoupons> => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  const res = await apiClient.get(
    `${COUPON_URL}?${params.toString()}`,
  );
  if (!res.ok) throw new Error(getErrorMessage(res));
  const body = res.data as any;
  return {
    items: body.data ?? [],
    total: body.total ?? 0,
    page: body.page ?? page,
    page_size: body.page_size ?? pageSize,
  };
};

export const fetchCoupon = async (id: string): Promise<Coupon> => {
  const res = await apiClient.get<{ data: Coupon }>(`${COUPON_URL}/${id}`);
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};

export const createCoupon = async (
  data: CreateCouponRequest,
): Promise<Coupon> => {
  const res = await apiClient.post<{ data: Coupon }>(COUPON_URL, data);
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};

export const updateCoupon = async (
  id: string,
  data: UpdateCouponRequest,
): Promise<Coupon> => {
  const res = await apiClient.patch<{ data: Coupon }>(
    `${COUPON_URL}/${id}`,
    data,
  );
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};

export const deleteCoupon = async (id: string): Promise<void> => {
  const res = await apiClient.delete(`${COUPON_URL}/${id}`);
  if (!res.ok) throw new Error(getErrorMessage(res));
};

export const validateCoupon = async (
  code: string,
  cartSubtotal: number,
): Promise<ValidateCouponResponse> => {
  const res = await apiClient.post<{ data: ValidateCouponResponse }>(
    `${COUPON_URL}/validate`,
    { coupon_code: code, cart_subtotal: cartSubtotal },
  );
  if (!res.ok) throw new Error(getErrorMessage(res));
  return res.data?.data!;
};
