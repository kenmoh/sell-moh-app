import { fetchStockHistory } from "@/api/inventory";
import { fetchTenantStores } from "@/api/store";
import { Colors } from "@/constants/theme";
import { useSession } from "@/lib/ctx";
import { StockMovementItem } from "@/types/product";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
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

function formatDate(iso: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function movementIcon(type: string) {
  switch (type) {
    case "sale":
      return "shopping-bag";
    case "restock":
      return "package-plus";
    case "adjustment":
      return "pencil";
    case "transfer":
      return "arrow-right-left";
    case "return":
      return "rotate-ccw";
    default:
      return "activity";
  }
}

export default function StockHistoryScreen() {
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
    queryKey: ["stock-history", activeStoreId],
    queryFn: ({ pageParam = 1 }) =>
      fetchStockHistory(activeStoreId, { page: pageParam, page_size: PAGE_SIZE }),
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

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={styles.header}>
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
          </View>
        }
        renderItem={({ item }) => {
          const isPositive = item.qty_change > 0;
          const iconName = movementIcon(item.movement_type);
          return (
            <View style={[styles.row, { backgroundColor: colors.card }]}>
              <View style={[styles.iconCircle, { backgroundColor: `${isPositive ? "#16a34a" : "#dc2626"}18` }]}>
                <Lucide
                  name={iconName as any}
                  size={14}
                  color={isPositive ? "#16a34a" : "#dc2626"}
                />
              </View>
              <View style={styles.rowContent}>
                <View style={styles.rowTop}>
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                    {item.product_name ?? "Product"}
                  </Text>
                  <Text
                    style={[
                      styles.qtyChange,
                      { color: isPositive ? "#16a34a" : "#dc2626" },
                    ]}
                  >
                    {isPositive ? "+" : ""}
                    {item.qty_change}
                  </Text>
                </View>
                <View style={styles.rowBottom}>
                  <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>
                    {item.movement_type.charAt(0).toUpperCase() + item.movement_type.slice(1)}
                  </Text>
                  {item.notes ? (
                    <Text style={[styles.note, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  ) : null}
                  <Text style={[styles.date, { color: colors.textSecondary }]}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
                <View style={styles.balanceRow}>
                  <Text style={[styles.balance, { color: colors.textSecondary }]}>
                    Bal: {item.balance_before} → {item.balance_after}
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
              <Lucide name="history" size={36} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No stock history
              </Text>
            </View>
          )
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 16,
        }}
      />

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
                  {isActive && <Lucide name="check" size={16} color="#3b82f6" />}
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
  header: { paddingTop: 8, paddingBottom: 12 },
  storeSelector: { flexDirection: "row", alignItems: "center", gap: 4 },
  storeName: { fontSize: 14, fontWeight: "600" },
  row: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  rowContent: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productName: { fontSize: 14, fontWeight: "600", flex: 1 },
  qtyChange: { fontSize: 14, fontWeight: "800", marginLeft: 8 },
  rowBottom: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  typeLabel: { fontSize: 12, fontWeight: "500" },
  note: { fontSize: 11, fontStyle: "italic", flex: 1 },
  date: { fontSize: 11 },
  balanceRow: { marginTop: 2 },
  balance: { fontSize: 11 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "500" },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  sheet: { width: "85%", borderRadius: 16, padding: 20, gap: 4 },
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
