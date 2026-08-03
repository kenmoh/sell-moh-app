import { AppBottomSheet } from "@/components/bottom-sheet";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StatusType = "In Stock" | "Low" | "Out";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: StatusType;
  category: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
  color: string;
  icon: string;
}

const products: Product[] = [
  { id: "1", name: "Coca-Cola 50cl", sku: "SKU-001", price: 500, stock: 48, status: "In Stock", category: "Beverages" },
  { id: "2", name: "Indomie Chicken 70g", sku: "SKU-002", price: 350, stock: 12, status: "Low", category: "Food" },
  { id: "3", name: "Peak Milk 400g", sku: "SKU-003", price: 2700, stock: 35, status: "In Stock", category: "Food" },
  { id: "4", name: "Bluetooth Earbuds Pro", sku: "SKU-004", price: 12500, stock: 0, status: "Out", category: "Electronics" },
  { id: "5", name: "Dettol Antiseptic 250ml", sku: "SKU-005", price: 1250, stock: 8, status: "Low", category: "Household" },
  { id: "6", name: "Golden Penny Semovita", sku: "SKU-006", price: 1800, stock: 22, status: "In Stock", category: "Food" },
];

const categories: Category[] = [
  { id: "1", name: "Beverages", count: 12, color: "#3b82f6", icon: "cup-soda" },
  { id: "2", name: "Food", count: 24, color: "#16a34a", icon: "utensils" },
  { id: "3", name: "Electronics", count: 8, color: "#a855f7", icon: "smartphone" },
  { id: "4", name: "Household", count: 15, color: "#f59e0b", icon: "home" },
  { id: "5", name: "Personal Care", count: 10, color: "#ec4899", icon: "heart" },
];

const statusColors: Record<StatusType, { color: string; bg: string }> = {
  "In Stock": { color: "#16a34a", bg: "rgba(22, 163, 74, 0.1)" },
  Low: { color: "#d97706", bg: "rgba(217, 119, 6, 0.1)" },
  Out: { color: "#dc2626", bg: "rgba(220, 38, 38, 0.1)" },
};

const ProductsCategories = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetView, setSheetView] = useState<"list" | "add">("list");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("tag");

  const iconOptions = ["tag", "cup-soda", "utensils", "smartphone", "home", "heart", "shirt", "book", "car", "baby"];

  const openCategorySheet = () => {
    setSheetView("list");
    setSheetVisible(true);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      categories.push({
        id: String(categories.length + 1),
        name: newCategoryName.trim(),
        count: 0,
        color: "#3b82f6",
        icon: newCategoryIcon,
      });
      setNewCategoryName("");
      setNewCategoryIcon("tag");
      setSheetView("list");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerLeft} onPress={() => router.back()}>
          <Lucide name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Product & Categories
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: "#3b82f6" }]}
          onPress={() => router.push("/(tabs)/(more)/add-product")}
        >
          <Lucide name="plus" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Add Product</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.backgroundElement, borderWidth: 1 }]}
          onPress={openCategorySheet}
        >
          <Lucide name="tags" size={16} color={colors.text} />
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Categories</Text>
        </Pressable>
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
          gap: 8,
        }}
        renderItem={({ item }) => {
          const sc = statusColors[item.status];
          return (
            <Pressable
              style={[styles.productCard, { backgroundColor: colors.card }]}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(more)/product-details",
                  params: { id: item.id },
                })
              }
            >
              <View style={[styles.productAvatar, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                  {item.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.productSku, { color: colors.textSecondary }]}>
                  {item.sku}
                </Text>
                <Text style={styles.productPrice}>₦{item.price.toLocaleString()}</Text>
              </View>
              <View style={styles.productRight}>
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
      />

      {/* Single Category Sheet */}
      <AppBottomSheet
        visible={sheetVisible}
        onVisibleChange={setSheetVisible}
      >
        {sheetView === "list" ? (
          <>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Categories</Text>
            {categories.map((cat, i) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryRow,
                  i < categories.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.backgroundElement,
                  },
                ]}
              >
                <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}15` }]}>
                  <Lucide name={cat.icon as any} size={18} color={cat.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                  <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                    {cat.count} products
                  </Text>
                </View>
                <Lucide name="chevron-right" size={18} color={colors.textSecondary} />
              </Pressable>
            ))}
            <Pressable
              style={[styles.addCategoryButton, { backgroundColor: "#3b82f6" }]}
              onPress={() => setSheetView("add")}
            >
              <Lucide name="plus" size={16} color="#fff" />
              <Text style={styles.addCategoryButtonText}>Add Category</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable style={styles.sheetBack} onPress={() => setSheetView("list")}>
              <Lucide name="chevron-left" size={20} color={colors.text} />
              <Text style={[styles.sheetBackText, { color: colors.text }]}>Back</Text>
            </Pressable>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Category</Text>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category Name</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}
              placeholder="e.g. Beverages"
              placeholderTextColor={colors.textSecondary}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Icon</Text>
            <View style={styles.iconGrid}>
              {iconOptions.map((icon) => (
                <Pressable
                  key={icon}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor: newCategoryIcon === icon ? "#3b82f615" : colors.backgroundElement,
                      borderColor: newCategoryIcon === icon ? "#3b82f6" : "transparent",
                    },
                  ]}
                  onPress={() => setNewCategoryIcon(icon)}
                >
                  <Lucide name={icon as any} size={18} color={newCategoryIcon === icon ? "#3b82f6" : colors.textSecondary} />
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[
                styles.saveButton,
                { backgroundColor: newCategoryName.trim() ? "#3b82f6" : colors.backgroundElement },
              ]}
              onPress={handleAddCategory}
              disabled={!newCategoryName.trim()}
            >
              <Text style={[styles.saveButtonText, { color: newCategoryName.trim() ? "#fff" : colors.textSecondary }]}>
                Add Category
              </Text>
            </Pressable>
          </>
        )}
      </AppBottomSheet>
    </View>
  );
};

export default ProductsCategories;

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
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 100,
    paddingVertical: 12,
  },
  actionButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  productAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "700" },
  productInfo: { flex: 1, gap: 2 },
  productName: { fontSize: 14, fontWeight: "600" },
  productSku: { fontSize: 11 },
  productPrice: { fontSize: 14, fontWeight: "700", color: "#3b82f6" },
  productRight: { alignItems: "flex-end", gap: 6 },
  statusPill: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 15, fontWeight: "600" },
  categoryCount: { fontSize: 12 },
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 100,
    paddingVertical: 12,
    marginTop: 16,
  },
  addCategoryButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  sheetBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  sheetBackText: { fontSize: 14, fontWeight: "500" },
  inputLabel: { fontSize: 13, fontWeight: "500", marginBottom: 6, marginTop: 12 },
  textInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  saveButton: {
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  saveButtonText: { fontSize: 14, fontWeight: "600" },
});
