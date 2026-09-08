import { apiClient } from "./client";
import type {
  InAppNotification,
  NotificationListResult,
  NotificationType,
} from "@/types/notifications";

const getErrorMessage = (res: any): string => {
  if (res.data && typeof res.data === "object" && res.data.message) {
    return res.data.message;
  }
  return res.problem || "An unknown error occurred";
};

interface FetchNotificationsParams {
  type?: NotificationType;
  unread_only?: boolean;
  offset?: number;
  limit?: number;
}

export const fetchNotifications = async (
  params?: FetchNotificationsParams,
): Promise<NotificationListResult> => {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.unread_only) query.set("unread_only", "true");
  if (params?.offset) query.set("offset", String(params.offset));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const url = `/notifications${qs ? `?${qs}` : ""}`;

  const res = await apiClient.get<{ data: NotificationListResult }>(url);
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data?.data!;
};

export const fetchUnreadCount = async (): Promise<number> => {
  const res = await apiClient.get<{ data: { count: number } }>(
    "/notifications/unread-count",
  );
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data?.data?.count ?? 0;
};

export const markNotificationsRead = async (
  notificationIds: string[],
): Promise<number> => {
  const res = await apiClient.patch<{ data: { marked: number } }>(
    "/notifications/read",
    { notification_ids: notificationIds },
  );
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data?.data?.marked ?? 0;
};

export const markAllRead = async (): Promise<number> => {
  const res = await apiClient.patch<{ data: { marked: number } }>(
    "/notifications/read-all",
  );
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data?.data?.marked ?? 0;
};

export const deleteNotifications = async (
  notificationIds: string[],
): Promise<number> => {
  const res = await apiClient.delete<{ data: { deleted: number } }>(
    "/notifications",
    { data: { notification_ids: notificationIds } } as any,
  );
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
  return res.data?.data?.deleted ?? 0;
};

export const registerPushToken = async (
  token: string,
  platform: "ios" | "android",
): Promise<void> => {
  const res = await apiClient.post<{ data: { registered: boolean } }>(
    "/notifications/push-token",
    { token, platform },
  );
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};

export const deactivatePushToken = async (): Promise<void> => {
  const res = await apiClient.delete<{ data: { deactivated: number } }>(
    "/notifications/push-token",
  );
  if (!res.ok) {
    throw new Error(getErrorMessage(res));
  }
};
