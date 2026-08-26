import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Host, Switch } from "@expo/ui";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BTN_WIDTH = Dimensions.get("screen").width * 0.9;

const AddProduct = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const params = useLocalSearchParams<{
    name?: string;
    sku?: string;
    category?: string;
    price?: string;
    stockQty?: string;
    lowStockAlert?: string;
    description?: string;
  }>();
  const isEditing = Boolean(params.name);

  const [name, setName] = useState(params.name ?? "");
  const [sku, setSku] = useState(params.sku ?? "");
  const [category, setCategory] = useState(params.category ?? "");
  const [price, setPrice] = useState(params.price ?? "");
  const [stockQty, setStockQty] = useState(params.stockQty ?? "");
  const [lowStockAlert, setLowStockAlert] = useState(
    params.lowStockAlert ?? "",
  );
  const [trackInventory, setTrackInventory] = useState(true);
  const [description, setDescription] = useState(params.description ?? "");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetView, setSheetView] = useState<"list" | "add">("list");

  const openCategorySheet = () => {
    setSheetView("list");
    setSheetVisible(true);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add Product",
          headerShown: true,
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              onPress={openCategorySheet}
              style={[
                {
                  flexDirection: "row",
                  gap: 5,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Lucide name="tags" size={16} color={colors.text} />
              <Text style={{ color: colors.textSecondary }}>Add Category</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          marginTop: 20,

          gap: 20,
          backgroundColor: colors.background,
        }}
      >
        {/* Photo Upload */}
        {/* <View>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            PRODUCT INFO
          </Text>
          <Pressable
            style={[
              styles.photoUpload,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.backgroundSelected,
              },
            ]}
          >
            <Lucide name="camera" size={28} color="#3b82f6" />
            <Text style={[styles.photoLabel, { color: colors.textSecondary }]}>
              Add Photo
            </Text>
          </Pressable>
        </View> */}

        {/* Product Name */}
        <AppTextInput
          leftIcon="tag"
          placeholder="Product name"
          value={name}
          onChangeText={setName}
        />

        {/* SKU */}
        <AppTextInput
          leftIcon="barcode"
          placeholder="SKU"
          value={sku}
          onChangeText={setSku}
          rightIcon="scan"
          onRightIconPress={() => {}}
        />

        {/* Category */}
        <AppTextInput
          leftIcon="tag"
          placeholder="Category"
          value={category}
          onChangeText={setCategory}
          rightIcon="chevron-down"
          onRightIconPress={() => {}}
        />

        {/* Price */}
        <AppTextInput
          leftIcon="banknote"
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        {/* Stock Section */}
        <View>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            STOCK
          </Text>
          <View style={{ gap: 14 }}>
            <AppTextInput
              leftIcon="package"
              placeholder="Stock quantity"
              value={stockQty}
              onChangeText={setStockQty}
              keyboardType="numeric"
            />
            <AppTextInput
              leftIcon="alert-triangle"
              placeholder="Low stock alert"
              value={lowStockAlert}
              onChangeText={setLowStockAlert}
              keyboardType="numeric"
            />
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Lucide
                  name="bar-chart-2"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  Track Inventory
                </Text>
              </View>
              <Host matchContents>
                <Switch
                  value={trackInventory}
                  onValueChange={setTrackInventory}
                />
              </Host>
            </View>
          </View>
        </View>

        {/* Additional Section */}
        <View>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            ADDITIONAL
          </Text>
          <View style={styles.textAreaWrapper}>
            <AppTextInput
              placeholder="Product description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>
        </View>

        {/* Save CTA */}
        <Pressable style={styles.saveButton}>
          <Lucide name="save" size={18} color="#fff" />
          <Text style={styles.saveButtonText}>
            {isEditing ? "Update Product" : "Save Product"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Add Category Bottom Sheet */}
      <AppBottomSheet visible={sheetVisible} onVisibleChange={setSheetVisible}>
        <Text>Kenmoh</Text>
      </AppBottomSheet>
    </>
  );
};

export default AddProduct;

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
  saveLink: { color: "#3b82f6", fontSize: 15, fontWeight: "600" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  photoUpload: {
    height: 160,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoLabel: { fontSize: 13, fontWeight: "500" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleLabel: { fontSize: 15, fontWeight: "500" },
  textAreaWrapper: { position: "relative" },
  expandButton: {
    position: "absolute",
    bottom: 14,
    left: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 50,
    paddingVertical: 15,
    gap: 8,
    marginTop: 4,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
