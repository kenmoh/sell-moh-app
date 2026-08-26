import Card from "@/components/card";
import DraggableCart from "@/components/draggable-cart";
import ExpandableFAB from "@/components/expandable-fab";
import SearchInput from "@/components/search-input";
import { ColorPalette, Colors } from "@/constants/theme";
import useCartStore from "@/hooks/use-cart-store";
import { Product } from "@/types/product-types";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Coca-Cola 50cl",
    description: "Refreshing carbonated soft drink",
    price: 500,
    in_stock: 48,
    category: { id: "1", name: "Beverages" },
  },
  {
    id: "2",
    name: "Indomie Chicken 70g",
    description: "Instant noodles pack",
    price: 350,
    in_stock: 12,
    category: { id: "2", name: "Food" },
  },
  {
    id: "3",
    name: "Peak Milk 400g",
    description: "Full cream evaporated milk can",
    price: 2700,
    in_stock: 35,
    category: { id: "2", name: "Food" },
  },
  {
    id: "4",
    name: "Bluetooth Earbuds Pro",
    description: "Wireless audio noise canceling",
    price: 12500,
    in_stock: 0,
    category: { id: "3", name: "Electronics" },
  },
  {
    id: "5",
    name: "Dettol Antiseptic 250ml",
    description: "Disinfectant liquid cleaner",
    price: 1250,
    in_stock: 8,
    category: { id: "4", name: "Household" },
  },
  {
    id: "6",
    name: "Golden Penny Semovita",
    description: "Premium wheat flour 1kg",
    price: 1800,
    in_stock: 22,
    category: { id: "2", name: "Food" },
  },
  {
    id: "7",
    name: "Monster Energy 500ml",
    description: "High performance energy drink",
    price: 900,
    in_stock: 30,
    category: { id: "1", name: "Beverages" },
  },
  {
    id: "8",
    name: "Fast USB-C Charger 25W",
    description: "Quick charge wall adapter",
    price: 7500,
    in_stock: 15,
    category: { id: "3", name: "Electronics" },
  },
  {
    id: "9",
    name: "Colgate Toothpaste 140g",
    description: "Maximum cavity protection",
    price: 950,
    in_stock: 19,
    category: { id: "5", name: "Personal Care" },
  },
  {
    id: "10",
    name: "Milo Cocoa Powder 500g",
    description: "Chocolate malt beverage drink",
    price: 3200,
    in_stock: 25,
    category: { id: "2", name: "Food" },
  },
  {
    id: "11",
    name: "Pringles Sour Cream 158g",
    description: "Crispy potato chips canister",
    price: 2100,
    in_stock: 16,
    category: { id: "2", name: "Food" },
  },
  {
    id: "12",
    name: "Nivea Roll-On 50ml",
    description: "48h antiperspirant protection",
    price: 1400,
    in_stock: 20,
    category: { id: "5", name: "Personal Care" },
  },
];

const categoriesList = [
  "All",
  "Beverages",
  "Food",
  "Electronics",
  "Household",
  "Personal Care",
];

const POSScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const cartTotalItems = useCartStore((s) => s.totalItems());

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: mockProducts.length };
    mockProducts.forEach((p) => {
      const catName = p.category?.name ?? "General";
      counts[catName] = (counts[catName] || 0) + 1;
    });
    return counts;
  }, []);

  // Filtered product catalog
  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(search.toLowerCase())) ||
        (product.category?.name &&
          product.category.name.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        activeCategory === "All" || product.category?.name === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]} // Makes search + category bar sticky
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
              {/* Category Pills (Horizontal Scroll) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
              >
                {categoriesList.map((cat) => {
                  const isActive = cat === activeCategory;
                  const count = categoryCounts[cat] ?? 0;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setActiveCategory(cat)}
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
                        {cat}
                      </Text>
                      <View
                        style={[
                          styles.pillBadge,
                          {
                            backgroundColor: isActive
                              ? "rgba(255, 255, 255, 0.25)"
                              : isDark
                                ? "#2d3038"
                                : "#e2e5eb",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillBadgeText,
                            {
                              color: isActive
                                ? "#ffffff"
                                : colors.textSecondary,
                            },
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Search Bar + Barcode Scanner Trigger */}
              <View style={styles.searchRow}>
                <SearchInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search products or scan barcode..."
                  containerStyle={{ flex: 1 }}
                  onClear={() => setSearch("")}
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
        ListEmptyComponent={
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
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              {search
                ? `No products matching "${search}"`
                : `No items available in ${activeCategory}.`}
            </Text>
            {(search || activeCategory !== "All") && (
              <Pressable
                style={[styles.resetButton, { backgroundColor: "#3b82f6" }]}
                onPress={() => {
                  setSearch("");
                  setActiveCategory("All");
                }}
              >
                <Text style={styles.resetButtonText}>Reset Catalog</Text>
              </Pressable>
            )}
          </View>
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
  activeCartBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 100,
  },
  activeCartBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
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
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 7,
  },
  categoryPillText: {
    fontSize: 13,
  },
  pillBadge: {
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  barcodeButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
