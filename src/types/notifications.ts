export type NotificationType =
  | "orders"
  | "payments"
  | "inventory"
  | "stock"
  | "staff"
  | "summary"
  | "system";

export interface InAppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationListResult {
  items: InAppNotification[];
  unread_count: number;
  total: number;
}

export interface NotificationTypeConfig {
  id: NotificationType;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export const NOTIFICATION_TYPE_CONFIG: NotificationTypeConfig[] = [
  { id: "orders", label: "Orders", icon: "receipt", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  { id: "payments", label: "Payments", icon: "credit-card", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  { id: "inventory", label: "Inventory Alerts", icon: "package", color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  { id: "stock", label: "Out of Stock", icon: "x-circle", color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
  { id: "staff", label: "Staff Activity", icon: "users", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  { id: "summary", label: "Daily Summary", icon: "bar-chart-2", color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  { id: "system", label: "System Updates", icon: "settings", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
];

export function getNotificationTypeConfig(type: NotificationType): NotificationTypeConfig {
  return (
    NOTIFICATION_TYPE_CONFIG.find((c) => c.id === type) ?? {
      id: type,
      label: type,
      icon: "bell",
      color: "#6b7280",
      bg: "rgba(107,114,128,0.1)",
    }
  );
}
