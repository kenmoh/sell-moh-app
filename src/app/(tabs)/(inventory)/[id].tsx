import { fetchTenantCategories, getProductById } from "@/api/inventory";
import AdjustStockSheet from "@/components/adjust-stock-sheet";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const salesData = [
  { day: "Mon", units: 18 },
  { day: "Tue", units: 24 },
  { day: "Wed", units: 12 },
  { day: "Thu", units: 30 },
  { day: "Fri", units: 22 },
  { day: "Sat", units: 28 },
];
const maxSales = Math.max(...salesData.map((d) => d.units));

const stockHistory = [
  {
    date: "Dec 10, 2024",
    action: "Restock",
    qty: +50,
    balance: 48,
    note: "Supplier delivery",
  },
  { date: "Dec 3, 2024", action: "Sale", qty: -12, balance: 58, note: "" },
  {
    date: "Nov 28, 2024",
    action: "Adjustment",
    qty: -3,
    balance: 70,
    note: "Damaged units",
  },
  {
    date: "Nov 20, 2024",
    action: "Restock",
    qty: +25,
    balance: 73,
    note: "Weekly restock",
  },
];

const ProductDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [adjustVisible, setAdjustVisible] = useState(false);

  const { data: product, isPending: isLoadingProduct } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id!),
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchTenantCategories,
  });

  const categoryName =
    categories?.find((c) => c.id === product?.category_id)?.name ?? "Uncategorized";

  if (isLoadingProduct) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator color={colors.buttonPrimary} size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Product not found
        </Text>
      </View>
    );
  }

  const initial = product.name.charAt(0).toUpperCase();
  const priceFormatted = `₦${product.selling_price.toLocaleString()}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          gap: 24,
        }}
      >
        {/* Product Identity Card */}
        <View style={[styles.identityCard, { backgroundColor: colors.card }]}>
          <View style={{ flexDirection: "row" }}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: colors.text }]}>
                {product.name}
              </Text>
              <Text
                style={[styles.productSku, { color: colors.textSecondary }]}
              >
                {product.sku ?? "No SKU"}
              </Text>
            </View>
          </View>
          <Text style={styles.productPrice}>{priceFormatted}</Text>
          <View style={styles.tagRow}>
            <View
              style={[
                styles.tag,
                {
                  backgroundColor:
                    product.status === "active"
                      ? "rgba(22,163,74,0.1)"
                      : "rgba(220,38,38,0.1)",
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  {
                    color: product.status === "active" ? "#16a34a" : "#dc2626",
                  },
                ]}
              >
                {product.status === "active" ? "Active" : "Inactive"}
              </Text>
            </View>
            <View
              style={[
                styles.tag,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                {categoryName}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable
            style={[
              styles.actionButton,
              { borderColor: colors.backgroundElement },
            ]}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/(inventory)/add-product",
                params: {
                  id: product.id,
                  name: product.name,
                  sku: product.sku ?? "",
                  category_id: product.category_id ?? "",
                  selling_price: String(product.selling_price),
                },
              })
            }
          >
            <Lucide name="pencil" size={16} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Edit Product</Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionButton,
              { borderColor: colors.backgroundElement },
            ]}
            onPress={() => setAdjustVisible(true)}
          >
            <Lucide name="package-plus" size={16} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Adjust Stock</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 24 }}>
          {/* Details */}
          <View>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              DETAILS
            </Text>
            <View
              style={[styles.detailsCard, { backgroundColor: colors.card }]}
            >
              {[
                { label: "Product ID", value: product.public_id },
                { label: "Category", value: categoryName },
                { label: "Status", value: product.status === "active" ? "Active" : "Inactive" },
                { label: "SKU", value: product.sku ?? "N/A" },
              ].map((row, i, arr) => (
                <View
                  key={row.label}
                  style={[
                    styles.detailRow,
                    i < arr.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.backgroundElement,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {row.label}
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sales History */}
          <View>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              SALES HISTORY
            </Text>
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <View style={styles.chartBars}>
                {salesData.map((d, i) => {
                  const height = (d.units / maxSales) * 120;
                  const isLast = i === salesData.length - 1;
                  return (
                    <View key={i} style={styles.barWrapper}>
                      <Text
                        style={[
                          styles.barValue,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {d.units}
                      </Text>
                      <View
                        style={[
                          styles.bar,
                          {
                            height,
                            backgroundColor: isLast ? "#2563eb" : "#93c5fd",
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.barLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {d.day}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.chartCaption}>
                <Lucide name="trending-up" size={14} color="#16a34a" />
                <Text
                  style={[styles.captionText, { color: colors.textSecondary }]}
                >
                  Last 7 days: 28 units sold
                </Text>
              </View>
            </View>
          </View>

          {/* Stock History */}
          <View>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              STOCK HISTORY
            </Text>
            <View
              style={[styles.historyCard, { backgroundColor: colors.card }]}
            >
              {stockHistory.map((entry, i) => {
                const isPositive = entry.qty > 0;
                return (
                  <View
                    key={i}
                    style={[
                      styles.historyRow,
                      i < stockHistory.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.backgroundElement,
                      },
                    ]}
                  >
                    <View style={styles.historyLeft}>
                      <Text
                        style={[
                          styles.historyDate,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {entry.date}
                      </Text>
                      <Text
                        style={[styles.historyAction, { color: colors.text }]}
                      >
                        {entry.action}
                      </Text>
                      {entry.note ? (
                        <Text
                          style={[
                            styles.historyNote,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {entry.note}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.historyRight}>
                      <Text
                        style={[
                          styles.historyQty,
                          { color: isPositive ? "#16a34a" : "#dc2626" },
                        ]}
                      >
                        {isPositive ? "+" : ""}
                        {entry.qty}
                      </Text>
                      <Text
                        style={[
                          styles.historyBalance,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Bal: {entry.balance}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      <AdjustStockSheet
        visible={adjustVisible}
        onVisibleChange={setAdjustVisible}
        productId={id!}
        unitCost={product?.selling_price ?? 0}
      />
    </View>
  );
};

export default ProductDetails;

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 16, fontWeight: "500" },
  identityCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 15,
    gap: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 36,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#3b82f6" },
  productName: { fontSize: 16, fontWeight: "700" },
  productSku: { fontSize: 12, color: "#aaa", textTransform: "uppercase" },
  productPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3b82f6",
    marginTop: 2,
  },
  tagRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  tag: { borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: 12, fontWeight: "600" },
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  actionButtonText: { fontSize: 14, fontWeight: "600", color: "#3b82f6" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  detailsCard: { borderRadius: 14, padding: 4 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: "600" },
  chartCard: { borderRadius: 14, padding: 16 },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 160,
    gap: 8,
  },
  barWrapper: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barValue: { fontSize: 10, fontWeight: "500", marginBottom: 4 },
  bar: { width: "100%", borderRadius: 6, minHeight: 8 },
  barLabel: { fontSize: 10, fontWeight: "500", marginTop: 4 },
  chartCaption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  captionText: { fontSize: 12, fontWeight: "500" },
  historyCard: { borderRadius: 14, padding: 4 },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  historyLeft: { flex: 1, gap: 2 },
  historyDate: { fontSize: 12 },
  historyAction: { fontSize: 14, fontWeight: "600" },
  historyNote: { fontSize: 11, fontStyle: "italic" },
  historyRight: { alignItems: "flex-end", gap: 2 },
  historyQty: { fontSize: 14, fontWeight: "700" },
  historyBalance: { fontSize: 11 },
});
