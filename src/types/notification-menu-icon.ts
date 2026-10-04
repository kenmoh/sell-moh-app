// notification-menu-icons.ts
import BarChart from "@expo/material-symbols/bar_chart.xml";
import Cancel from "@expo/material-symbols/cancel.xml";
import CreditCard from "@expo/material-symbols/credit_card.xml";
import Group from "@expo/material-symbols/group.xml";
import Inventory from "@expo/material-symbols/inventory_2.xml";
import Notifications from "@expo/material-symbols/notifications.xml";
import Receipt from "@expo/material-symbols/receipt_long.xml";
import Settings from "@expo/material-symbols/settings.xml";

const isIOS = process.env.EXPO_OS === "ios";

const MENU_ICONS = {
  orders: { sf: "doc.text", material: Receipt },
  payments: { sf: "creditcard", material: CreditCard },
  inventory: { sf: "shippingbox", material: Inventory },
  stock: { sf: "xmark.circle", material: Cancel },
  staff: { sf: "person.2", material: Group },
  summary: { sf: "chart.bar", material: BarChart },
  system: { sf: "gearshape", material: Settings },
} as const;

const FALLBACK = { sf: "bell", material: Notifications } as const;

export function getMenuIcon(id: string) {
  const entry = MENU_ICONS[id as keyof typeof MENU_ICONS] ?? FALLBACK;
  return isIOS ? entry.sf : entry.material;
}
