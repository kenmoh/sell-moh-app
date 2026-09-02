import {
  fetchTenantCategories,
  getProductById,
} from "@/api/inventory";
import { BASE_URL } from "@/api/client";
import { fetchTenantStores } from "@/api/store";
import AppBottomSheet from "@/components/bottom-sheet";
import AdjustStockSheet from "@/components/adjust-stock-sheet";
import { Colors } from "@/constants/theme";
import { useSession } from "@/lib/ctx";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as SecureStore from "expo-secure-store";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const { user } = useSession();
  const [storeId, setStoreId] = useState(user?.store_id ?? "");
  const [adjustVisible, setAdjustVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrSize, setQrSize] = useState<"small" | "medium" | "large">("large");
  const [qrBoxSize, setQrBoxSize] = useState("");

  const { data: storesData } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchTenantStores,
  });

  const stores = storesData ?? [];

  useEffect(() => {
    if (!storeId && stores.length > 0) {
      setStoreId(stores[0].id);
    }
  }, [storeId, stores]);

  const { data: product, isPending: isLoadingProduct } = useQuery({
    queryKey: ["product", id, storeId],
    queryFn: () => getProductById(id!, storeId),
    enabled: !!id && !!storeId,
  });

  const { mutate: downloadQR, isPending: isDownloading } = useMutation({
    mutationFn: async () => {
      const boxSize = qrBoxSize ? Number(qrBoxSize) : undefined;
      const query = new URLSearchParams();
      if (qrSize) query.append("size", qrSize);
      if (boxSize) query.append("box_size", String(boxSize));
      const qs = query.toString();
      const url = `${BASE_URL}/inventory/${storeId}/products/${id}/qr${qs ? `?${qs}` : ""}`;
      const session = JSON.parse(SecureStore.getItem("session") ?? "{}");
      const fileUri = FileSystem.cacheDirectory + `${product?.name ?? "qr"}_qr.png`;
      await FileSystem.downloadAsync(url, fileUri, {
        headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
      });
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") throw new Error("Permission denied");
      await MediaLibrary.saveToLibraryAsync(fileUri);
      return true;
    },
    onSuccess: () => {
      setQrVisible(false);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", storeId],
    queryFn: () => fetchTenantCategories(storeId),
    enabled: !!storeId,
  });

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
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
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
                {product.category ?? "Uncategorized"}
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
                  category_id: product.category ?? "",
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
                {
                  label: "Category",
                  value: product.category ?? "Uncategorized",
                },
                {
                  label: "Status",
                  value: product.status === "active" ? "Active" : "Inactive",
                },
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
                    {row.value!}
                  </Text>
                </View>
              ))}
              <Pressable
                style={[
                  styles.tag,
                  {
                    backgroundColor: "rgba(59,130,246,0.1)",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginVertical: 10,
                    height: 45,
                    alignSelf: "center",
                    width: "95%",
                  },
                ]}
                onPress={() => setQrVisible(true)}
              >
                <Lucide name="qr-code" size={12} color="#3b82f6" />
                <Text style={[styles.tagText, { color: "#3b82f6" }]}>
                  Download QR Code
                </Text>
              </Pressable>
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

      <AppBottomSheet
        visible={qrVisible}
        onVisibleChange={setQrVisible}
        snapPoints={["32%"]}
      >
        <Text style={[styles.sheetTitle, { color: colors.text }]}>
          QR Code Size
        </Text>
        <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>
          Size
        </Text>
        <View style={styles.pillRow}>
          {(["small", "medium", "large"] as const).map((s) => {
            const active = qrSize === s;
            const label = s === "small" ? "Small (320px)" : s === "medium" ? "Medium (530px)" : "Large (1060px)";
            return (
              <Pressable
                key={s}
                style={[
                  styles.pill,
                  {
                    backgroundColor: active ? "rgba(59,130,246,0.1)" : colors.backgroundElement,
                    borderColor: active ? "#3b82f6" : "transparent",
                  },
                ]}
                onPress={() => setQrSize(s)}
              >
                <Text style={[styles.pillText, { color: active ? "#3b82f6" : colors.textSecondary }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>
          Box Size (1-30, optional)
        </Text>
        <TextInput
          style={[styles.sheetInput, { color: colors.text, borderColor: colors.backgroundElement }]}
          value={qrBoxSize}
          onChangeText={setQrBoxSize}
          keyboardType="number-pad"
          placeholder="Leave empty to use size default"
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={[styles.sheetHint, { color: colors.textSecondary }]}>
          Box size (1-30) overrides the selected size
        </Text>
        <Pressable
          style={[
            styles.sheetButton,
            { backgroundColor: colors.buttonPrimary },
          ]}
          onPress={() => downloadQR()}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sheetButtonText}>
              Download
            </Text>
          )}
        </Pressable>
      </AppBottomSheet>
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
    width: 50,
    height: 50,
    borderRadius: 36,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#3b82f6" },
  productName: { fontSize: 12, fontWeight: "700" },
  productSku: { fontSize: 10, color: "#aaa", textTransform: "uppercase" },
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
  sheetTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  sheetLabel: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  pillRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: "600" },
  sheetInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 4,
  },
  sheetHint: { fontSize: 11, marginBottom: 14 },
  sheetButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  sheetButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
