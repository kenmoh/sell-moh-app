import { fetchRemittanceHistory } from "@/api/accounting";
import StoreSwitcher from "@/components/store-switcher";
import { Colors } from "@/constants/theme";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import { useActiveStore } from "@/lib/store-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const REMIT_PAGE_SIZE = 20;

const RemittanceHistoryScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const { activeStoreId } = useActiveStore();

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["remittances", "infinite", activeStoreId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchRemittanceHistory({
        page: pageParam,
        pageSize: REMIT_PAGE_SIZE,
        storeId: activeStoreId,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.page_size < lastPage.total
        ? lastPage.page + 1
        : undefined,
  });

  useApiErrorToast({ isError, error, title: "Couldn't load remittances" });

  const remittances = data?.pages.flatMap((page) => page.items) ?? [];

  const renderItem = useCallback(
    ({ item }: { item: (typeof remittances)[0] }) => (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? "#282b32" : "#eef0f4",
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.journalNumber, { color: colors.text }]}>
            {item.journal_number}
          </Text>
          <Text style={styles.amount}>₦{item.amount.toLocaleString()}</Text>
        </View>
        <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {item.account_name} ({item.account_code}) ·{" "}
            {item.payment_date
              ? new Date(item.payment_date).toLocaleDateString()
              : "—"}
          </Text>
        </View>
      </View>
    ),
    [colors, isDark],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.switcherRow}>
        <StoreSwitcher mode="all" />
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={remittances}
          keyExtractor={(item) => item.journal_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color={colors.buttonPrimary}
                size="small"
                style={{ paddingVertical: 16 }}
              />
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
                <Lucide name="landmark" size={32} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Remittances Yet
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Tax remittances you record will appear here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default RemittanceHistoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  switcherRow: { paddingHorizontal: 16, marginBottom: 8 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  journalNumber: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  amount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0ea5e9",
  },
  description: {
    fontSize: 13,
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  meta: { fontSize: 12 },
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
