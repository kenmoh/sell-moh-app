import {
  createExpense,
  fetchExpensesPaged,
  fetchExpenseSummary,
  fetchFinancialDashboard,
  fetchPayablesPaged,
  fetchReceivablesPaged,
} from "@/api/accounting";
import AddExpenseSheet from "@/components/add-expense-sheet";
import AddPayableSheet from "@/components/add-payable-sheet";
import { Button } from "@/components/button";
import AddReceivableSheet from "@/components/add-receivable-sheet";
import MoveToStoreSheet from "@/components/move-to-store-sheet";
import PaymentHistorySheet from "@/components/payment-history-sheet";
import Pill from "@/components/pill";
import RecordPaymentSheet from "@/components/record-payment-sheet";
import StoreSwitcher from "@/components/store-switcher";
import { Colors, type ColorPalette } from "@/constants/theme";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import { useActiveStore } from "@/lib/store-context";
import type {
  ExpenseResponse,
  FinancialDashboardResponse,
  PayableResponse,
  ReceivableResponse,
} from "@/types/accounting";
import { getAccountingMenuIcon } from "@/types/accounting-menu-icon";
import MoreVert from "@expo/material-symbols/more_vert.xml";
import { Lucide } from "@react-native-vector-icons/lucide";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
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

type MoveTarget = {
  kind: "receivable" | "payable" | "expense";
  id: string;
  reference: string;
  storeId: string | null;
};

interface RowThemeProps {
  colors: ColorPalette;
  isDark: boolean;
}

const ReceivableRow = memo(function ReceivableRow({
  item,
  colors,
  isDark,
  onRecordPayment,
  onViewPayments,
  onMoveStore,
}: {
  item: ReceivableResponse;
  onRecordPayment: (item: ReceivableResponse) => void;
  onViewPayments: (item: ReceivableResponse) => void;
  onMoveStore: (target: MoveTarget) => void;
} & RowThemeProps) {
  return (
    <Pressable
      style={[
        styles.listCard,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? colors.backgroundElement : "#eef0f4",
        },
      ]}
      onPress={() => onRecordPayment(item)}
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
          <Text style={[styles.listCardSub, { color: colors.textSecondary }]}>
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
        <Pressable
          style={[
            styles.moveButton,
            { backgroundColor: colors.backgroundElement },
          ]}
          onPress={() =>
            onMoveStore({
              kind: "receivable",
              id: item.id,
              reference: item.invoice_number,
              storeId: item.store_id ?? null,
            })
          }
        >
          <Lucide name="store" size={13} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View
        style={[
          styles.listCardFooter,
          { borderTopColor: isDark ? colors.backgroundElement : "#e5e7eb" },
        ]}
      >
        <Text style={[styles.listCardAmount, { color: colors.text }]}>
          ₦{item.amount.toLocaleString()}
        </Text>
        <Text style={[styles.listCardBalance, { color: colors.textSecondary }]}>
          Balance: ₦{item.balance.toLocaleString()}
        </Text>
        {item.amount_paid > 0 && (
          <Pressable
            style={[
              styles.paymentsLink,
              { backgroundColor: colors.backgroundElement },
            ]}
            onPress={() => onViewPayments(item)}
          >
            <Lucide name="receipt" size={11} color={colors.textSecondary} />
            <Text
              style={[styles.paymentsLinkText, { color: colors.textSecondary }]}
            >
              {`Paid ₦${item.amount_paid.toLocaleString()}`}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
});

const PayableRow = memo(function PayableRow({
  item,
  colors,
  isDark,
  onRecordPayment,
  onViewPayments,
  onMoveStore,
}: {
  item: PayableResponse;
  onRecordPayment: (item: PayableResponse) => void;
  onViewPayments: (item: PayableResponse) => void;
  onMoveStore: (target: MoveTarget) => void;
} & RowThemeProps) {
  return (
    <Pressable
      style={[
        styles.listCard,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? colors.backgroundElement : "#eef0f4",
        },
      ]}
      onPress={() => onRecordPayment(item)}
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
          <Text style={[styles.listCardSub, { color: colors.textSecondary }]}>
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
        <Pressable
          style={[
            styles.moveButton,
            { backgroundColor: colors.backgroundElement },
          ]}
          onPress={() =>
            onMoveStore({
              kind: "payable",
              id: item.id,
              reference: item.bill_number,
              storeId: item.store_id ?? null,
            })
          }
        >
          <Lucide name="store" size={13} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View
        style={[
          styles.listCardFooter,
          { borderTopColor: isDark ? colors.backgroundElement : "#e5e7eb" },
        ]}
      >
        <Text style={[styles.listCardAmount, { color: colors.text }]}>
          ₦{item.amount.toLocaleString()}
        </Text>
        <Text style={[styles.listCardBalance, { color: colors.textSecondary }]}>
          Balance: ₦{item.balance.toLocaleString()}
        </Text>
        {item.amount_paid > 0 && (
          <Pressable
            style={[
              styles.paymentsLink,
              { backgroundColor: colors.backgroundElement },
            ]}
            onPress={() => onViewPayments(item)}
          >
            <Lucide name="receipt" size={11} color={colors.textSecondary} />
            <Text
              style={[styles.paymentsLinkText, { color: colors.textSecondary }]}
            >
              {`Paid ₦${item.amount_paid.toLocaleString()}`}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
});

const ExpenseRow = memo(function ExpenseRow({
  item,
  colors,
  isDark,
  onMoveStore,
}: {
  item: ExpenseResponse;
  onMoveStore: (target: MoveTarget) => void;
} & RowThemeProps) {
  return (
    <View
      style={[
        styles.listCard,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? colors.backgroundElement : "#eef0f4",
          borderTopColor: isDark ? colors.backgroundElement : "#e5e7eb",
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
          <Text style={[styles.listCardSub, { color: colors.textSecondary }]}>
            {item.description || "No description"}
          </Text>
        </View>
        <Text style={[styles.listCardAmount, { color: "#ef4444" }]}>
          ₦{item.amount.toLocaleString()}
        </Text>
      </View>
      <View
        style={[
          styles.listCardFooter,
          { borderTopColor: isDark ? colors.backgroundElement : "#e5e7eb" },
        ]}
      >
        <Text style={[styles.listCardSub, { color: colors.textSecondary }]}>
          {item.expense_date}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {item.vendor ? (
            <Text style={[styles.listCardSub, { color: colors.textSecondary }]}>
              {item.vendor}
            </Text>
          ) : null}
          <Pressable
            style={[
              styles.moveButton,
              { backgroundColor: colors.backgroundElement },
            ]}
            onPress={() =>
              onMoveStore({
                kind: "expense",
                id: item.id,
                reference: item.expense_number,
                storeId: item.store_id ?? null,
              })
            }
          >
            <Lucide name="store" size={13} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const AccountingLists = memo(function AccountingLists({
  activeTab,
  receivables,
  payables,
  expenses,
  receivableTotal,
  payableTotal,
  dashboard,
  expenseSummary,
  colors,
  isDark,
  isRefetching,
  onRefresh,
  onRecordPayment,
  onViewPayments,
  onMoveStore,
  onOpenAdd,
  onTabChange,
  onLoadMore,
  isLoadingMore,
  activeTabHasNextPage,
}: {
  activeTab: Tab;
  receivables: ReceivableResponse[];
  payables: PayableResponse[];
  expenses: ExpenseResponse[];
  receivableTotal: number;
  payableTotal: number;
  dashboard: FinancialDashboardResponse | undefined;
  expenseSummary: Record<string, number>;
  isRefetching: boolean;
  onRefresh: () => void;
  onRecordPayment: (
    item: { id: string; name: string; balance: number },
    type: "ar" | "ap",
  ) => void;
  onViewPayments: (
    item: { id: string; name: string; totalPaid: number },
    type: "ar" | "ap",
  ) => void;
  onMoveStore: (target: MoveTarget) => void;
  onOpenAdd: () => void;
  onTabChange: (tab: Tab) => void;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  activeTabHasNextPage: boolean;
} & RowThemeProps) {
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

  const recordPaymentAr = useCallback(
    (item: ReceivableResponse) =>
      onRecordPayment(
        { id: item.id, name: item.customer_name, balance: item.balance },
        "ar",
      ),
    [onRecordPayment],
  );

  const recordPaymentAp = useCallback(
    (item: PayableResponse) =>
      onRecordPayment(
        { id: item.id, name: item.vendor_name, balance: item.balance },
        "ap",
      ),
    [onRecordPayment],
  );

  const viewPaymentsAr = useCallback(
    (item: ReceivableResponse) =>
      onViewPayments(
        { id: item.id, name: item.customer_name, totalPaid: item.amount_paid },
        "ar",
      ),
    [onViewPayments],
  );

  const viewPaymentsAp = useCallback(
    (item: PayableResponse) =>
      onViewPayments(
        { id: item.id, name: item.vendor_name, totalPaid: item.amount_paid },
        "ap",
      ),
    [onViewPayments],
  );

  const renderItem = useCallback(
    ({
      item,
    }: {
      item: ReceivableResponse | PayableResponse | ExpenseResponse;
    }) => {
      if (activeTab === "receivables") {
        return (
          <ReceivableRow
            item={item as ReceivableResponse}
            colors={colors}
            isDark={isDark}
            onRecordPayment={recordPaymentAr}
            onViewPayments={viewPaymentsAr}
            onMoveStore={onMoveStore}
          />
        );
      }
      if (activeTab === "payables") {
        return (
          <PayableRow
            item={item as PayableResponse}
            colors={colors}
            isDark={isDark}
            onRecordPayment={recordPaymentAp}
            onViewPayments={viewPaymentsAp}
            onMoveStore={onMoveStore}
          />
        );
      }
      return (
        <ExpenseRow
          item={item as ExpenseResponse}
          colors={colors}
          isDark={isDark}
          onMoveStore={onMoveStore}
        />
      );
    },
    [
      activeTab,
      colors,
      isDark,
      recordPaymentAr,
      recordPaymentAp,
      viewPaymentsAr,
      viewPaymentsAp,
      onMoveStore,
    ],
  );

  const expenseSummaryEntries = Object.entries(expenseSummary).sort(
    (a, b) => b[1] - a[1],
  );
  const topExpenseCategories = expenseSummaryEntries.slice(0, 3);
  const totalExpenseSummary = expenseSummaryEntries.reduce(
    (sum, [, val]) => sum + val,
    0,
  );

  const listHeader = useMemo(
    () => (
      <View style={{ backgroundColor: colors.background }}>
        {/* Store Filter */}
        <View
          style={[
            styles.switcherRow,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              // paddingHorizontal: 16,
            },
          ]}
        >
          <Text style={{ color: colors.text }}>Financial Overview</Text>
          <StoreSwitcher mode="all" />
        </View>

        {/* Dashboard Metrics */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dashboardRow}
        >
          <View
            style={[
              styles.dashboardItem,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? colors.backgroundElement : "#eef0f4",
              },
            ]}
          >
            <View style={styles.dashboardItemTop}>
              <View
                style={[
                  styles.dashIcon,
                  { backgroundColor: "rgba(16,185,129,0.12)" },
                ]}
              >
                <Lucide name="wallet" size={14} color="#10b981" />
              </View>
              <Text style={[styles.dashLabel, { color: colors.textSecondary }]}>
                Cash
              </Text>
            </View>
            <Text style={[styles.dashValue, { color: colors.text }]}>
              ₦{dashboard?.cash_balance?.toLocaleString() ?? "0"}
            </Text>
          </View>
          <View
            style={[
              styles.dashboardItem,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? colors.backgroundElement : "#eef0f4",
              },
            ]}
          >
            <View style={styles.dashboardItemTop}>
              <View
                style={[
                  styles.dashIcon,
                  { backgroundColor: "rgba(59,130,246,0.12)" },
                ]}
              >
                <Lucide name="trending-up" size={14} color="#3b82f6" />
              </View>
              <Text style={[styles.dashLabel, { color: colors.textSecondary }]}>
                A/R
              </Text>
            </View>
            <Text style={[styles.dashValue, { color: "#3b82f6" }]}>
              ₦{dashboard?.outstanding_receivable?.toLocaleString() ?? "0"}
            </Text>
          </View>
          <View
            style={[
              styles.dashboardItem,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? colors.backgroundElement : "#eef0f4",
              },
            ]}
          >
            <View style={styles.dashboardItemTop}>
              <View
                style={[
                  styles.dashIcon,
                  { backgroundColor: "rgba(168,85,247,0.12)" },
                ]}
              >
                <Lucide name="trending-down" size={14} color="#a855f7" />
              </View>
              <Text style={[styles.dashLabel, { color: colors.textSecondary }]}>
                A/P
              </Text>
            </View>
            <Text style={[styles.dashValue, { color: "#a855f7" }]}>
              ₦{dashboard?.outstanding_payable?.toLocaleString() ?? "0"}
            </Text>
          </View>
        </ScrollView>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {tabs.map((tab) => (
            <Pill
              key={tab.key}
              label={tab.label}
              active={activeTab === tab.key}
              onPress={() => onTabChange(tab.key)}
              badge={
                tab.key === "receivables"
                  ? receivableTotal
                  : tab.key === "payables"
                    ? payableTotal
                    : undefined
              }
            />
          ))}
        </ScrollView>

        {/* Expense Summary (collapsible, only on expenses tab) */}
        {activeTab === "expenses" && topExpenseCategories.length > 0 && (
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? colors.backgroundElement : "#eef0f4",
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
          <Button
            fullWidth
            leftIcon={(color) => <Lucide name="plus" size={16} color={color} />}
            onPress={onOpenAdd}
            title={`Add ${
              activeTab === "receivables"
                ? "Receivable"
                : activeTab === "payables"
                  ? "Payable"
                  : "Expense"
            }`}
          />
        </View>
      </View>
    ),
    [
      colors,
      isDark,
      dashboard,
      activeTab,
      receivableTotal,
      payableTotal,
      topExpenseCategories,
      totalExpenseSummary,
      onOpenAdd,
      onTabChange,
    ],
  );

  return (
    <FlatList
      key={activeTab}
      data={currentList}
      keyExtractor={(item: any) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
      initialNumToRender={10}
      maxToRenderPerBatch={8}
      windowSize={9}
      removeClippedSubviews={Platform.OS === "android"}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={listHeader}
      renderItem={renderItem}
      ListFooterComponent={
        isLoadingMore ? (
          <ActivityIndicator
            color={colors.buttonPrimary}
            style={{ paddingVertical: 20 }}
          />
        ) : undefined
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
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
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {activeTab === "receivables"
              ? "Track amounts owed by customers"
              : activeTab === "payables"
                ? "Track amounts owed to vendors"
                : "Record your business expenses"}
          </Text>
        </View>
      }
    />
  );
});

const AccountingScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const queryClient = useQueryClient();
  const router = useRouter();

  const { activeStoreId, resolvedStoreId } = useActiveStore();

  const [activeTab, setActiveTab] = useState<Tab>("receivables");
  const [showAddReceivable, setShowAddReceivable] = useState(false);
  const [showAddPayable, setShowAddPayable] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    balance: number;
    type: "ar" | "ap";
  } | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [historyItem, setHistoryItem] = useState<{
    id: string;
    name: string;
    totalPaid: number;
    type: "ar" | "ap";
  } | null>(null);

  const {
    data: dashboard,
    isLoading: isLoadingDashboard,
    isError,
    error,
  } = useQuery({
    queryKey: ["financial-dashboard", activeStoreId],
    queryFn: () => fetchFinancialDashboard(activeStoreId),
  });

  useApiErrorToast({ isError, error, title: "Couldn't load accounting" });

  const AR_PAGE_SIZE = 20;
  const AP_PAGE_SIZE = 20;
  const EXPENSE_PAGE_SIZE = 20;

  const receivablesQuery = useInfiniteQuery({
    queryKey: ["receivables", "infinite", activeStoreId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchReceivablesPaged({
        page: pageParam,
        page_size: AR_PAGE_SIZE,
        store_id: activeStoreId ?? undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.page_size < lastPage.total
        ? lastPage.page + 1
        : undefined,
  });

  const payablesQuery = useInfiniteQuery({
    queryKey: ["payables", "infinite", activeStoreId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchPayablesPaged({
        page: pageParam,
        page_size: AP_PAGE_SIZE,
        store_id: activeStoreId ?? undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.page_size < lastPage.total
        ? lastPage.page + 1
        : undefined,
  });

  const expensesQuery = useInfiniteQuery({
    queryKey: ["expenses", "infinite", activeStoreId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchExpensesPaged({
        page: pageParam,
        page_size: EXPENSE_PAGE_SIZE,
        store_id: activeStoreId ?? undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.page_size < lastPage.total
        ? lastPage.page + 1
        : undefined,
  });

  const receivables = useMemo(
    () => receivablesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [receivablesQuery.data],
  );
  const payables = useMemo(
    () => payablesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [payablesQuery.data],
  );
  const expenses = useMemo(
    () => expensesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [expensesQuery.data],
  );

  const receivableTotal = receivablesQuery.data?.pages[0]?.total ?? 0;
  const payableTotal = payablesQuery.data?.pages[0]?.total ?? 0;

  const { data: expenseSummary = {} } = useQuery({
    queryKey: ["expense-summary", activeStoreId],
    queryFn: () =>
      fetchExpenseSummary({ store_id: activeStoreId ?? undefined }),
  });

  const isLoading =
    isLoadingDashboard ||
    receivablesQuery.isLoading ||
    payablesQuery.isLoading ||
    expensesQuery.isLoading;
  const isRefetching =
    receivablesQuery.isRefetching ||
    payablesQuery.isRefetching ||
    expensesQuery.isRefetching;
  const isLoadingMore =
    receivablesQuery.isFetchingNextPage ||
    payablesQuery.isFetchingNextPage ||
    expensesQuery.isFetchingNextPage;
  const { fetchNextPage: fetchNextAR } = receivablesQuery;
  const { fetchNextPage: fetchNextAP } = payablesQuery;
  const { fetchNextPage: fetchNextExpenses } = expensesQuery;
  const activeTabHasNextPage =
    activeTab === "receivables"
      ? receivablesQuery.hasNextPage
      : activeTab === "payables"
        ? payablesQuery.hasNextPage
        : expensesQuery.hasNextPage;

  const handleLoadMore = useCallback(() => {
    if (activeTabHasNextPage) {
      if (activeTab === "receivables") fetchNextAR();
      else if (activeTab === "payables") fetchNextAP();
      else fetchNextExpenses();
    }
  }, [
    activeTab,
    activeTabHasNextPage,
    fetchNextAR,
    fetchNextAP,
    fetchNextExpenses,
  ]);

  const { mutate: addExpense, isPending: isAddingExpense } = useMutation({
    mutationFn: (data: { category: string; amount: string; note: string }) =>
      createExpense({
        category: data.category,
        description: data.note || "",
        amount: parseFloat(data.amount),
        expense_date: new Date().toISOString().split("T")[0],
        store_id: resolvedStoreId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financial-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      setShowAddExpense(false);
    },
  });

  const handleRefresh = useCallback(() => {
    receivablesQuery.refetch();
    payablesQuery.refetch();
    expensesQuery.refetch();
  }, [receivablesQuery, payablesQuery, expensesQuery]);

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

  const handleViewPayments = useCallback(
    (
      item: { id: string; name: string; totalPaid: number },
      type: "ar" | "ap",
    ) => {
      setHistoryItem({ ...item, type });
      setShowPaymentHistory(true);
    },
    [],
  );

  const onOpenAdd = useCallback(() => {
    if (activeTab === "receivables") setShowAddReceivable(true);
    else if (activeTab === "payables") setShowAddPayable(true);
    else if (activeTab === "expenses") setShowAddExpense(true);
  }, [activeTab]);

  const menuItems = useMemo(
    () => [
      {
        key: "chart-of-accounts",
        label: "Chart of Accounts",
        onPress: () =>
          router.push("/(tabs)/(more)/accounting/chart-of-accounts"),
      },
      {
        key: "journals",
        label: "Journal Entries",
        onPress: () => router.push("/(tabs)/(more)/accounting/journals"),
      },
      {
        key: "trial-balance",
        label: "Trial Balance",
        onPress: () => router.push("/(tabs)/(more)/accounting/trial-balance"),
      },
      {
        key: "profit-loss",
        label: "Profit & Loss",
        onPress: () => router.push("/(tabs)/(more)/accounting/profit-and-loss"),
      },
      {
        key: "balance-sheet",
        label: "Balance Sheet",
        onPress: () => router.push("/(tabs)/(more)/accounting/balance-sheet"),
      },
      {
        key: "cash-flow",
        label: "Cash Flow",
        onPress: () => router.push("/(tabs)/(more)/accounting/cash-flow"),
      },
      {
        key: "compare-stores",
        label: "Compare Stores",
        onPress: () => router.push("/(tabs)/(more)/accounting/compare"),
      },
      {
        key: "taxes",
        label: "Taxes",
        onPress: () => router.push("/(tabs)/(more)/accounting/taxes"),
      },
    ],
    [router],
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* The statement screens live behind the native header menu, matching
          the notifications screen. */}
      <Stack.Toolbar placement="right" backgroundColor={colors.background}>
        <Stack.Toolbar.Menu
          icon={process.env.EXPO_OS === "ios" ? "ellipsis.circle" : MoreVert}
        >
          {menuItems.map((item) => (
            <Stack.Toolbar.MenuAction
              key={item.key}
              icon={getAccountingMenuIcon(item.key)}
              onPress={item.onPress}
            >
              {item.label}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <AccountingLists
        activeTab={activeTab}
        receivables={receivables}
        payables={payables}
        expenses={expenses}
        receivableTotal={receivableTotal}
        payableTotal={payableTotal}
        dashboard={dashboard}
        expenseSummary={expenseSummary}
        colors={colors}
        isDark={isDark}
        isRefetching={isRefetching}
        onRefresh={handleRefresh}
        onRecordPayment={handleRecordPayment}
        onViewPayments={handleViewPayments}
        onMoveStore={setMoveTarget}
        onOpenAdd={onOpenAdd}
        onTabChange={setActiveTab}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
        activeTabHasNextPage={activeTabHasNextPage}
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

      {historyItem && (
        <PaymentHistorySheet
          visible={showPaymentHistory}
          onVisibleChange={setShowPaymentHistory}
          type={historyItem.type}
          itemId={historyItem.id}
          itemName={historyItem.name}
          totalPaid={historyItem.totalPaid}
        />
      )}

      {moveTarget && (
        <MoveToStoreSheet
          visible={!!moveTarget}
          onVisibleChange={(visible) => {
            if (!visible) setMoveTarget(null);
          }}
          kind={moveTarget.kind}
          recordId={moveTarget.id}
          reference={moveTarget.reference}
          currentStoreId={moveTarget.storeId}
        />
      )}
    </View>
  );
};

export default AccountingScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  switcherRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 12,
  },
  dashboardRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  dashboardItem: {
    flexShrink: 0,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dashboardItemTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  dashIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dashLabel: { fontSize: 11, fontWeight: "600" },
  dashValue: { fontSize: 15, fontWeight: "800" },
  tabRow: {
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
  },
  paymentsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentsLinkText: { fontSize: 11, fontWeight: "600" },
  listCardBalance: { fontSize: 12, fontWeight: "500" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  moveButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
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
