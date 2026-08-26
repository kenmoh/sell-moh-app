import { Colors, type ColorPalette } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useLocalSearchParams } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type OrderStatus = "Completed" | "Pending" | "Voided";

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderDetail {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  date: string;
  customer: string;
  phone: string;
  paymentMethod: string;
  reference: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  amountTendered: number;
  cashier: string;
  voidedBy?: string;
  voidedAt?: string;
  voidReason?: string;
}

const mockOrders: Record<number, OrderDetail> = {
  1: {
    id: 1,
    orderNumber: "20847",
    status: "Completed",
    date: "Dec 14, 2024 at 2:47 PM",
    customer: "Walk-in Customer",
    phone: "+234 800 000 0000",
    paymentMethod: "Cash",
    reference: "TXN-455-88213",
    cashier: "Amaka O.",
    items: [
      { name: "Coca-Cola 50cl", quantity: 2, unitPrice: 500 },
      { name: "Indomie Chicken", quantity: 3, unitPrice: 350 },
      { name: "Peak Milk 400g", quantity: 1, unitPrice: 2700 },
    ],
    subtotal: 4750,
    discount: 0,
    tax: 0,
    amountTendered: 5000,
  },
  2: {
    id: 2,
    orderNumber: "20846",
    status: "Pending",
    date: "Dec 14, 2024 at 1:33 PM",
    customer: "Chidi Okafor",
    phone: "+234 800 000 0000",
    paymentMethod: "Card",
    reference: "TXN-253-11708",
    cashier: "Amaka O.",
    items: [
      { name: "Groceries Pack", quantity: 1, unitPrice: 6500 },
      { name: "Soap Bar", quantity: 6, unitPrice: 250 },
      { name: "Detergent", quantity: 5, unitPrice: 170 },
    ],
    subtotal: 8850,
    discount: 0,
    tax: 0,
    amountTendered: 10000,
  },
  3: {
    id: 3,
    orderNumber: "20843",
    status: "Voided",
    date: "Dec 14, 2024 at 9:48 AM",
    customer: "Walk-in Customer",
    phone: "+234 800 000 0000",
    paymentMethod: "Transfer",
    reference: "TXN-453-55241",
    cashier: "Amaka O.",
    items: [
      { name: "Soft Drink (Can)", quantity: 5, unitPrice: 350 },
      { name: "Snack Pack", quantity: 2, unitPrice: 1050 },
    ],
    subtotal: 3850,
    discount: 0,
    tax: 0,
    amountTendered: 0,
    voidedBy: "Amaka Okonkwo",
    voidedAt: "3:22 PM, Dec 14",
    voidReason: "Customer changed mind",
  },
};

const statusConfig: Record<
  OrderStatus,
  {
    color: string;
    bg: string;
    bgDark: string;
    icon: string;
    label: string;
  }
> = {
  Completed: {
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.08)",
    bgDark: "rgba(16, 185, 129, 0.12)",
    icon: "check-circle-2",
    label: "Completed",
  },
  Pending: {
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.08)",
    bgDark: "rgba(245, 158, 11, 0.12)",
    icon: "clock",
    label: "Pending",
  },
  Voided: {
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.08)",
    bgDark: "rgba(239, 68, 68, 0.12)",
    icon: "x-circle",
    label: "Voided",
  },
};

const OrderDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const order = mockOrders[Number(id)] ?? mockOrders[1];
  const status = statusConfig[order.status];
  const total = order.subtotal - order.discount + order.tax;
  const change = Math.max(0, order.amountTendered - total);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Status Banner ─── */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isDark ? status.bgDark : status.bg,
              borderColor: isDark ? `${status.color}22` : `${status.color}18`,
            },
          ]}
        >
          <View
            style={[
              styles.statusIconCircle,
              { backgroundColor: `${status.color}20` },
            ]}
          >
            <Lucide name={status.icon as any} size={22} color={status.color} />
          </View>
          <View style={styles.statusBannerText}>
            <Text style={[styles.statusLabel, { color: status.color }]}>
              {status.label}
            </Text>
            <Text
              style={[
                styles.statusMeta,
                { color: isDark ? colors.textSecondary : "#6b7280" },
              ]}
            >
              Paid via {order.paymentMethod} · {order.date}
            </Text>
          </View>
        </View>

        {/* ─── Order Info Card ─── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? "#262930" : "#eef0f4",
            },
          ]}
        >
          <InfoRow
            label="Order Number"
            value={`#ORD-${order.orderNumber}`}
            valueWeight="700"
            colors={colors}
            isDark={isDark}
          />
          <View
            style={[
              styles.cardDivider,
              {
                backgroundColor: isDark ? "#22252a" : "#f0f2f5",
              },
            ]}
          />
          <InfoRow
            label="Cashier"
            value={order.cashier}
            valueWeight="600"
            colors={colors}
            isDark={isDark}
          />
        </View>

        {/* ─── Void Details (conditional) ─── */}
        {order.status === "Voided" && order.voidedBy && (
          <>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              VOID DETAILS
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#262930" : "#eef0f4",
                },
              ]}
            >
              <InfoRow
                label="Voided by"
                value={order.voidedBy}
                colors={colors}
                isDark={isDark}
              />
              <View
                style={[
                  styles.cardDivider,
                  { backgroundColor: isDark ? "#22252a" : "#f0f2f5" },
                ]}
              />
              <InfoRow
                label="Voided at"
                value={order.voidedAt ?? "—"}
                colors={colors}
                isDark={isDark}
              />
              <View
                style={[
                  styles.cardDivider,
                  { backgroundColor: isDark ? "#22252a" : "#f0f2f5" },
                ]}
              />
              <InfoRow
                label="Reason"
                value={order.voidReason ?? "—"}
                colors={colors}
                isDark={isDark}
              />
            </View>
          </>
        )}

        {/* ─── Items Ordered ─── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          ITEMS ORDERED
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? "#262930" : "#eef0f4",
            },
          ]}
        >
          {order.items.map((item, index) => (
            <View key={item.name}>
              {index > 0 && (
                <View
                  style={[
                    styles.cardDivider,
                    { backgroundColor: isDark ? "#22252a" : "#f0f2f5" },
                  ]}
                />
              )}
              <View style={styles.itemRow}>
                {/* Avatar with first letter */}
                <View
                  style={[
                    styles.itemAvatar,
                    {
                      backgroundColor: isDark
                        ? colors.backgroundElement
                        : "#f3f4f6",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.itemAvatarText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Name + Unit Price */}
                <View style={styles.itemDetails}>
                  <Text
                    style={[styles.itemName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.itemUnitPrice,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ₦{item.unitPrice.toLocaleString()}
                  </Text>
                </View>

                {/* Quantity badge */}
                <View
                  style={[
                    styles.qtyBadge,
                    {
                      backgroundColor: isDark
                        ? colors.backgroundElement
                        : "#f3f4f6",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.qtyBadgeText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ×{item.quantity}
                  </Text>
                </View>

                {/* Line total */}
                <Text style={[styles.itemLineTotal, { color: colors.text }]}>
                  ₦{(item.quantity * item.unitPrice).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── Summary ─── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? "#262930" : "#eef0f4",
            },
          ]}
        >
          <SummaryRow
            label="Subtotal"
            value={`₦${order.subtotal.toLocaleString()}`}
            colors={colors}
          />
          <SummaryRow
            label="Tax"
            value={`₦${order.tax.toLocaleString()}`}
            colors={colors}
          />
          {order.discount > 0 && (
            <SummaryRow
              label="Discount"
              value={`₦${order.discount.toLocaleString()}`}
              colors={colors}
            />
          )}

          {/* Dashed separator */}
          <View style={styles.dashedSeparatorContainer}>
            <View
              style={[
                styles.dashedSeparator,
                {
                  borderColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.08)",
                },
              ]}
            />
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: "#10b981" }]}>
              ₦{total.toLocaleString()}
            </Text>
          </View>

          {order.amountTendered > 0 && (
            <>
              {/* Dashed separator */}
              <View style={styles.dashedSeparatorContainer}>
                <View
                  style={[
                    styles.dashedSeparator,
                    {
                      borderColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.08)",
                    },
                  ]}
                />
              </View>

              <SummaryRow
                label="Amount Tendered"
                value={`₦${order.amountTendered.toLocaleString()}`}
                colors={colors}
              />
              <SummaryRow
                label="Change"
                value={`₦${change.toLocaleString()}`}
                colors={colors}
                highlight
              />
            </>
          )}
        </View>

        {/* Spacer for bottom bar */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ─── Bottom Action Bar ─── */}
      {order.status !== "Voided" && (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.card,
              borderTopColor: isDark ? "#22252a" : "#eef0f4",
            },
          ]}
        >
          {order.status === "Pending" ? (
            /* Pending: Print + Void */
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.actionButtonPrimary,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {}}
              >
                <Lucide name="printer" size={18} color="#fff" />
                <Text style={styles.actionButtonPrimaryText}>
                  Print Receipt
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.actionButtonDanger,
                  {
                    borderColor: isDark ? "#3b1c1c" : "#fde8e8",
                    backgroundColor: isDark
                      ? "rgba(239, 68, 68, 0.10)"
                      : "rgba(239, 68, 68, 0.06)",
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {}}
              >
                <Lucide name="rotate-ccw" size={18} color="#ef4444" />
                <Text style={styles.actionButtonDangerText}>Void</Text>
              </Pressable>
            </>
          ) : (
            /* Completed: Print + Refund */
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.actionButtonOutline,
                  {
                    borderColor: isDark ? colors.backgroundSelected : "#e5e7eb",
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {}}
              >
                <Lucide
                  name="printer"
                  size={18}
                  color={isDark ? colors.text : "#374151"}
                />
                <Text
                  style={[
                    styles.actionButtonOutlineText,
                    { color: isDark ? colors.text : "#374151" },
                  ]}
                >
                  Print Receipt
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.actionButtonDanger,
                  {
                    borderColor: isDark ? "#3b1c1c" : "#fde8e8",
                    backgroundColor: isDark
                      ? "rgba(239, 68, 68, 0.10)"
                      : "rgba(239, 68, 68, 0.06)",
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {}}
              >
                <Lucide name="rotate-ccw" size={18} color="#ef4444" />
                <Text style={styles.actionButtonDangerText}>Refund</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
};

/* ─── Info Row Component ─── */
const InfoRow = ({
  label,
  value,
  valueWeight = "600",
  colors,
  isDark,
}: {
  label: string;
  value: string;
  valueWeight?: "600" | "700" | "800";
  colors: ColorPalette;
  isDark: boolean;
}) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
      {label}
    </Text>
    <Text
      style={[
        styles.infoValue,
        { color: colors.text, fontWeight: valueWeight },
      ]}
    >
      {value}
    </Text>
  </View>
);

/* ─── Summary Row Component ─── */
const SummaryRow = ({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: string;
  colors: ColorPalette;
  highlight?: boolean;
}) => (
  <View style={styles.summaryRow}>
    <Text
      style={[
        styles.summaryLabel,
        { color: highlight ? colors.text : "#6b7280" },
      ]}
    >
      {label}
    </Text>
    <Text
      style={[
        styles.summaryValue,
        { color: highlight ? "#10b981" : colors.text },
        highlight && { fontWeight: "700" },
      ]}
    >
      {value}
    </Text>
  </View>
);

export default OrderDetails;

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 16,
    gap: 6,
  },

  /* ─── Status Banner ─── */
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBannerText: {
    flex: 1,
    gap: 3,
  },
  statusLabel: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  statusMeta: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },

  /* ─── Card ─── */
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    // Subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 0,
  },

  /* ─── Section Title ─── */
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    paddingHorizontal: 4,
    paddingTop: 14,
    paddingBottom: 4,
  },

  /* ─── Info Rows ─── */
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "400",
  },
  infoValue: {
    fontSize: 14,
  },

  /* ─── Item Row ─── */
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemAvatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemDetails: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.15,
  },
  itemUnitPrice: {
    fontSize: 13,
    fontWeight: "400",
  },
  qtyBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 34,
    alignItems: "center",
  },
  qtyBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  itemLineTotal: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    minWidth: 70,
    textAlign: "right",
  },

  /* ─── Summary ─── */
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "400",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },

  dashedSeparatorContainer: {
    paddingVertical: 8,
  },
  dashedSeparator: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  /* ─── Bottom Action Bar ─── */
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 100,
    gap: 8,
  },
  actionButtonFull: {
    flex: 1,
  },
  actionButtonPrimary: {
    backgroundColor: "#3b82f6",
  },
  actionButtonPrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  actionButtonOutline: {
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  actionButtonOutlineText: {
    fontSize: 15,
    fontWeight: "600",
  },
  actionButtonDanger: {
    borderWidth: 1.5,
  },
  actionButtonDangerText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.98 }],
  },
});
