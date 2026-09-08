import { getSaleById } from "@/api/sales";
import { Colors, type ColorPalette } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type OrderStatus = "Completed" | "Pending" | "Voided";

const statusMap: Record<string, OrderStatus> = {
  completed: "Completed",
  pending: "Pending",
  partial: "Pending",
  voided: "Voided",
};

const statusConfig: Record<
  OrderStatus,
  { color: string; bg: string; bgDark: string; icon: string; label: string }
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

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function getPaymentMethod(pm: Record<string, number> | null): string {
  if (!pm) return "Cash";
  if (pm.split) return "Split";
  if (pm.card > 0) return "Card";
  if (pm.transfer > 0) return "Transfer";
  return "Cash";
}

const OrderDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const { data: sale, isLoading } = useQuery({
    queryKey: ["sale-detail", id],
    queryFn: () => getSaleById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator color={colors.buttonPrimary} size="large" />
      </View>
    );
  }

  if (!sale) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={{ color: colors.textSecondary }}>Sale not found</Text>
      </View>
    );
  }

  const status = statusConfig[statusMap[sale.status] ?? "Pending"];
  const paymentMethod = getPaymentMethod(sale.payment_methods);
  const change = Math.max(0, sale.amount_paid - sale.total);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
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
              Paid via {paymentMethod} · {formatDate(sale.created_at)}
            </Text>
          </View>
        </View>

        {/* Order Info Card */}
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
            value={`#ORD-${sale.sale_number}`}
            valueWeight="700"
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
            label="Customer"
            value={sale.customer_name || "Walk-in Customer"}
            valueWeight="600"
            colors={colors}
            isDark={isDark}
          />
          {sale.customer_phone && (
            <>
              <View
                style={[
                  styles.cardDivider,
                  { backgroundColor: isDark ? "#22252a" : "#f0f2f5" },
                ]}
              />
              <InfoRow
                label="Phone"
                value={sale.customer_phone}
                colors={colors}
                isDark={isDark}
              />
            </>
          )}
        </View>

        {/* Items Ordered */}
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
          {sale.items.map((item, index) => (
            <View key={item.product_id + index}>
              {index > 0 && (
                <View
                  style={[
                    styles.cardDivider,
                    { backgroundColor: isDark ? "#22252a" : "#f0f2f5" },
                  ]}
                />
              )}
              <View style={styles.itemRow}>
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
                    {item.product_name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.itemDetails}>
                  <Text
                    style={[styles.itemName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.product_name}
                  </Text>
                  <Text
                    style={[
                      styles.itemUnitPrice,
                      { color: colors.textSecondary },
                    ]}
                  >
                    ₦{item.unit_price.toLocaleString()}
                  </Text>
                </View>

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
                    ×{item.qty}
                  </Text>
                </View>

                <Text style={[styles.itemLineTotal, { color: colors.text }]}>
                  ₦{(item.qty * item.unit_price).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? "#262930" : "#eef0f4",
              borderBottomEndRadius: 14,
              borderBottomStartRadius: 14,
            },
          ]}
        >
          <SummaryRow
            label="Subtotal"
            value={`₦${sale.subtotal.toLocaleString()}`}
            colors={colors}
          />
          {sale.tax > 0 && (
            <SummaryRow
              label="Tax"
              value={`₦${sale.tax.toLocaleString()}`}
              colors={colors}
            />
          )}
          {sale.discount > 0 && (
            <SummaryRow
              label="Discount"
              value={`-₦${sale.discount.toLocaleString()}`}
              colors={colors}
            />
          )}

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

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: "#10b981" }]}>
              ₦{sale.total.toLocaleString()}
            </Text>
          </View>

          {sale.amount_paid > 0 && (
            <>
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
                label="Amount Paid"
                value={`₦${sale.amount_paid.toLocaleString()}`}
                colors={colors}
              />
              {change > 0 && (
                <SummaryRow
                  label="Change"
                  value={`₦${change.toLocaleString()}`}
                  colors={colors}
                  highlight
                />
              )}
            </>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 16,
    gap: 6,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    // borderRadius: 14,
    borderTopEndRadius: 14,
    borderTopStartRadius: 14,
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
  card: {
    // borderRadius: 14,
    padding: 16,
    borderWidth: 1,
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    paddingHorizontal: 4,
    paddingTop: 14,
    paddingBottom: 4,
  },
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
});
