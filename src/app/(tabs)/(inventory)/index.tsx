import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StatusType = "In Stock" | "Low" | "Out";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: StatusType;
  category: string;
}

const inventory: InventoryItem[] = [
  { id: "1", name: "Coca-Cola 50cl", sku: "SKU-001", price: 500, stock: 48, status: "In Stock", category: "Beverages" },
  { id: "2", name: "Indomie Chicken 70g", sku: "SKU-002", price: 350, stock: 12, status: "Low", category: "Food" },
  { id: "3", name: "Peak Milk 400g", sku: "SKU-003", price: 2700, stock: 35, status: "In Stock", category: "Food" },
  { id: "4", name: "Bluetooth Earbuds Pro", sku: "SKU-004", price: 12500, stock: 0, status: "Out", category: "Electronics" },
  { id: "5", name: "Dettol Antiseptic 250ml", sku: "SKU-005", price: 1250, stock: 8, status: "Low", category: "Household" },
  { id: "6", name: "Golden Penny Semovita", sku: "SKU-006", price: 1800, stock: 22, status: "In Stock", category: "Food" },
];

const categories = ["All", "Beverages", "Food", "Electronics", "Household"];

const statusColors: Record<StatusType, { color: string; bg: string }> = {
  "In Stock": { color: "#16a34a", bg: "rgba(22, 163, 74, 0.1)" },
  Low: { color: "#d97706", bg: "rgba(217, 119, 6, 0.1)" },
  Out: { color: "#dc2626", bg: "rgba(220, 38, 38, 0.1)" },
};

const Inventory = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalItems = inventory.length;
  const lowStock = inventory.filter((i) => i.status === "Low").length;
  const outOfStock = inventory.filter((i) => i.status === "Out").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Lucide name="chevron-left" size={24} color={colors.text} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Inventory
        </Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <View style={{ backgroundColor: colors.background }}>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statChip, { backgroundColor: colors.card }]}>
                <View style={[styles.statIcon, { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}>
                  <Lucide name="package" size={14} color="#3b82f6" />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Total
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {totalItems}
                </Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: colors.card }]}>
                <View style={[styles.statIcon, { backgroundColor: "rgba(217, 119, 6, 0.1)" }]}>
                  <Lucide name="alert-triangle" size={14} color="#d97706" />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Low Stock
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {lowStock}
                </Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: colors.card }]}>
                <View style={[styles.statIcon, { backgroundColor: "rgba(220, 38, 38, 0.1)" }]}>
                  <Lucide name="x-circle" size={14} color="#dc2626" />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Out
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {outOfStock}
                </Text>
              </View>
            </View>

            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: colors.backgroundElement }]}>
              <Lucide name="search" size={18} color={colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search inventory..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>

            {/* Category Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabs}
            >
              {categories.map((cat) => {
                const isActive = cat === activeCategory;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: isActive ? "#3b82f6" : colors.backgroundElement,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isActive ? "#fff" : colors.textSecondary,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => {
          const sc = statusColors[item.status];
          return (
            <Pressable
              style={[
                styles.itemCard,
                { backgroundColor: colors.card },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(inventory)/product-details",
                  params: { id: item.id },
                })
              }
            >
              <View style={[styles.itemAvatar, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                  {item.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemSku, { color: colors.textSecondary }]}>
                  {item.sku}
                </Text>
                <Text style={styles.itemPrice}>₦{item.price.toLocaleString()}</Text>
              </View>
              <View style={styles.itemRight}>
                <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.color }]}>
                    {item.stock} {item.status}
                  </Text>
                </View>
                <Lucide name="chevron-right" size={18} color={colors.textSecondary} />
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  );
};

export default Inventory;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerRight: { width: 40 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  statChip: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontSize: 11, fontWeight: "500" },
  statValue: { fontSize: 16, fontWeight: "800" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  categoryTabs: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  categoryPill: {
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  itemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "700" },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: "600" },
  itemSku: { fontSize: 11 },
  itemPrice: { fontSize: 14, fontWeight: "700", color: "#3b82f6" },
  itemRight: { alignItems: "flex-end", gap: 6 },
  statusPill: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
});
