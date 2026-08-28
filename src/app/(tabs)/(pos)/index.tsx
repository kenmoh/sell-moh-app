import { fetchProducts, fetchTenantCategories } from "@/api/inventory";
import Card from "@/components/card";
import DraggableCart from "@/components/draggable-cart";
import ExpandableFAB from "@/components/expandable-fab";
import SearchInput from "@/components/search-input";
import { ColorPalette, Colors } from "@/constants/theme";
import useCartStore from "@/hooks/use-cart-store";
import { Product } from "@/types/product-types";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 20;
const SEARCH_MIN_LENGTH = 3;

const POSScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];
  const flatListRef = useRef<FlatList>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const cartTotalItems = useCartStore((s) => s.totalItems());

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

  const mappedProducts: Product[] = useMemo(
    () =>
      allProducts.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.sku ?? "",
        price: p.selling_price,
        in_stock: 0,
        category: categories.find((c) => c.id === p.category_id)
          ? { id: p.category_id!, name: categories.find((c) => c.id === p.category_id)!.name }
          : undefined,
      })),
    [allProducts, categories],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const hasActiveFilters = debouncedSearch !== "" || activeCategory !== "";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <FlatList
        ref={flatListRef}
        data={mappedProducts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={{ backgroundColor: colors.background }}>
            {/* Top Branding & Header Row */}
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  POS Terminal
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Store Register #01
                </Text>
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  onPress={() => router.push("/(tabs)/(pos)/scan")}
                  style={[
                    styles.scanIconButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: isDark ? "#282b32" : "#eef0f4",
                    },
                  ]}
                >
                  <Lucide name="scan-qr-code" size={20} color="#3b82f6" />
                </Pressable>
              </View>
            </View>

            {/* Sticky Search & Category Bar Wrapper */}
            <View
              style={[
                styles.stickyControlsWrapper,
                {
                  backgroundColor: colors.background,
                  borderBottomColor: isDark ? "#22252a" : "#f0f2f5",
                },
              ]}
            >
              {/* Category Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
              >
                <Pressable
                  onPress={() => setActiveCategory("")}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor:
                        activeCategory === "" ? "#3b82f6" : colors.backgroundElement,
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
                {categories.map((cat) => {
                  const isActive = cat.id === activeCategory;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setActiveCategory(isActive ? "" : cat.id)}
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: isActive
                            ? "#3b82f6"
                            : colors.backgroundElement,
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

              {/* Search Bar */}
              <View style={styles.searchRow}>
                <SearchInput
                  value={search}
                  onChangeText={handleSearchChange}
                  placeholder="Search products..."
                  containerStyle={{ flex: 1 }}
                  onClear={handleSearchClear}
                />
              </View>
            </View>
          </View>
        }
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <Card
            product={item}
            onPress={() => useCartStore.getState().addItem(item)}
          />
        )}
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
            <View style={styles.emptyContainer}>
              <ActivityIndicator color={colors.buttonPrimary} size="large" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconBadge,
                  { backgroundColor: colors.backgroundElement },
                ]}
              >
                <Lucide
                  name="package-search"
                  size={32}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Products Found
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {debouncedSearch
                  ? `No products matching "${debouncedSearch}"`
                  : "No items available."}
              </Text>
              {hasActiveFilters && (
                <Pressable
                  style={[styles.resetButton, { backgroundColor: "#3b82f6" }]}
                  onPress={() => {
                    setSearch("");
                    setDebouncedSearch("");
                    setActiveCategory("");
                  }}
                >
                  <Text style={styles.resetButtonText}>Reset Catalog</Text>
                </Pressable>
              )}
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Floating Action Controls */}
      <DraggableCart />
      <ExpandableFAB />
    </SafeAreaView>
  );
};

export default POSScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scanIconButton: {
    width: 42,
    height: 42,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  stickyControlsWrapper: {
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryPillText: {
    fontSize: 13,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  columnWrapper: {
    paddingHorizontal: 11,
    marginVertical: 4,
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
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 18,
  },
  resetButton: {
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  resetButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});
