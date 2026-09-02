import {
  CartCreatedResponse,
  CartDetailResponse,
  CheckoutRequest,
  CheckoutResultResponse,
  CreateCartRequest,
  VoidItemRequest,
} from "@/types/cart";
import { getErrorMessage } from "./auth";
import { apiClient } from "./client";

const URL = "/cart";

export const createCart = async (
  data: CreateCartRequest,
): Promise<CartCreatedResponse> => {
  const res = await apiClient.post<{ data: CartCreatedResponse }>(URL, data);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const getCart = async (cartId: string): Promise<CartDetailResponse> => {
  const res = await apiClient.get<{ data: CartDetailResponse }>(
    `${URL}/${cartId}`,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};

export const removeCartItem = async (itemId: string): Promise<void> => {
  const res = await apiClient.delete(`${URL}/items/${itemId}`);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

export const voidCartItem = async (
  itemId: string,
  data: VoidItemRequest,
): Promise<void> => {
  const res = await apiClient.post(`${URL}/items/${itemId}/void`, data);

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

export const checkoutCart = async (
  cartId: string,
  data: CheckoutRequest,
): Promise<CheckoutResultResponse> => {
  const res = await apiClient.post<{ data: CheckoutResultResponse }>(
    `${URL}/${cartId}/checkout`,
    data,
  );

  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }

  return res.data?.data!;
};
