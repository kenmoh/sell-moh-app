import AdjustStockSheet from "@/components/adjust-stock-sheet";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
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

  const stock = 48;
  const maxStock = 60;
  const stockPercent = (stock / maxStock) * 100;

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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>C</Text>
          </View>
          <Text style={[styles.productName, { color: colors.text }]}>
            Coca-Cola 50cl
          </Text>
          <Text style={[styles.productSku, { color: colors.textSecondary }]}>
            SKU-001
          </Text>
          <Text style={styles.productPrice}>₦500</Text>
          <View style={styles.tagRow}>
            <View
              style={[
                styles.tag,
                { backgroundColor: "rgba(22, 163, 74, 0.1)" },
              ]}
            >
              <Text style={[styles.tagText, { color: "#16a34a" }]}>
                {stock} In Stock
              </Text>
            </View>
            <View
              style={[
                styles.tag,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                Beverages
              </Text>
            </View>
            <View
              style={[
                styles.tag,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                Each
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
                pathname: "/(tabs)/(more)/add-product",
                params: {
                  name: "Coca-Cola 50cl",
                  sku: "SKU-001",
                  category: "Beverages",
                  price: "500",
                  stockQty: "48",
                  lowStockAlert: "10",
                  description:
                    "Refreshing Coca-Cola 50cl bottle. Best served chilled. Popular beverage in Nigerian retail.",
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
          {/* Stock Overview */}
          <View>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              STOCK OVERVIEW
            </Text>
            <View
              style={[
                styles.stockBarBg,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <View
                style={[
                  styles.stockBarFill,
                  { width: `${stockPercent}%`, backgroundColor: "#16a34a" },
                ]}
              />
            </View>
            <View style={styles.stockLabels}>
              <Text style={[styles.stockLabel, { color: colors.text }]}>
                Current: {stock}
              </Text>
              <Text
                style={[styles.stockLabel, { color: colors.textSecondary }]}
              >
                Alert: 10
              </Text>
            </View>
          </View>

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
                { label: "Category", value: "Beverages" },
                { label: "Unit", value: "Each" },
                { label: "Low Stock Alert", value: "10" },
                { label: "Last Restocked", value: "Dec 10, 2024" },
                { label: "Created", value: "Nov 1, 2024" },
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
      />
    </View>
  );
};

export default ProductDetails;

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
  identityCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#3b82f6" },
  productName: { fontSize: 20, fontWeight: "700" },
  productSku: { fontSize: 13 },
  productPrice: {
    fontSize: 28,
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
  stockBarBg: { height: 10, borderRadius: 5, overflow: "hidden" },
  stockBarFill: { height: "100%", borderRadius: 5 },
  stockLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  stockLabel: { fontSize: 12, fontWeight: "500" },
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
