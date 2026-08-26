import { ColorPalette, Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export type OrderStatus = "Completed" | "Pending" | "Voided";

export interface Order {
  id: number | string;
  orderNumber: string;
  customer?: string;
  itemCount: number;
  price: number;
  status: OrderStatus;
  date: string;
  paymentMethod?: string;
}

export interface OrderCardProps {
  order?: Order;
  orderNumber?: string;
  customer?: string;
  itemCount?: number;
  price?: number;
  status?: OrderStatus;
  date?: string;
  paymentMethod?: string;
  onPress: () => void;
}

const statusConfig: Record<
  OrderStatus,
  { color: string; bg: string; icon: string }
> = {
  Completed: {
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    icon: "check-circle-2",
  },
  Pending: {
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    icon: "clock",
  },
  Voided: {
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    icon: "x-circle",
  },
};

const OrderCard = (props: OrderCardProps) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];

  const orderNumber = props.order?.orderNumber ?? props.orderNumber ?? "000";
  const customer =
    props.order?.customer ?? props.customer ?? "Walk-in Customer";
  const itemCount = props.order?.itemCount ?? props.itemCount ?? 1;
  const price = props.order?.price ?? props.price ?? 0;
  const status: OrderStatus = props.order?.status ?? props.status ?? "Pending";
  const date = props.order?.date ?? props.date ?? "";
  const paymentMethod = props.order?.paymentMethod ?? props.paymentMethod;

  const statusStyle = statusConfig[status] ?? statusConfig.Pending;

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? "#262930" : "#eef0f4",
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {/* Header Row: Order Number + Status Pill */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.orderPill,
            { backgroundColor: isDark ? "#1e2638" : "#eff6ff" },
          ]}
        >
          <Lucide name="receipt" size={13} color="#3b82f6" />
          <Text style={styles.orderNumberText}>#ORD-{orderNumber}</Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
          <Lucide
            name={statusStyle.icon as any}
            size={12}
            color={statusStyle.color}
          />
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {status}
          </Text>
        </View>
      </View>

      {/* Main Row: Customer + Meta Details vs Price */}
      <View style={styles.mainRow}>
        <View style={styles.customerColumn}>
          <Text
            style={[styles.customerName, { color: colors.text }]}
            numberOfLines={1}
          >
            {customer}
          </Text>

          <View style={styles.tagsRow}>
            <View
              style={[
                styles.metaTag,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Lucide name="package" size={11} color={colors.textSecondary} />
              <Text
                style={[styles.metaTagText, { color: colors.textSecondary }]}
              >
                {itemCount} {itemCount === 1 ? "Item" : "Items"}
              </Text>
            </View>

            {paymentMethod ? (
              <View
                style={[
                  styles.metaBadge,
                  { backgroundColor: colors.backgroundElement },
                ]}
              >
                <Lucide
                  name={
                    paymentMethod === "Cash"
                      ? "banknote"
                      : paymentMethod === "Card"
                        ? "credit-card"
                        : "arrow-up-right"
                  }
                  size={11}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.metaBadgeText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {paymentMethod}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.priceColumn}>
          <Text style={[styles.priceText, { color: colors.text }]}>
            ₦{price.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Footer Divider & Date / Details Arrow */}
      <View
        style={[
          styles.divider,
          { backgroundColor: isDark ? "#22252a" : "#f0f2f5" },
        ]}
      />

      <View style={styles.footerRow}>
        <View style={styles.dateContainer}>
          <Lucide name="clock" size={12} color={colors.textSecondary} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {date}
          </Text>
        </View>

        <View style={styles.detailsLink}>
          <Text style={styles.detailsLinkText}>View Order</Text>
          <Lucide name="chevron-right" size={14} color="#3b82f6" />
        </View>
      </View>
    </Pressable>
  );
};

export default OrderCard;

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    // Subtle shadow on iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    // Elevation for Android
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  orderNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3b82f6",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  customerColumn: {
    flex: 1,
    paddingRight: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  metaTagText: {
    fontSize: 11,
    fontWeight: "500",
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  priceColumn: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  detailsLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3b82f6",
  },
});
