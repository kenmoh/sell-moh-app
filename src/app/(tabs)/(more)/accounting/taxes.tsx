import {
  fetchTaxesCollected,
  fetchTaxesOwed,
  remitTax,
} from "@/api/accounting";
import RemitTaxSheet from "@/components/accounting/remit-tax-sheet";
import StoreSwitcher from "@/components/store-switcher";
import { Colors } from "@/constants/theme";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import { useActiveStore } from "@/lib/store-context";
import type {
  TaxCollectedItem,
  TaxCollectedLine,
  TaxRemitRequest,
} from "@/types/accounting";
import Add from "@expo/material-symbols/add.xml";
import History from "@expo/material-symbols/history.xml";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { Lucide } from "@react-native-vector-icons/lucide";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { Fragment, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const TAXES_PAGE_SIZE = 20;

const TaxesScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const { activeStoreId } = useActiveStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showRemitSheet, setShowRemitSheet] = useState(false);

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const from = fromDate.toISOString().split("T")[0];
  const to = toDate.toISOString().split("T")[0];

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["taxes-collected", "infinite", from, to, activeStoreId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchTaxesCollected({
        fromDate: from,
        toDate: to,
        storeId: activeStoreId,
        page: pageParam,
        pageSize: TAXES_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.page + 1 : undefined,
  });

  const {
    data: owedLines = [],
    isError: isOwedError,
    error: owedError,
  } = useQuery({
    queryKey: ["taxes-owed"],
    queryFn: fetchTaxesOwed,
  });

  useApiErrorToast({
    isError: isOwedError,
    error: owedError,
    title: "Couldn't load tax balances",
  });

  const {
    mutate: submitRemittance,
    isPending: isRemitting,
    isError: isRemitError,
    error: remitError,
  } = useMutation({
    mutationFn: (payload: TaxRemitRequest) => remitTax(payload),
    onSuccess: async () => {
      setShowRemitSheet(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["taxes-owed"] }),
        queryClient.invalidateQueries({ queryKey: ["taxes-collected"] }),
        queryClient.invalidateQueries({ queryKey: ["journals"] }),
        queryClient.invalidateQueries({ queryKey: ["financial-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["balance-sheet"] }),
      ]);
    },
  });

  useApiErrorToast({
    isError: isRemitError,
    error: remitError,
    title: "Remittance failed",
  });

  const summary = data?.pages[0];

  const taxes: TaxCollectedItem[] = useMemo(
    () => summary?.taxes ?? [],
    [summary],
  );

  const lines: TaxCollectedLine[] = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const renderSummaryCard = useCallback(
    (tax: TaxCollectedItem) => (
      <View
        key={`${tax.name}-${tax.rate}`}
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? "#262930" : "#eef0f4",
          },
        ]}
      >
        <View style={[styles.summaryIcon, { backgroundColor: "#8b5cf615" }]}>
          <Lucide name="percent" size={16} color="#8b5cf6" />
        </View>
        <View style={styles.summaryLeft}>
          <Text style={[styles.summaryName, { color: colors.text }]}>
            {tax.name} · {tax.rate}%
          </Text>
          <Text style={[styles.summaryCount, { color: colors.textSecondary }]}>
            {tax.sale_count} {tax.sale_count === 1 ? "sale" : "sales"}
          </Text>
        </View>
        <Text style={[styles.summaryAmount, { color: "#10b981" }]}>
          ₦{tax.amount.toLocaleString()}
        </Text>
      </View>
    ),
    [colors, isDark],
  );

  const renderLine = useCallback(
    (line: TaxCollectedLine, idx: number) => (
      <Fragment key={`${line.sale_id}-${line.name}-${line.rate}`}>
        {idx > 0 && (
          <View
            style={[
              styles.lineSeparator,
              { backgroundColor: isDark ? "#282b32" : "#e5e7eb" },
            ]}
          />
        )}
        <View style={styles.lineItem}>
          <View style={styles.lineLeft}>
            <Text
              style={[styles.lineSaleNumber, { color: colors.text }]}
              numberOfLines={1}
            >
              {line.sale_number}
            </Text>
            <Text style={[styles.lineMeta, { color: colors.textSecondary }]}>
              {line.name} · {line.rate}% ·{" "}
              {line.date ? formatDate(new Date(line.date)) : "—"}
            </Text>
          </View>
          <Text style={[styles.lineAmount, { color: "#10b981" }]}>
            ₦{line.amount.toLocaleString()}
          </Text>
        </View>
      </Fragment>
    ),
    [colors, isDark],
  );

  const ListHeader = (
    <>
      <View style={styles.switcherRow}>
        <StoreSwitcher mode="all" />
      </View>

      <View style={styles.dateRow}>
        <View style={styles.dateCol}>
          <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
            From
          </Text>
          <Pressable
            onPress={() => setShowFromPicker(true)}
            style={({ pressed }) => [
              styles.datePill,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#262930" : "#eef0f4",
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Lucide name="calendar" size={14} color={colors.text} />
            <Text style={[styles.datePillText, { color: colors.text }]}>
              {formatDate(fromDate)}
            </Text>
            <Lucide
              name="chevron-down"
              size={14}
              color={colors.textSecondary}
            />
          </Pressable>
          {showFromPicker && (
            <DateTimePicker
              value={fromDate}
              mode="date"
              display="compact"
              presentation="dialog"
              onValueChange={(_, d) => {
                setShowFromPicker(false);
                if (d) setFromDate(d);
              }}
              onDismiss={() => setShowFromPicker(false)}
            />
          )}
        </View>
        <View style={styles.dateCol}>
          <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
            To
          </Text>
          <Pressable
            onPress={() => setShowToPicker(true)}
            style={({ pressed }) => [
              styles.datePill,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#262930" : "#eef0f4",
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Lucide name="calendar" size={14} color={colors.text} />
            <Text style={[styles.datePillText, { color: colors.text }]}>
              {formatDate(toDate)}
            </Text>
            <Lucide
              name="chevron-down"
              size={14}
              color={colors.textSecondary}
            />
          </Pressable>
          {showToPicker && (
            <DateTimePicker
              value={toDate}
              mode="date"
              display="compact"
              presentation="dialog"
              onValueChange={(_, d) => {
                setShowToPicker(false);
                if (d) setToDate(d);
              }}
              onDismiss={() => setShowToPicker(false)}
            />
          )}
        </View>
      </View>

      <View>
        <View
          style={[
            styles.totalCard,
            {
              backgroundColor: "rgba(16,185,129,0.1)",
              borderColor: "#10b981",
            },
          ]}
        >
          <Text style={[styles.totalLabel, { color: colors.text }]}>
            Total Taxes Collected
          </Text>
          <Text style={[styles.totalValue, { color: "#10b981" }]}>
            ₦{(summary?.total_collected ?? 0).toLocaleString()}
          </Text>
        </View>

        {taxes.length > 0 && (
          <View style={styles.summaryList}>{taxes.map(renderSummaryCard)}</View>
        )}

        {lines.length > 0 && (
          <Text style={[styles.linesTitle, { color: colors.textSecondary }]}>
            Collected from sales
          </Text>
        )}
      </View>
    </>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      // edges={["top", "left", "right"]}
    >
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={process.env.EXPO_OS === "ios" ? "clock.arrow.circlepath" : History}
          onPress={() => router.push("/(tabs)/(more)/accounting/taxes-remit")}
        />
        <Stack.Toolbar.Button
          icon={process.env.EXPO_OS === "ios" ? "plus" : Add}
          onPress={() => setShowRemitSheet(true)}
        />
      </Stack.Toolbar>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={lines}
          keyExtractor={(item, i) => `${item.sale_id}-${item.name}-${i}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 18 }}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.buttonPrimary} size="small" />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconBadge,
                  { backgroundColor: colors.backgroundElement },
                ]}
              >
                <Lucide name="receipt" size={32} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Taxes Collected
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                No taxed sales recorded for this period
              </Text>
            </View>
          }
          renderItem={({ item, index }) => renderLine(item, index)}
        />
      )}

      <RemitTaxSheet
        visible={showRemitSheet}
        onVisibleChange={setShowRemitSheet}
        lines={owedLines}
        isPending={isRemitting}
        onSubmit={(payload) => submitRemittance(payload)}
      />
    </View>
  );
};

export default TaxesScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  footerLoader: { paddingVertical: 20, alignItems: "center" },
  switcherRow: {
    // paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    // paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  dateCol: { flex: 1 },
  dateLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
  },
  datePillText: { fontSize: 12, fontWeight: "600", flex: 1 },

  totalCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "flex-start",
    gap: 2,
  },
  totalLabel: { fontSize: 13, fontWeight: "600" },
  totalValue: { fontSize: 22, fontWeight: "800" },
  summaryList: {
    marginTop: 12,
    gap: 8,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLeft: { flex: 1 },
  summaryName: { fontSize: 14, fontWeight: "700" },
  summaryCount: { fontSize: 12, marginTop: 1 },
  summaryAmount: { fontSize: 14, fontWeight: "800" },
  linesTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 4,
  },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  lineLeft: {
    flex: 1,
    marginRight: 12,
  },
  lineSaleNumber: {
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  lineMeta: { fontSize: 12, marginTop: 2 },
  lineAmount: { fontSize: 14, fontWeight: "700" },
  lineSeparator: { height: StyleSheet.hairlineWidth },
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
  emptySubtitle: { fontSize: 13, textAlign: "center" },
});
