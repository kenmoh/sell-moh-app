import { fetchStockBalances } from "@/api/inventory";
import { fetchTenantStores } from "@/api/store";
import { Colors } from "@/constants/theme";
import { useSession } from "@/lib/ctx";
import { StockBalanceItem } from "@/types/product";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 50;

function getStockStatus(qty: number, min: number) {
  if (qty === 0) return { label: "Out of Stock", color: "#dc2626" };
  if (min > 0 && qty <= min) return { label: "Low Stock", color: "#f59e0b" };
  return { label: "In Stock", color: "#16a34a" };
}

export default function StockBalanceScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const isOwner = user?.role?.toLowerCase() === "owner";
  const [selectedStoreId, setSelectedStoreId] = useState(user?.store_id ?? "");
  const [storeSheetVisible, setStoreSheetVisible] = useState(false);

  const { data: storesData } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchTenantStores,
  });
  const stores = storesData ?? [];

  useEffect(() => {
    if (isOwner && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [isOwner, stores, selectedStoreId]);

  const activeStoreId = isOwner ? selectedStoreId : (user?.store_id ?? "");
  const currentStoreName =
    stores.find((s) => s.id === activeStoreId)?.name ?? "All Stores";

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isRefetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["stock-balances", activeStoreId],
    queryFn: ({ pageParam = 1 }) =>
      fetchStockBalances(activeStoreId, { page: pageParam, page_size: PAGE_SIZE }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + (p.data?.length ?? 0), 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!activeStoreId,
  });

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.data ?? []).filter(Boolean) ?? [],
    [data],
  );
  const total = data?.pages?.[0]?.total ?? 0;

  const lowStockCount = useMemo(
    () =>
      items.filter(
        (i) =>
          i.qty > 0 &&
          i.min_stock_level > 0 &&
          i.qty <= i.min_stock_level,
      ).length,
    [items],
  );
  const outOfStockCount = useMemo(
    () => items.filter((i) => i.qty === 0).length,
    [items],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.product_id}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Store selector */}
            {isOwner ? (
              <Pressable
                style={styles.storeSelector}
                onPress={() => setStoreSheetVisible(true)}
              >
                <Text style={[styles.storeName, { color: colors.buttonPrimary }]}>
                  {currentStoreName}
                </Text>
                <Lucide name="chevron-down" size={14} color={colors.buttonPrimary} />
              </Pressable>
            ) : (
              <Text style={[styles.storeName, { color: colors.textSecondary }]}>
                {currentStoreName}
              </Text>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.statValue, { color: colors.text }]}>{total}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Total
                </Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: "rgba(245,158,11,0.1)" },
                ]}
              >
                <Text style={[styles.statValue, { color: "#f59e0b" }]}>
                  {lowStockCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Low Stock
                </Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: "rgba(220,38,38,0.1)" },
                ]}
              >
                <Text style={[styles.statValue, { color: "#dc2626" }]}>
                  {outOfStockCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Out of Stock
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const status = getStockStatus(item.qty, item.min_stock_level);
          return (
            <View
              style={[styles.row, { backgroundColor: colors.card }]}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: status.color },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                    {item.product_name ?? "Unknown"}
                  </Text>
                  {item.sku ? (
                    <Text style={[styles.sku, { color: colors.textSecondary }]}>
                      {item.sku}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.qty, { color: colors.text }]}>{item.qty}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${status.color}18` }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          isPending ? (
            <ActivityIndicator
              color={colors.buttonPrimary}
              size="large"
              style={{ paddingVertical: 60 }}
            />
          ) : (
            <View style={styles.emptyState}>
              <Lucide name="package" size={36} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No stock data
              </Text>
            </View>
          )
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 16,
        }}
      />

      {/* Store picker sheet */}
      {isOwner && storeSheetVisible && (
        <Pressable
          style={styles.overlay}
          onPress={() => setStoreSheetVisible(false)}
        >
          <View
            style={[styles.sheet, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Select Store
            </Text>
            {stores.map((store) => {
              const isActive = selectedStoreId === store.id;
              return (
                <Pressable
                  key={store.id}
                  style={[
                    styles.storeOption,
                    {
                      backgroundColor: isActive
                        ? "rgba(59,130,246,0.1)"
                        : "transparent",
                    },
                  ]}
                  onPress={() => {
                    setSelectedStoreId(store.id);
                    setStoreSheetVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.storeOptionText,
                      {
                        color: isActive ? "#3b82f6" : colors.text,
                        fontWeight: isActive ? "700" : "500",
                      },
                    ]}
                  >
                    {store.name}
                  </Text>
                  {isActive && (
                    <Lucide name="check" size={16} color="#3b82f6" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 8, paddingBottom: 12, gap: 12 },
  storeSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeName: { fontSize: 14, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "500" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  productName: { fontSize: 14, fontWeight: "600" },
  sku: { fontSize: 11, textTransform: "uppercase", marginTop: 1 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  qty: { fontSize: 16, fontWeight: "800" },
  statusBadge: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: { fontSize: 10, fontWeight: "600" },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: { fontSize: 14, fontWeight: "500" },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  sheet: {
    width: "85%",
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  storeOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  storeOptionText: { fontSize: 15 },
});
