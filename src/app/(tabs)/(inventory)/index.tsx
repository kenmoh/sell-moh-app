import { fetchProducts, fetchTenantCategories } from "@/api/inventory";
import AdjustStockSheet from "@/components/adjust-stock-sheet";
import InventoryCard, { InventoryItem, StatusType } from "@/components/inventory-card";
import SearchInput from "@/components/search-input";
import { ColorPalette, Colors, Spacing } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
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

const PAGE_SIZE = 20;
const SEARCH_MIN_LENGTH = 3;

const HeaderNav: React.FC<{
  totalCount: number;
  colors: ColorPalette;
  insetsTop: number;
}> = ({ totalCount, colors, insetsTop }) => (
  <View style={[styles.header, { paddingTop: insetsTop + 10 }]}>
    <Text style={[styles.headerTitle, { color: colors.text }]}>Inventory</Text>
    <View style={styles.headerRight}>
      <View style={[styles.countBadge, { backgroundColor: colors.backgroundElement }]}>
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
        { label: "Total", value: totalItems, filter: "All" as const, icon: "layers" },
        { label: "Low Stock", value: lowStockCount, filter: "Low" as const, icon: "alert-triangle" },
        { label: "Out of Stock", value: outOfStockCount, filter: "Out" as const, icon: "x-circle" },
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
                borderWidth: 1.5,
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
          backgroundColor: activeCategory === "" ? "#2563eb" : colors.backgroundElement,
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
      style={[styles.emptyIconCircle, { backgroundColor: colors.backgroundElement }]}
    >
      <Lucide name="package-search" size={36} color={colors.textSecondary} />
    </View>
    <Text style={[styles.emptyTitle, { color: colors.text }]}>No items found</Text>
    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
      Try adjusting your search or category filters.
    </Text>
    {hasActiveFilters && (
      <Pressable
        onPress={onResetFilters}
        style={[styles.resetFilterButton, { backgroundColor: colors.backgroundElement }]}
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
  const flatListRef = useRef<FlatList>(null);

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
    queryKey: ["categories"],
    queryFn: fetchTenantCategories,
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
    queryKey: ["products", debouncedSearch, activeCategory],
    queryFn: ({ pageParam = 1 }) =>
      fetchProducts({
        page: pageParam,
        page_size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        category: activeCategory || undefined,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.reduce((acc, p) => acc + p.items.length, 0);
      return loadedItems < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allProducts = useMemo(
    () => productsData?.pages.flatMap((p) => p.items) ?? [],
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
        stock: 0,
        status: "In Stock" as StatusType,
        category: categories.find((c) => c.id === p.category_id)?.name ?? "Uncategorized",
      })),
    [allProducts, categories],
  );

  const filteredByStatus = useMemo(() => {
    if (statusFilter === "All") return mappedProducts;
    return mappedProducts.filter((item) => item.status === statusFilter);
  }, [mappedProducts, statusFilter]);

  const totalItems = totalFromServer;
  const lowStockCount = mappedProducts.filter((i) => i.status === "Low").length;
  const outOfStockCount = mappedProducts.filter((i) => i.status === "Out").length;

  const flatListData: ListItemType[] = useMemo(() => {
    const items: ListItemType[] = [{ type: "sticky_header" }];
    filteredByStatus.forEach((item) => {
      items.push({ type: "inventory_item", data: item });
    });
    return items;
  }, [filteredByStatus]);

  const handleCardPress = (item: InventoryItem) => {
    router.push({ pathname: "/(tabs)/(inventory)/[id]", params: { id: item.id } });
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
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={{ backgroundColor: colors.background }}>
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
        unitCost={selectedItem?.price ?? 0}
      />
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
});
