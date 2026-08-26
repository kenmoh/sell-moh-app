import AdjustStockSheet from "@/components/adjust-stock-sheet";
import InventoryCard, {
  InventoryItem,
  StatusType,
} from "@/components/inventory-card";
import SearchInput from "@/components/search-input";
import { ColorPalette, Colors, Spacing } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

// Initial Mock Data
const initialInventory: InventoryItem[] = [
  {
    id: "1",
    name: "Coca-Cola 50cl",
    sku: "SKU-001",
    price: 500,
    stock: 48,
    status: "In Stock",
    category: "Beverages",
  },
  {
    id: "2",
    name: "Indomie Chicken 70g",
    sku: "SKU-002",
    price: 350,
    stock: 12,
    status: "Low",
    category: "Food",
  },
  {
    id: "3",
    name: "Peak Milk 400g",
    sku: "SKU-003",
    price: 2700,
    stock: 35,
    status: "In Stock",
    category: "Food",
  },
  {
    id: "4",
    name: "Bluetooth Earbuds Pro",
    sku: "SKU-004",
    price: 12500,
    stock: 0,
    status: "Out",
    category: "Electronics",
  },
  {
    id: "5",
    name: "Dettol Antiseptic 250ml",
    sku: "SKU-005",
    price: 1250,
    stock: 8,
    status: "Low",
    category: "Household",
  },
  {
    id: "6",
    name: "Golden Penny Semovita",
    sku: "SKU-006",
    price: 1800,
    stock: 22,
    status: "In Stock",
    category: "Food",
  },
];

const categories = ["All", "Beverages", "Food", "Electronics", "Household"];

// ==========================================
// SUB-COMPONENTS
// ==========================================

/**
 * Navigation Top Bar
 */
const HeaderNav: React.FC<{
  totalCount: number;
  filteredCount: number;
  insetsTop: number;
  colors: ColorPalette;
  isDark: boolean;
}> = ({ totalCount, filteredCount, insetsTop, colors, isDark }) => (
  <View
    style={[
      styles.header,
      {
        paddingTop: insetsTop + 8,
        backgroundColor: colors.background,
        borderBottomColor: isDark ? "#22252a" : "#f0f2f5",
      },
    ]}
  >
    <Pressable
      onPress={() => router.back()}
      hitSlop={10}
      style={[
        styles.headerIconBtn,
        { backgroundColor: colors.backgroundElement },
      ]}
    >
      <Lucide name="chevron-left" size={22} color={colors.text} />
    </Pressable>

    <View style={styles.headerTitleContainer}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        Inventory
      </Text>
      <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
        {filteredCount} of {totalCount} items
      </Text>
    </View>

    <Pressable
      onPress={() => router.push("/(tabs)/(more)/add-product")}
      style={styles.addButton}
    >
      <Lucide name="plus" size={16} color="#ffffff" />
      <Text style={styles.addButtonText}>Add</Text>
    </Pressable>
  </View>
);

/**
 * Metric Summary Cards Component (Non-sticky, scrolls away)
 */
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
  <View style={styles.statsContainer}>
    {/* Total Items */}
    <Pressable
      onPress={() => onToggleFilter("All")}
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor:
            statusFilter === "All" ? "#3b82f6" : isDark ? "#2b2e35" : "#edf0f5",
        },
      ]}
    >
      <View
        style={[
          styles.statIconBadge,
          { backgroundColor: "rgba(59, 130, 246, 0.12)" },
        ]}
      >
        <Lucide name="package" size={16} color="#3b82f6" />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>
        {totalItems}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        Total Stock
      </Text>
    </Pressable>

    {/* Low Stock Alert */}
    <Pressable
      onPress={() => onToggleFilter(statusFilter === "Low" ? "All" : "Low")}
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor:
            statusFilter === "Low" ? "#f59e0b" : isDark ? "#2b2e35" : "#edf0f5",
        },
      ]}
    >
      <View
        style={[
          styles.statIconBadge,
          { backgroundColor: "rgba(245, 158, 11, 0.12)" },
        ]}
      >
        <Lucide name="alert-triangle" size={16} color="#f59e0b" />
      </View>
      <Text style={[styles.statValue, { color: "#f59e0b" }]}>
        {lowStockCount}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        Low Stock
      </Text>
    </Pressable>

    {/* Out of Stock */}
    <Pressable
      onPress={() => onToggleFilter(statusFilter === "Out" ? "All" : "Out")}
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor:
            statusFilter === "Out" ? "#ef4444" : isDark ? "#2b2e35" : "#edf0f5",
        },
      ]}
    >
      <View
        style={[
          styles.statIconBadge,
          { backgroundColor: "rgba(239, 68, 68, 0.12)" },
        ]}
      >
        <Lucide name="x-circle" size={16} color="#ef4444" />
      </View>
      <Text style={[styles.statValue, { color: "#ef4444" }]}>
        {outOfStockCount}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        Out of Stock
      </Text>
    </Pressable>
  </View>
);

/**
 * Category Filter Bar Component
 */
const CategoryFilter: React.FC<{
  categoriesList: string[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  colors: ColorPalette;
}> = ({ categoriesList, activeCategory, onSelectCategory, colors }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.categoriesContainer}
  >
    {categoriesList.map((cat) => {
      const isActive = cat === activeCategory;
      return (
        <Pressable
          key={cat}
          onPress={() => onSelectCategory(cat)}
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
            {cat}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

/**
 * Empty Results Component
 */
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
      Try adjusting your search terms or category filters to locate products.
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

// ==========================================
// MAIN SCREEN COMPONENT
// ==========================================

type ListItemType =
  | { type: "sticky_header" }
  | { type: "inventory_item"; data: InventoryItem };

const InventoryScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusType | "All">("All");
  const [adjustSheetVisible, setAdjustSheetVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Metrics
  const totalItems = initialInventory.length;
  const lowStockCount = initialInventory.filter(
    (i) => i.status === "Low",
  ).length;
  const outOfStockCount = initialInventory.filter(
    (i) => i.status === "Out",
  ).length;

  const filteredItems = useMemo(() => {
    return initialInventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [search, activeCategory, statusFilter]);

  // Construct flat list data where index 0 is the sticky section (Categories + Search)
  const flatListData: ListItemType[] = useMemo(() => {
    const items: ListItemType[] = [{ type: "sticky_header" }];
    filteredItems.forEach((item) => {
      items.push({ type: "inventory_item", data: item });
    });
    return items;
  }, [filteredItems]);

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
    setActiveCategory("All");
    setStatusFilter("All");
  };

  const hasActiveFilters =
    search !== "" || activeCategory !== "All" || statusFilter !== "All";

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      // edges={["top", "left", "right"]}
    >
      <FlatList
        data={flatListData}
        keyExtractor={(item, index) =>
          item.type === "sticky_header" ? "sticky_header" : item.data.id
        }
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]} // Index 0 (Category Pills + Search) sticks on scroll!
        ListHeaderComponent={
          <View style={{ backgroundColor: colors.background }}>
            {/* Summary Stat Cards - Scrolls away */}
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
                {/* 1. Category Pills at the top of sticky block */}
                <CategoryFilter
                  categoriesList={categories}
                  activeCategory={activeCategory}
                  onSelectCategory={setActiveCategory}
                  colors={colors}
                />

                {/* 2. Search Bar placed directly BELOW category pills */}
                <View style={styles.searchSection}>
                  <SearchInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by product name or SKU..."
                    onClear={() => setSearch("")}
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
        ListEmptyComponent={
          <EmptyInventoryState
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
            colors={colors}
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      {/* Stock Adjustment Bottom Sheet */}
      <AdjustStockSheet
        visible={adjustSheetVisible}
        onVisibleChange={setAdjustSheetVisible}
      />
    </View>
  );
};

export default InventoryScreen;

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 5,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  statIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  stickyControlsWrapper: {
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryPillText: {
    fontSize: 13,
  },
  searchSection: {
    paddingHorizontal: 16,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.five,
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    lineHeight: 18,
    marginBottom: 16,
  },
  resetFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
