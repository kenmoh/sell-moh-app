import { fetchStoreDetails } from "@/api/store";
import StoreSheet from "@/components/store-sheet";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const StoreDetailScreen = () => {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const [sheetVisible, setSheetVisible] = useState(false);

  const {
    data: details,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["store-details", storeId],
    queryFn: () => fetchStoreDetails(storeId!),
    enabled: !!storeId,
  });

  const handleEdit = useCallback(() => {
    setSheetVisible(true);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!details || !details.store) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Store not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { store, products, categories, stats } = details;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={[
              styles.backBtn,
              { backgroundColor: colors.backgroundElement },
            ]}
            onPress={() => router.back()}
          >
            <Lucide name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {store.name}
            </Text>
            <View style={styles.headerBadges}>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor: store.is_warehouse
                      ? "rgba(168,85,247,0.12)"
                      : "rgba(59,130,246,0.12)",
                  },
                ]}
              >
                <Lucide
                  name={store.is_warehouse ? "warehouse" : "store"}
                  size={12}
                  color={store.is_warehouse ? "#a855f7" : "#3b82f6"}
                />
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: store.is_warehouse ? "#a855f7" : "#3b82f6" },
                  ]}
                >
                  {store.is_warehouse ? "Warehouse" : "Retail"}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      store.status === "active"
                        ? "rgba(16,185,129,0.12)"
                        : "rgba(239,68,68,0.12)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: store.status === "active" ? "#10b981" : "#ef4444",
                    },
                  ]}
                >
                  {store.status}
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            style={[styles.editBtn, { backgroundColor: colors.backgroundElement }]}
            onPress={handleEdit}
          >
            <Lucide name="pencil" size={18} color={colors.text} />
          </Pressable>
        </View>

        {/* Address */}
        {store.address && (
          <View style={styles.addressRow}>
            <Lucide name="map-pin" size={14} color={colors.textSecondary} />
            <Text style={[styles.addressText, { color: colors.textSecondary }]}>
              {store.address}
            </Text>
          </View>
        )}

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#282b32" : "#eef0f4",
                },
              ]}
            >
              <View style={[styles.statIcon, { backgroundColor: "rgba(16,185,129,0.12)" }]}>
                <Lucide name="dollar-sign" size={14} color="#10b981" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Revenue
              </Text>
              <Text style={[styles.statValue, { color: "#10b981" }]}>
                ₦{stats.revenue.toLocaleString()}
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#282b32" : "#eef0f4",
                },
              ]}
            >
              <View style={[styles.statIcon, { backgroundColor: "rgba(59,130,246,0.12)" }]}>
                <Lucide name="shopping-bag" size={14} color="#3b82f6" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Sales
              </Text>
              <Text style={[styles.statValue, { color: "#3b82f6" }]}>
                {stats.sales_count}
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#282b32" : "#eef0f4",
                },
              ]}
            >
              <View style={[styles.statIcon, { backgroundColor: "rgba(168,85,247,0.12)" }]}>
                <Lucide name="trending-up" size={14} color="#a855f7" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Avg Order
              </Text>
              <Text style={[styles.statValue, { color: "#a855f7" }]}>
                ₦{stats.avg_order_value.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Inventory Health */}
        {stats?.inventory_health && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Inventory Health
            </Text>
            <View style={styles.healthRow}>
              <View
                style={[
                  styles.healthStat,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? "#282b32" : "#eef0f4",
                  },
                ]}
              >
                <Text style={[styles.healthValue, { color: colors.text }]}>
                  {stats.inventory_health.total_products}
                </Text>
                <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>
                  Total
                </Text>
              </View>
              <View
                style={[
                  styles.healthStat,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? "#282b32" : "#eef0f4",
                  },
                ]}
              >
                <Text style={[styles.healthValue, { color: "#f59e0b" }]}>
                  {stats.inventory_health.low_stock}
                </Text>
                <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>
                  Low Stock
                </Text>
              </View>
              <View
                style={[
                  styles.healthStat,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? "#282b32" : "#eef0f4",
                  },
                ]}
              >
                <Text style={[styles.healthValue, { color: "#ef4444" }]}>
                  {stats.inventory_health.out_of_stock}
                </Text>
                <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>
                  Out of Stock
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Categories ({categories.length})
            </Text>
            <View style={styles.chipRow}>
              {categories.map((cat) => (
                <View
                  key={cat.id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.backgroundElement },
                  ]}
                >
                  <Text style={[styles.chipText, { color: colors.text }]}>
                    {cat.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Products */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Products ({products.length})
          </Text>
          {products.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#282b32" : "#eef0f4",
                },
              ]}
            >
              <Lucide name="package" size={24} color={colors.textSecondary} />
              <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>
                No products in this store yet
              </Text>
            </View>
          ) : (
            products.map((product) => (
              <View
                key={product.id}
                style={[
                  styles.productCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? "#282b32" : "#eef0f4",
                  },
                ]}
              >
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.text }]}>
                      {product.name}
                    </Text>
                    {product.sku && (
                      <Text style={[styles.productSku, { color: colors.textSecondary }]}>
                        {product.sku}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.productPrice, { color: colors.text }]}>
                    ₦{product.selling_price.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.productFooter}>
                  <View style={styles.stockRow}>
                    <View
                      style={[
                        styles.stockDot,
                        {
                          backgroundColor:
                            product.available <= 0
                              ? "#ef4444"
                              : product.available < 5
                                ? "#f59e0b"
                                : "#10b981",
                        },
                      ]}
                    />
                    <Text style={[styles.stockText, { color: colors.textSecondary }]}>
                      {product.available} available
                    </Text>
                  </View>
                  <View style={styles.stockDetails}>
                    <Text style={[styles.stockDetail, { color: colors.textSecondary }]}>
                      Qty: {product.qty}
                    </Text>
                    {product.reserved_qty > 0 && (
                      <Text style={[styles.stockDetail, { color: "#f59e0b" }]}>
                        Reserved: {product.reserved_qty}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Top Products */}
        {stats?.top_products && stats.top_products.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Top Products
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#282b32" : "#eef0f4",
                },
              ]}
            >
              {stats.top_products.slice(0, 5).map((tp, idx) => (
                <View
                  key={tp.product_id}
                  style={[
                    styles.topProductItem,
                    idx < Math.min(stats.top_products.length, 5) - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: isDark ? "#282b32" : "#eef0f4",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.rankBadge,
                      {
                        backgroundColor:
                          idx === 0
                            ? "rgba(245,158,11,0.12)"
                            : idx === 1
                              ? "rgba(156,163,175,0.12)"
                              : colors.backgroundElement,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankText,
                        {
                          color:
                            idx === 0
                              ? "#f59e0b"
                              : idx === 1
                                ? "#9ca3af"
                                : colors.textSecondary,
                        },
                      ]}
                    >
                      #{idx + 1}
                    </Text>
                  </View>
                  <View style={styles.topProductInfo}>
                    <Text style={[styles.topProductName, { color: colors.text }]}>
                      {tp.product_name}
                    </Text>
                    <Text style={[styles.topProductQty, { color: colors.textSecondary }]}>
                      {tp.total_qty} sold
                    </Text>
                  </View>
                  <Text style={[styles.topProductRevenue, { color: "#10b981" }]}>
                    ₦{tp.total_revenue.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <StoreSheet
        visible={sheetVisible}
        onVisibleChange={setSheetVisible}
        store={store}
      />
    </SafeAreaView>
  );
};

export default StoreDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 15, fontWeight: "500" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerBadges: { flexDirection: "row", gap: 6, marginTop: 4 },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  typeBadgeText: { fontSize: 11, fontWeight: "600" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addressText: { fontSize: 13 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 4,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statLabel: { fontSize: 11, fontWeight: "600" },
  statValue: { fontSize: 15, fontWeight: "800" },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  healthRow: { flexDirection: "row", gap: 10 },
  healthStat: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  healthValue: { fontSize: 20, fontWeight: "800" },
  healthLabel: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 8,
  },
  emptyCardText: { fontSize: 14, fontWeight: "500" },
  productCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productInfo: { flex: 1, marginRight: 8 },
  productName: { fontSize: 15, fontWeight: "700" },
  productSku: { fontSize: 12, marginTop: 2 },
  productPrice: { fontSize: 15, fontWeight: "800" },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  stockRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 13, fontWeight: "500" },
  stockDetails: { flexDirection: "row", gap: 10 },
  stockDetail: { fontSize: 12, fontWeight: "500" },
  topProductItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 12, fontWeight: "800" },
  topProductInfo: { flex: 1 },
  topProductName: { fontSize: 14, fontWeight: "600" },
  topProductQty: { fontSize: 12, marginTop: 2 },
  topProductRevenue: { fontSize: 14, fontWeight: "800" },
});
