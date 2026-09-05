import {
  fetchDashboard,
  fetchInventoryAlerts,
  fetchPaymentMethods,
  fetchProfitLoss,
} from "@/api/reports";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const REPORT_DAYS = 30;

const ReportsScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const today = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - REPORT_DAYS);
    return d.toISOString().split("T")[0];
  }, []);

  const toDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const {
    data: dashboard,
    isLoading: isLoadingDash,
    refetch: refetchDash,
  } = useQuery({
    queryKey: ["reports-dashboard"],
    queryFn: () => fetchDashboard(REPORT_DAYS),
  });

  const {
    data: paymentBreakdown,
    isLoading: isLoadingPay,
    refetch: refetchPay,
  } = useQuery({
    queryKey: ["reports-payment-methods"],
    queryFn: () => fetchPaymentMethods(today, toDate),
  });

  const {
    data: plResult,
    isLoading: isLoadingPL,
    refetch: refetchPL,
  } = useQuery({
    queryKey: ["reports-profit-loss"],
    queryFn: () => fetchProfitLoss(today, toDate),
  });

  const {
    data: inventoryAlerts,
    isLoading: isLoadingInv,
    refetch: refetchInv,
  } = useQuery({
    queryKey: ["reports-inventory-alerts"],
    queryFn: fetchInventoryAlerts,
  });

  const isLoading =
    isLoadingDash ||
    isLoadingPay ||
    isLoadingPL ||
    isLoadingInv;

  const handleRefresh = () => {
    refetchDash();
    refetchPay();
    refetchPL();
    refetchInv();
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Reports
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              Last {REPORT_DAYS} days
            </Text>
          </View>
        </View>

        {/* Dashboard Stats */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#282b32" : "#eef0f4",
              },
            ]}
          >
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "rgba(16,185,129,0.12)" },
              ]}
            >
              <Lucide name="dollar-sign" size={14} color="#10b981" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Revenue
            </Text>
            <Text style={[styles.statValue, { color: "#10b981" }]}>
              ₦{dashboard?.revenue?.current?.toLocaleString() ?? "0"}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#282b32" : "#eef0f4",
              },
            ]}
          >
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "rgba(59,130,246,0.12)" },
              ]}
            >
              <Lucide name="shopping-bag" size={14} color="#3b82f6" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Sales
            </Text>
            <Text style={[styles.statValue, { color: "#3b82f6" }]}>
              {dashboard?.sales_count?.current ?? 0}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#282b32" : "#eef0f4",
              },
            ]}
          >
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "rgba(168,85,247,0.12)" },
              ]}
            >
              <Lucide name="trending-up" size={14} color="#a855f7" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Avg Order
            </Text>
            <Text style={[styles.statValue, { color: "#a855f7" }]}>
              ₦{dashboard?.avg_order_value?.current?.toLocaleString() ?? "0"}
            </Text>
          </View>
        </View>

        {/* Payment Breakdown */}
        {paymentBreakdown && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Payment Breakdown
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#282b32" : "#eef0f4",
                },
              ]}
            >
              {[
                {
                  label: "Cash",
                  amount: paymentBreakdown.cash,
                  color: "#10b981",
                  bg: "rgba(16,185,129,0.12)",
                },
                {
                  label: "Card",
                  amount: paymentBreakdown.card,
                  color: "#3b82f6",
                  bg: "rgba(59,130,246,0.12)",
                },
                {
                  label: "Transfer",
                  amount: paymentBreakdown.transfer,
                  color: "#a855f7",
                  bg: "rgba(168,85,247,0.12)",
                },
              ].map((item) => {
                const pct =
                  paymentBreakdown.total > 0
                    ? (item.amount / paymentBreakdown.total) * 100
                    : 0;
                return (
                  <View key={item.label} style={styles.payItem}>
                    <View style={styles.payItemHeader}>
                      <View
                        style={[styles.payDot, { backgroundColor: item.color }]}
                      />
                      <Text style={[styles.payLabel, { color: colors.text }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.payAmount, { color: item.color }]}>
                        ₦{item.amount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={[styles.payBar, { backgroundColor: item.bg }]}>
                      <View
                        style={[
                          styles.payBarFill,
                          {
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: item.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Top Product */}
        {dashboard?.top_product && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Top Product
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#282b32" : "#eef0f4",
                },
              ]}
            >
              <View style={styles.productItem}>
                <View
                  style={[
                    styles.rankBadge,
                    { backgroundColor: "rgba(245,158,11,0.12)" },
                  ]}
                >
                  <Text style={[styles.rankText, { color: "#f59e0b" }]}>#1</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]}>
                    {dashboard.top_product.product_name}
                  </Text>
                  <Text
                    style={[styles.productQty, { color: colors.textSecondary }]}
                  >
                    {dashboard.top_product.total_qty} sold
                  </Text>
                </View>
                <Text style={[styles.productRevenue, { color: "#10b981" }]}>
                  ₦{dashboard.top_product.total_revenue.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Profit & Loss */}
        {plResult && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Profit & Loss
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#282b32" : "#eef0f4",
                },
              ]}
            >
              <View style={styles.plRow}>
                <Text style={[styles.plLabel, { color: colors.textSecondary }]}>
                  Revenue
                </Text>
                <Text style={[styles.plValue, { color: "#10b981" }]}>
                  ₦{plResult.revenue.toLocaleString()}
                </Text>
              </View>
              <View style={styles.plRow}>
                <Text style={[styles.plLabel, { color: colors.textSecondary }]}>
                  Cost of Goods
                </Text>
                <Text style={[styles.plValue, { color: "#ef4444" }]}>
                  ₦{plResult.cost_of_goods.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.plRow, styles.plDivider]}>
                <Text style={[styles.plLabelBold, { color: colors.text }]}>
                  Gross Profit
                </Text>
                <Text style={[styles.plValueBold, { color: colors.text }]}>
                  ₦{plResult.gross_profit.toLocaleString()}
                </Text>
              </View>
              <View style={styles.plRow}>
                <Text style={[styles.plLabel, { color: colors.textSecondary }]}>
                  Expenses
                </Text>
                <Text style={[styles.plValue, { color: "#ef4444" }]}>
                  ₦{plResult.expenses.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.plRow, styles.plDivider]}>
                <Text style={[styles.plLabelBold, { color: colors.text }]}>
                  Net Profit
                </Text>
                <Text
                  style={[
                    styles.plValueBold,
                    { color: plResult.net_profit >= 0 ? "#10b981" : "#ef4444" },
                  ]}
                >
                  ₦{plResult.net_profit.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Inventory Alerts */}
        {inventoryAlerts && inventoryAlerts.items.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Inventory Alerts
            </Text>
            <View style={styles.alertsRow}>
              <View
                style={[
                  styles.alertStat,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? "#282b32" : "#eef0f4",
                  },
                ]}
              >
                <Text style={[styles.alertStatValue, { color: "#f59e0b" }]}>
                  {inventoryAlerts.summary.low_stock}
                </Text>
                <Text
                  style={[
                    styles.alertStatLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Low Stock
                </Text>
              </View>
              <View
                style={[
                  styles.alertStat,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? "#282b32" : "#eef0f4",
                  },
                ]}
              >
                <Text style={[styles.alertStatValue, { color: "#ef4444" }]}>
                  {inventoryAlerts.summary.out_of_stock}
                </Text>
                <Text
                  style={[
                    styles.alertStatLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Out of Stock
                </Text>
              </View>
            </View>
            {inventoryAlerts.items.slice(0, 5).map((item) => (
              <View
                key={item.product_id}
                style={[
                  styles.alertItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? "#282b32" : "#eef0f4",
                  },
                ]}
              >
                <View
                  style={[
                    styles.alertIcon,
                    {
                      backgroundColor:
                        item.status === "out_of_stock"
                          ? "rgba(239,68,68,0.12)"
                          : "rgba(245,158,11,0.12)",
                    },
                  ]}
                >
                  <Lucide
                    name="alert-triangle"
                    size={14}
                    color={
                      item.status === "out_of_stock" ? "#ef4444" : "#f59e0b"
                    }
                  />
                </View>
                <View style={styles.alertInfo}>
                  <Text style={[styles.alertName, { color: colors.text }]}>
                    {item.product_name}
                  </Text>
                  <Text
                    style={[styles.alertQty, { color: colors.textSecondary }]}
                  >
                    {item.qty} / {item.min_stock_level} min
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReportsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 4,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statLabel: { fontSize: 11, fontWeight: "600" },
  statValue: { fontSize: 16, fontWeight: "800" },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  payItem: { marginBottom: 12 },
  payItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  payDot: { width: 8, height: 8, borderRadius: 4 },
  payLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  payAmount: { fontSize: 14, fontWeight: "800" },
  payBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  payBarFill: { height: "100%", borderRadius: 3 },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 12, fontWeight: "800" },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "600" },
  productQty: { fontSize: 12, marginTop: 2 },
  productRevenue: { fontSize: 14, fontWeight: "800" },
  plRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  plDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  plLabel: { fontSize: 14 },
  plLabelBold: { fontSize: 15, fontWeight: "700" },
  plValue: { fontSize: 14, fontWeight: "700" },
  plValueBold: { fontSize: 15, fontWeight: "800" },
  alertsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  alertStat: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  alertStatValue: { fontSize: 20, fontWeight: "800" },
  alertStatLabel: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  alertInfo: { flex: 1 },
  alertName: { fontSize: 14, fontWeight: "600" },
  alertQty: { fontSize: 12, marginTop: 2 },
});
