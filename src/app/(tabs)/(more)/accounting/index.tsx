import {
  createExpense,
  fetchExpenses,
  fetchExpenseSummary,
  fetchFinancialDashboard,
  fetchPayables,
  fetchReceivables,
} from "@/api/accounting";
import AccountingContextMenu from "@/components/accounting-context-menu";
import AddExpenseSheet from "@/components/add-expense-sheet";
import AddPayableSheet from "@/components/add-payable-sheet";
import AddReceivableSheet from "@/components/add-receivable-sheet";
import Pill from "@/components/pill";
import RecordPaymentSheet from "@/components/record-payment-sheet";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "receivables" | "payables" | "expenses";
const tabs: { key: Tab; label: string }[] = [
  { key: "receivables", label: "Receivables" },
  { key: "payables", label: "Payables" },
  { key: "expenses", label: "Expenses" },
];

const AccountingScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const queryClient = useQueryClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("receivables");
  const [showAddReceivable, setShowAddReceivable] = useState(false);
  const [showAddPayable, setShowAddPayable] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    balance: number;
    type: "ar" | "ap";
  } | null>(null);

  const { data: dashboard, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["financial-dashboard"],
    queryFn: fetchFinancialDashboard,
  });

  const {
    data: receivables = [],
    isLoading: isLoadingAR,
    isRefetching: isRefetchingAR,
    refetch: refetchAR,
  } = useQuery({
    queryKey: ["receivables"],
    queryFn: () => fetchReceivables(),
  });

  const {
    data: payables = [],
    isLoading: isLoadingAP,
    isRefetching: isRefetchingAP,
    refetch: refetchAP,
  } = useQuery({
    queryKey: ["payables"],
    queryFn: () => fetchPayables(),
  });

  const {
    data: expenses = [],
    isLoading: isLoadingExpenses,
    isRefetching: isRefetchingExpenses,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => fetchExpenses(),
  });

  const {
    data: expenseSummary = {},
    isLoading: isLoadingSummary,
  } = useQuery({
    queryKey: ["expense-summary"],
    queryFn: () => fetchExpenseSummary(),
  });

  const isLoading =
    isLoadingDashboard || isLoadingAR || isLoadingAP || isLoadingExpenses;
  const isRefetching = isRefetchingAR || isRefetchingAP || isRefetchingExpenses;

  const { mutate: addExpense, isPending: isAddingExpense } = useMutation({
    mutationFn: (data: { category: string; amount: string; note: string }) =>
      createExpense({
        category: data.category,
        description: data.note || "",
        amount: parseFloat(data.amount),
        expense_date: new Date().toISOString().split("T")[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financial-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      setShowAddExpense(false);
    },
  });

  const handleRefresh = useCallback(() => {
    refetchAR();
    refetchAP();
    refetchExpenses();
  }, [refetchAR, refetchAP, refetchExpenses]);

  const handleRecordPayment = useCallback(
    (
      item: { id: string; name: string; balance: number },
      type: "ar" | "ap",
    ) => {
      setSelectedItem({ ...item, type });
      setShowRecordPayment(true);
    },
    [],
  );

  const currentList = useMemo(() => {
    switch (activeTab) {
      case "receivables":
        return receivables;
      case "payables":
        return payables;
      case "expenses":
        return expenses;
    }
  }, [activeTab, receivables, payables, expenses]);

  const menuItems = useMemo(
    () => [
      {
        key: "chart-of-accounts",
        label: "Chart of Accounts",
        icon: "book-open",
        onPress: () => router.push("/(tabs)/(more)/accounting/chart-of-accounts"),
      },
      {
        key: "journals",
        label: "Journal Entries",
        icon: "file-text",
        onPress: () => router.push("/(tabs)/(more)/accounting/journals"),
      },
      {
        key: "trial-balance",
        label: "Trial Balance",
        icon: "scale",
        onPress: () => router.push("/(tabs)/(more)/accounting/trial-balance"),
      },
      {
        key: "profit-loss",
        label: "Profit & Loss",
        icon: "trending-up",
        onPress: () => router.push("/(tabs)/(more)/accounting/profit-and-loss"),
      },
      {
        key: "balance-sheet",
        label: "Balance Sheet",
        icon: "landmark",
        onPress: () => router.push("/(tabs)/(more)/accounting/balance-sheet"),
      },
      {
        key: "cash-flow",
        label: "Cash Flow",
        icon: "banknote",
        onPress: () => router.push("/(tabs)/(more)/accounting/cash-flow"),
      },
    ],
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (activeTab === "receivables") {
        return (
          <Pressable
            style={[
              styles.listCard,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#282b32" : "#eef0f4",
              },
            ]}
            onPress={() =>
              handleRecordPayment(
                {
                  id: item.id,
                  name: item.customer_name,
                  balance: item.balance,
                },
                "ar",
              )
            }
          >
            <View style={styles.listCardHeader}>
              <View
                style={[
                  styles.listCardIcon,
                  { backgroundColor: "rgba(59,130,246,0.12)" },
                ]}
              >
                <Lucide name="user" size={16} color="#3b82f6" />
              </View>
              <View style={styles.listCardInfo}>
                <Text style={[styles.listCardTitle, { color: colors.text }]}>
                  {item.customer_name}
                </Text>
                <Text
                  style={[styles.listCardSub, { color: colors.textSecondary }]}
                >
                  {item.invoice_number}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === "pending"
                        ? "rgba(245,158,11,0.12)"
                        : item.status === "paid"
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(59,130,246,0.12)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        item.status === "pending"
                          ? "#f59e0b"
                          : item.status === "paid"
                            ? "#10b981"
                            : "#3b82f6",
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <View style={styles.listCardFooter}>
              <Text style={[styles.listCardAmount, { color: colors.text }]}>
                ₦{item.amount.toLocaleString()}
              </Text>
              <Text
                style={[
                  styles.listCardBalance,
                  { color: colors.textSecondary },
                ]}
              >
                Balance: ₦{item.balance.toLocaleString()}
              </Text>
            </View>
          </Pressable>
        );
      }

      if (activeTab === "payables") {
        return (
          <Pressable
            style={[
              styles.listCard,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#282b32" : "#eef0f4",
              },
            ]}
            onPress={() =>
              handleRecordPayment(
                { id: item.id, name: item.vendor_name, balance: item.balance },
                "ap",
              )
            }
          >
            <View style={styles.listCardHeader}>
              <View
                style={[
                  styles.listCardIcon,
                  { backgroundColor: "rgba(168,85,247,0.12)" },
                ]}
              >
                <Lucide name="building-2" size={16} color="#a855f7" />
              </View>
              <View style={styles.listCardInfo}>
                <Text style={[styles.listCardTitle, { color: colors.text }]}>
                  {item.vendor_name}
                </Text>
                <Text
                  style={[styles.listCardSub, { color: colors.textSecondary }]}
                >
                  {item.bill_number}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === "pending"
                        ? "rgba(245,158,11,0.12)"
                        : item.status === "paid"
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(59,130,246,0.12)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        item.status === "pending"
                          ? "#f59e0b"
                          : item.status === "paid"
                            ? "#10b981"
                            : "#3b82f6",
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <View style={styles.listCardFooter}>
              <Text style={[styles.listCardAmount, { color: colors.text }]}>
                ₦{item.amount.toLocaleString()}
              </Text>
              <Text
                style={[
                  styles.listCardBalance,
                  { color: colors.textSecondary },
                ]}
              >
                Balance: ₦{item.balance.toLocaleString()}
              </Text>
            </View>
          </Pressable>
        );
      }

      return (
        <View
          style={[
            styles.listCard,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? "#282b32" : "#eef0f4",
            },
          ]}
        >
          <View style={styles.listCardHeader}>
            <View
              style={[
                styles.listCardIcon,
                { backgroundColor: "rgba(239,68,68,0.12)" },
              ]}
            >
              <Lucide name="receipt" size={16} color="#ef4444" />
            </View>
            <View style={styles.listCardInfo}>
              <Text style={[styles.listCardTitle, { color: colors.text }]}>
                {item.category}
              </Text>
              <Text
                style={[styles.listCardSub, { color: colors.textSecondary }]}
              >
                {item.description || "No description"}
              </Text>
            </View>
            <Text style={[styles.listCardAmount, { color: "#ef4444" }]}>
              ₦{item.amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.listCardFooter}>
            <Text style={[styles.listCardSub, { color: colors.textSecondary }]}>
              {item.expense_date}
            </Text>
            {item.vendor ? (
              <Text
                style={[styles.listCardSub, { color: colors.textSecondary }]}
              >
                {item.vendor}
              </Text>
            ) : null}
          </View>
        </View>
      );
    },
    [activeTab, colors, isDark, handleRecordPayment],
  );

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

  const expenseSummaryEntries = Object.entries(expenseSummary).sort(
    (a, b) => b[1] - a[1],
  );
  const topExpenseCategories = expenseSummaryEntries.slice(0, 3);
  const totalExpenseSummary = expenseSummaryEntries.reduce(
    (sum, [, val]) => sum + val,
    0,
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <FlatList
        data={currentList}
        keyExtractor={(item: any) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View style={styles.headerTitleRow}>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Accounting
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Financial overview
                </Text>
              </View>
              <AccountingContextMenu items={menuItems} />
            </View>

            {/* Dashboard Card */}
            <View
              style={[
                styles.dashboardCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#282b32" : "#eef0f4",
                },
              ]}
            >
              <View style={styles.dashboardRow}>
                <View style={styles.dashboardItem}>
                  <View
                    style={[
                      styles.dashIcon,
                      { backgroundColor: "rgba(16,185,129,0.12)" },
                    ]}
                  >
                    <Lucide name="wallet" size={14} color="#10b981" />
                  </View>
                  <Text
                    style={[styles.dashLabel, { color: colors.textSecondary }]}
                  >
                    Cash
                  </Text>
                  <Text style={[styles.dashValue, { color: colors.text }]}>
                    ₦{dashboard?.cash_balance?.toLocaleString() ?? "0"}
                  </Text>
                </View>
                <View style={styles.dashboardItem}>
                  <View
                    style={[
                      styles.dashIcon,
                      { backgroundColor: "rgba(59,130,246,0.12)" },
                    ]}
                  >
                    <Lucide name="trending-up" size={14} color="#3b82f6" />
                  </View>
                  <Text
                    style={[styles.dashLabel, { color: colors.textSecondary }]}
                  >
                    A/R
                  </Text>
                  <Text style={[styles.dashValue, { color: "#3b82f6" }]}>
                    ₦
                    {dashboard?.outstanding_receivable?.toLocaleString() ?? "0"}
                  </Text>
                </View>
                <View style={styles.dashboardItem}>
                  <View
                    style={[
                      styles.dashIcon,
                      { backgroundColor: "rgba(168,85,247,0.12)" },
                    ]}
                  >
                    <Lucide name="trending-down" size={14} color="#a855f7" />
                  </View>
                  <Text
                    style={[styles.dashLabel, { color: colors.textSecondary }]}
                  >
                    A/P
                  </Text>
                  <Text style={[styles.dashValue, { color: "#a855f7" }]}>
                    ₦{dashboard?.outstanding_payable?.toLocaleString() ?? "0"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              {tabs.map((tab) => (
                <Pill
                  key={tab.key}
                  label={tab.label}
                  active={activeTab === tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  badge={
                    tab.key === "receivables"
                      ? receivables.length
                      : tab.key === "payables"
                        ? payables.length
                        : undefined
                  }
                />
              ))}
            </View>

            {/* Expense Summary (collapsible, only on expenses tab) */}
            {activeTab === "expenses" && topExpenseCategories.length > 0 && (
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? "#282b32" : "#eef0f4",
                  },
                ]}
              >
                <View style={styles.summaryHeader}>
                  <View style={styles.summaryHeaderLeft}>
                    <View
                      style={[
                        styles.summaryIcon,
                        { backgroundColor: "rgba(239,68,68,0.12)" },
                      ]}
                    >
                      <Lucide name="pie-chart" size={14} color="#ef4444" />
                    </View>
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>
                      Expense Summary
                    </Text>
                  </View>
                  <Text style={[styles.summaryTotal, { color: "#ef4444" }]}>
                    ₦{totalExpenseSummary.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryItems}>
                  {topExpenseCategories.map(([category, amount]) => (
                    <View key={category} style={styles.summaryItem}>
                      <Text
                        style={[
                          styles.summaryItemLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {category}
                      </Text>
                      <Text
                        style={[styles.summaryItemAmount, { color: colors.text }]}
                      >
                        ₦{amount.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Add Button */}
            <View style={styles.addSection}>
              <Pressable
                style={[
                  styles.addBtn,
                  { backgroundColor: colors.buttonPrimary },
                ]}
                onPress={() => {
                  if (activeTab === "receivables") setShowAddReceivable(true);
                  else if (activeTab === "payables") setShowAddPayable(true);
                  else if (activeTab === "expenses") setShowAddExpense(true);
                }}
              >
                <Lucide name="plus" size={16} color="#fff" />
                <Text style={styles.addBtnText}>
                  Add{" "}
                  {activeTab === "receivables"
                    ? "Receivable"
                    : activeTab === "payables"
                      ? "Payable"
                      : "Expense"}
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconBadge,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Lucide name="inbox" size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No{" "}
              {activeTab === "receivables"
                ? "Receivables"
                : activeTab === "payables"
                  ? "Payables"
                  : "Expenses"}{" "}
              Found
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              {activeTab === "receivables"
                ? "Track amounts owed by customers"
                : activeTab === "payables"
                  ? "Track amounts owed to vendors"
                  : "Record your business expenses"}
            </Text>
          </View>
        }
      />

      <AddReceivableSheet
        visible={showAddReceivable}
        onVisibleChange={setShowAddReceivable}
      />
      <AddPayableSheet
        visible={showAddPayable}
        onVisibleChange={setShowAddPayable}
      />
      <AddExpenseSheet
        visible={showAddExpense}
        onVisibleChange={setShowAddExpense}
        onAdd={addExpense}
        isPending={isAddingExpense}
      />
      {selectedItem && (
        <RecordPaymentSheet
          visible={showRecordPayment}
          onVisibleChange={setShowRecordPayment}
          type={selectedItem.type}
          itemId={selectedItem.id}
          itemName={selectedItem.name}
          balance={selectedItem.balance}
        />
      )}
    </SafeAreaView>
  );
};

export default AccountingScreen;

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
  dashboardCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dashboardRow: {
    flexDirection: "row",
    gap: 10,
  },
  dashboardItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  dashIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dashLabel: { fontSize: 11, fontWeight: "600" },
  dashValue: { fontSize: 15, fontWeight: "800" },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: { fontSize: 14, fontWeight: "700" },
  summaryTotal: { fontSize: 14, fontWeight: "800" },
  summaryItems: { gap: 6 },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryItemLabel: { fontSize: 13 },
  summaryItemAmount: { fontSize: 13, fontWeight: "600" },
  addSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 50,
    paddingVertical: 12,
  },
  addBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  listCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  listCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  listCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  listCardInfo: { flex: 1 },
  listCardTitle: { fontSize: 15, fontWeight: "700" },
  listCardSub: { fontSize: 12, marginTop: 2 },
  listCardAmount: { fontSize: 15, fontWeight: "800" },
  listCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  listCardBalance: { fontSize: 12, fontWeight: "500" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: "center", marginBottom: 18 },
});
