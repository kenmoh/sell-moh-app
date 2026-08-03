import { Colors } from "@/constants/theme";
import { Host, Switch } from "@expo/ui";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterType = "All" | "Unread" | "Orders" | "Inventory" | "System";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  dateGroup: "Today" | "Yesterday" | "Older";
  iconColor: string;
  iconBg: string;
  iconName: string;
  unread: boolean;
}

const notifications: Notification[] = [
  {
    id: "1",
    title: "Low Stock Alert",
    description: "Indomie Chicken 70g is running low — only 12 units left",
    time: "2:00 PM",
    dateGroup: "Today",
    iconColor: "#d97706",
    iconBg: "rgba(217,119,6,0.1)",
    iconName: "alert-triangle",
    unread: true,
  },
  {
    id: "2",
    title: "New Order",
    description: "Order #ORD-20848 placed by Walk-in Customer for ₦8,200",
    time: "1:35 PM",
    dateGroup: "Today",
    iconColor: "#3b82f6",
    iconBg: "rgba(59,130,246,0.1)",
    iconName: "receipt",
    unread: true,
  },
  {
    id: "3",
    title: "Payment Received",
    description: "Cash payment of ₦4,750 confirmed for #ORD-20847",
    time: "12:47 PM",
    dateGroup: "Today",
    iconColor: "#16a34a",
    iconBg: "rgba(22,163,74,0.1)",
    iconName: "credit-card",
    unread: false,
  },
  {
    id: "4",
    title: "Out of Stock",
    description: "Bluetooth Earbuds Pro is now out of stock",
    time: "4:12 PM",
    dateGroup: "Yesterday",
    iconColor: "#dc2626",
    iconBg: "rgba(220,38,38,0.1)",
    iconName: "x-circle",
    unread: true,
  },
  {
    id: "5",
    title: "Daily Summary",
    description: "Dec 13 summary: 12 orders, ₦38,500 revenue",
    time: "11:59 PM",
    dateGroup: "Yesterday",
    iconColor: "#3b82f6",
    iconBg: "rgba(59,130,246,0.1)",
    iconName: "bar-chart-2",
    unread: false,
  },
  {
    id: "6",
    title: "Staff Login",
    description: "Chidi Okafor logged in at 8:02 AM",
    time: "8:02 AM",
    dateGroup: "Yesterday",
    iconColor: "#6b7280",
    iconBg: "rgba(107,114,128,0.1)",
    iconName: "user",
    unread: false,
  },
  {
    id: "7",
    title: "System Update",
    description: "StoreFlow POS updated to v2.4.1",
    time: "Dec 12",
    dateGroup: "Older",
    iconColor: "#6b7280",
    iconBg: "rgba(107,114,128,0.1)",
    iconName: "settings",
    unread: false,
  },
];

const filters: FilterType[] = ["All", "Unread", "Orders", "Inventory", "System"];

const notificationTypes = [
  { id: "orders", label: "Orders", icon: "receipt", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  { id: "payments", label: "Payments", icon: "credit-card", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  { id: "inventory", label: "Inventory Alerts", icon: "package", color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  { id: "stock", label: "Out of Stock", icon: "x-circle", color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
  { id: "staff", label: "Staff Activity", icon: "users", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  { id: "summary", label: "Daily Summary", icon: "bar-chart-2", color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  { id: "system", label: "System Updates", icon: "settings", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
];

const Notifications = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [typeToggles, setTypeToggles] = useState<Record<string, boolean>>({
    orders: true,
    payments: true,
    inventory: true,
    stock: true,
    staff: false,
    summary: true,
    system: false,
  });
  const [notifs, setNotifs] = useState(notifications);

  const unreadCount = notifs.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const filtered = notifs.filter((n) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return n.unread;
    return true;
  });

  const groups = ["Today", "Yesterday", "Older"] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Lucide name="chevron-left" size={24} color={colors.text} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notifications
        </Text>
        <Pressable onPress={markAllRead}>
          <Text style={styles.markReadLink}>Mark all as read</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          gap: 16,
        }}
      >
        {/* Notification Type Toggles */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            NOTIFICATION TYPES
          </Text>
          <View style={[styles.typesCard, { backgroundColor: colors.card }]}>
            {notificationTypes.map((type, i) => (
              <View
                key={type.id}
                style={[
                  styles.typeRow,
                  i < notificationTypes.length - 1 && {
                    borderBottomColor: colors.backgroundElement,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.bg }]}>
                  <Lucide name={type.icon as any} size={16} color={type.color} />
                </View>
                <Text style={[styles.typeLabel, { color: colors.text }]}>
                  {type.label}
                </Text>
                <Host matchContents>
                  <Switch
                    value={typeToggles[type.id]}
                    onValueChange={() =>
                      setTypeToggles((prev) => ({
                        ...prev,
                        [type.id]: !prev[type.id],
                      }))
                    }
                  />
                </Host>
              </View>
            ))}
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
        >
          {filters.map((f) => {
            const isActive = f === activeFilter;
            const showBadge = f === "Unread" && unreadCount > 0;
            return (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? "#3b82f6" : "transparent",
                    borderColor: isActive ? "#3b82f6" : colors.backgroundElement,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isActive ? "#fff" : colors.textSecondary },
                  ]}
                >
                  {f}
                </Text>
                {showBadge && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Notification Groups */}
        {groups.map((group) => {
          const items = filtered.filter((n) => n.dateGroup === group);
          if (items.length === 0) return null;
          return (
            <View key={group} style={{ paddingHorizontal: 20 }}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {group.toUpperCase()}
              </Text>
              <View style={styles.notifList}>
                {items.map((n) => (
                  <Pressable
                    key={n.id}
                    style={[styles.notifCard, { backgroundColor: colors.card }]}
                  >
                    {n.unread && <View style={styles.unreadDot} />}
                    <View
                      style={[styles.iconBadge, { backgroundColor: n.iconBg }]}
                    >
                      <Lucide name={n.iconName as any} size={18} color={n.iconColor} />
                    </View>
                    <View style={styles.notifInfo}>
                      <Text style={[styles.notifTitle, { color: colors.text }]}>
                        {n.title}
                      </Text>
                      <Text
                        style={[styles.notifDesc, { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {n.description}
                      </Text>
                    </View>
                    <Text style={[styles.notifTime, { color: colors.textSecondary }]}>
                      {n.time}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  markReadLink: { color: "#3b82f6", fontSize: 13, fontWeight: "600" },
  typesCard: { borderRadius: 12, padding: 4 },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 10,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  filterTabs: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  filterBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  notifList: { gap: 8 },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  notifInfo: { flex: 1, gap: 4 },
  notifTitle: { fontSize: 14, fontWeight: "700" },
  notifDesc: { fontSize: 13, lineHeight: 18 },
  notifTime: { fontSize: 11, fontWeight: "500" },
});
