import { fetchProducts, fetchTenantCategories } from "@/api/inventory";
import { fetchTenantStores } from "@/api/store";
import AdjustStockSheet from "@/components/adjust-stock-sheet";
import AppBottomSheet from "@/components/bottom-sheet";
import InventoryCard, {
  InventoryItem,
  StatusType,
} from "@/components/inventory-card";
import SearchInput from "@/components/search-input";
import { ColorPalette, Colors } from "@/constants/theme";
import { useSession } from "@/lib/ctx";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 20;
const SEARCH_MIN_LENGTH = 3;

const HeaderNav: React.FC<{
  totalCount: number;
  colors: ColorPalette;
  insetsTop: number;
  isOwner: boolean;
  currentStoreName: string;
  onOpenStoreSheet: () => void;
}> = ({ totalCount, colors, insetsTop, isOwner, currentStoreName, onOpenStoreSheet }) => (
  <View style={[styles.header, { paddingTop: insetsTop + 10 }]}>
    <View style={{ flex: 1 }}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Inventory</Text>
      {isOwner ? (
        <Pressable onPress={onOpenStoreSheet} style={styles.storeSelector}>
          <Text style={[styles.headerSubtitle, { color: colors.buttonPrimary }]}>
            {currentStoreName}
          </Text>
          <Lucide name="chevron-down" size={14} color={colors.buttonPrimary} />
        </Pressable>
      ) : (
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {currentStoreName}
        </Text>
      )}
    </View>
    <View style={styles.headerRight}>
      <View
        style={[
          styles.countBadge,
          { backgroundColor: colors.backgroundElement },
        ]}
      >
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {totalCount}
        </Text>
      </View>
    </View>
  </View>
);

const InventoryStats: React.FC<{
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  statusFilter: StatusType | "All";
  onToggleFilter: (status: StatusType | "All") => void;
  colors: ColorPalette;
  isDark: boolean;
}> = ({
  totalItems,
  lowStockCount,
  outOfStockCount,
  statusFilter,
  onToggleFilter,
  colors,
  isDark,
}) => (
  <View style={styles.statsSection}>
    <View style={styles.statsRow}>
      {[
        {
          label: "Total",
          value: totalItems,
          filter: "All" as const,
          icon: "layers",
        },
        {
          label: "Low Stock",
          value: lowStockCount,
          filter: "Low" as const,
          icon: "alert-triangle",
        },
        {
          label: "Out of Stock",
          value: outOfStockCount,
          filter: "Out" as const,
          icon: "x-circle",
        },
      ].map((stat) => {
        const isActive = statusFilter === stat.filter;
        return (
          <Pressable
            key={stat.label}
            onPress={() => onToggleFilter(stat.filter)}
            style={[
              styles.statCard,
              {
                backgroundColor: isActive
                  ? stat.filter === "Low"
                    ? "rgba(245,158,11,0.12)"
                    : stat.filter === "Out"
                      ? "rgba(239,68,68,0.12)"
                      : "rgba(59,130,246,0.12)"
                  : colors.card,
                borderColor: isActive
                  ? stat.filter === "Low"
                    ? "#f59e0b"
                    : stat.filter === "Out"
                      ? "#ef4444"
                      : "#3b82f6"
                  : "transparent",
                borderWidth: 1,
              },
            ]}
          >
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor:
                    stat.filter === "Low"
                      ? "rgba(245,158,11,0.15)"
                      : stat.filter === "Out"
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(59,130,246,0.15)",
                },
              ]}
            >
              <Lucide
                name={stat.icon as any}
                size={14}
                color={
                  stat.filter === "Low"
                    ? "#f59e0b"
                    : stat.filter === "Out"
                      ? "#ef4444"
                      : "#3b82f6"
                }
              />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {stat.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const CategoryFilter: React.FC<{
  categoriesList: { id: string; name: string }[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  colors: ColorPalette;
}> = ({ categoriesList, activeCategory, onSelectCategory, colors }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.categoriesContainer}
  >
    <Pressable
      onPress={() => onSelectCategory("")}
      style={[
        styles.categoryPill,
        {
          backgroundColor:
            activeCategory === "" ? "#2563eb" : colors.backgroundElement,
        },
      ]}
    >
      <Text
        style={[
          styles.categoryPillText,
          {
            color: activeCategory === "" ? "#ffffff" : colors.textSecondary,
            fontWeight: activeCategory === "" ? "700" : "600",
          },
        ]}
      >
        All
      </Text>
    </Pressable>
    {categoriesList.map((cat) => {
      const isActive = cat.id === activeCategory;
      return (
        <Pressable
          key={cat.id}
          onPress={() => onSelectCategory(isActive ? "" : cat.id)}
          style={[
            styles.categoryPill,
            {
              backgroundColor: isActive ? "#2563eb" : colors.backgroundElement,
            },
          ]}
        >
          <Text
            style={[
              styles.categoryPillText,
              {
                color: isActive ? "#ffffff" : colors.textSecondary,
                fontWeight: isActive ? "700" : "600",
              },
            ]}
          >
            {cat.name}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

const EmptyInventoryState: React.FC<{
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  colors: ColorPalette;
}> = ({ hasActiveFilters, onResetFilters, colors }) => (
  <View style={styles.emptyState}>
    <View
      style={[
        styles.emptyIconCircle,
        { backgroundColor: colors.backgroundElement },
      ]}
    >
      <Lucide name="package-search" size={36} color={colors.textSecondary} />
    </View>
    <Text style={[styles.emptyTitle, { color: colors.text }]}>
      No items found
    </Text>
    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
      Try adjusting your search or category filters.
    </Text>
    {hasActiveFilters && (
      <Pressable
        onPress={onResetFilters}
        style={[
          styles.resetFilterButton,
          { backgroundColor: colors.backgroundElement },
        ]}
      >
        <Text style={[styles.resetFilterText, { color: colors.text }]}>
          Reset all filters
        </Text>
      </Pressable>
    )}
  </View>
);

type ListItemType =
  | { type: "sticky_header" }
  | { type: "inventory_item"; data: InventoryItem };

const InventoryScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { user } = useSession();
  const isOwner = user?.role?.toLowerCase() === "owner";
  const [selectedStoreId, setSelectedStoreId] = useState(user?.store_id ?? "");
  const [storeSheetVisible, setStoreSheetVisible] = useState(false);

  const activeStoreId = isOwner ? selectedStoreId : (user?.store_id ?? "");

  const { data: storesData } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchTenantStores,
  });

  const stores = storesData ?? [];

  useEffect(() => {
    if (isOwner && stores?.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [isOwner, stores, selectedStoreId]);

  const currentStoreName =
    stores.find((s) => s.id === activeStoreId)?.name ?? "All Stores";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusType | "All">("All");
  const [adjustSheetVisible, setAdjustSheetVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (text.length >= SEARCH_MIN_LENGTH || text.length === 0) {
      debounceTimer.current = setTimeout(() => {
        setDebouncedSearch(text);
      }, 400);
    }
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
  }, []);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", activeStoreId],
    queryFn: () => fetchTenantCategories(activeStoreId),
    enabled: !!activeStoreId,
  });

  const categories = categoriesData ?? [];

  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isRefetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["products", debouncedSearch, activeCategory, activeStoreId],
    queryFn: ({ pageParam = 1 }) =>
      fetchProducts(activeStoreId, {
        page: pageParam,
        page_size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        category: activeCategory || undefined,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.reduce(
        (acc, p) => acc + (p.data?.length ?? 0),
        0,
      );
      return loadedItems < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!activeStoreId,
  });

  const allProducts = useMemo(
    () =>
      productsData?.pages.flatMap((p) => p.data ?? []).filter(Boolean) ?? [],
    [productsData],
  );

  const totalFromServer = productsData?.pages?.[0]?.total ?? 0;

  const mappedProducts: InventoryItem[] = useMemo(
    () =>
      allProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku ?? "N/A",
        price: p.selling_price,
        stock: p.qty,
        reorder_point: p.reorder_point ?? 0,
        category: p.category ?? "Uncategorized",
      })),
    [allProducts],
  );

  const getStatus = (item: InventoryItem): StatusType =>
    item.stock === 0
      ? "Out"
      : item.reorder_point > 0 && item.stock <= item.reorder_point
        ? "Low"
        : "In Stock";

  const filteredByStatus = useMemo(() => {
    if (statusFilter === "All") return mappedProducts;
    return mappedProducts.filter((item) => getStatus(item) === statusFilter);
  }, [mappedProducts, statusFilter]);

  const totalItems = totalFromServer;
  const lowStockCount = mappedProducts.filter((i) => getStatus(i) === "Low").length;
  const outOfStockCount = mappedProducts.filter(
    (i) => getStatus(i) === "Out",
  ).length;

  const flatListData: ListItemType[] = useMemo(() => {
    const items: ListItemType[] = [{ type: "sticky_header" }];
    filteredByStatus.forEach((item) => {
      items.push({ type: "inventory_item", data: item });
    });
    return items;
  }, [filteredByStatus]);

  const handleCardPress = (item: InventoryItem) => {
    router.push({
      pathname: "/(tabs)/(inventory)/[id]",
      params: { id: item.id },
    });
  };

  const handleQuickAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustSheetVisible(true);
  };

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setActiveCategory("");
    setStatusFilter("All");
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const hasActiveFilters =
    debouncedSearch !== "" || activeCategory !== "" || statusFilter !== "All";

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={flatListData}
        keyExtractor={(item, index) =>
          item.type === "sticky_header" ? "sticky_header" : item.data.id
        }
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        onEndReached={
          filteredByStatus.length > 0 ? handleEndReached : undefined
        }
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={{ backgroundColor: colors.background }}>
            <HeaderNav
              totalCount={totalItems}
              colors={colors}
              insetsTop={insets.top}
              isOwner={isOwner}
              currentStoreName={currentStoreName}
              onOpenStoreSheet={() => setStoreSheetVisible(true)}
            />
            <InventoryStats
              totalItems={totalItems}
              lowStockCount={lowStockCount}
              outOfStockCount={outOfStockCount}
              statusFilter={statusFilter}
              onToggleFilter={setStatusFilter}
              colors={colors}
              isDark={isDark}
            />
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "sticky_header") {
            return (
              <View
                style={[
                  styles.stickyControlsWrapper,
                  {
                    backgroundColor: colors.background,
                    borderBottomColor: isDark ? "#22252a" : "#f0f2f5",
                  },
                ]}
              >
                <CategoryFilter
                  categoriesList={categories}
                  activeCategory={activeCategory}
                  onSelectCategory={setActiveCategory}
                  colors={colors}
                />
                <View style={styles.searchSection}>
                  <SearchInput
                    value={search}
                    onChangeText={handleSearchChange}
                    placeholder="Search by product name or SKU..."
                    onClear={handleSearchClear}
                  />
                </View>
              </View>
            );
          }

          return (
            <InventoryCard
              item={item.data}
              onPress={handleCardPress}
              onQuickAdjust={handleQuickAdjust}
            />
          );
        }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              color={colors.buttonPrimary}
              style={{ paddingVertical: 20 }}
            />
          ) : null
        }
        ListEmptyComponent={
          isPending ? (
            <ActivityIndicator
              color={colors.buttonPrimary}
              style={{ paddingVertical: 60 }}
              size="large"
            />
          ) : (
            <EmptyInventoryState
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
              colors={colors}
            />
          )
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <AdjustStockSheet
        visible={adjustSheetVisible}
        onVisibleChange={setAdjustSheetVisible}
        productId={selectedItem?.id ?? ""}
        storeId={activeStoreId}
        unitCost={selectedItem?.price ?? 0}
      />

      {isOwner && (
        <AppBottomSheet
          visible={storeSheetVisible}
          onVisibleChange={setStoreSheetVisible}
          snapPoints={["40%", "70%"]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Select Store
            </Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
              Choose a store to view inventory
            </Text>
          </View>
          {stores.length > 0 ? (
            <View style={styles.pills}>
              {stores.map((store) => {
                const isActive = selectedStoreId === store.id;
                return (
                  <Pressable
                    key={store.id}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isActive
                          ? "#3b82f6"
                          : colors.backgroundElement,
                      },
                    ]}
                    onPress={() => {
                      setSelectedStoreId(isActive ? "" : store.id);
                      setStoreSheetVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: isActive ? "#fff" : colors.text },
                      ]}
                    >
                      {store.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No stores available
            </Text>
          )}
        </AppBottomSheet>
      )}
    </View>
  );
};

export default InventoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  headerSubtitle: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  storeSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: { fontSize: 13, fontWeight: "600" },
  statsSection: { paddingHorizontal: 16, paddingBottom: 12 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "500" },
  stickyControlsWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 4,
  },
  categoryPill: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryPillText: { fontSize: 13 },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  resetFilterButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetFilterText: { fontSize: 14, fontWeight: "600" },
  sheetHeader: { marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetSubtitle: { fontSize: 13, marginTop: 4 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pillText: { fontSize: 14, fontWeight: "600" },
  emptyText: { fontSize: 14, textAlign: "center", paddingVertical: 20 },
});
