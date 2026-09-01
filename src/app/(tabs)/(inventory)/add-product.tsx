import { createProduct, fetchTenantCategories } from "@/api/inventory";
import { fetchTenantStores } from "@/api/store";
import AddCategorySheet from "@/components/add-category-sheet";
import AppBottomSheet from "@/components/bottom-sheet";
import CategoryActionsSheet from "@/components/category-actions-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, router, useLocalSearchParams } from "expo-router";
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
import { z } from "zod";

const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  cost_price: z.string().min(1, "Cost price is required"),
  selling_price: z.string().min(1, "Selling price is required"),
  reorder_point: z.string().min(1, "Reorder point is required"),
  category_id: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  tax_rate: z.string().optional(),
});

type ProductField = keyof z.infer<typeof productSchema>;

type MetadataEntry = { key: string; value: string };

const AddProduct = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    sku?: string;
    category_id?: string;
    selling_price?: string;
    store_id?: string;
  }>();
  const isEditing = Boolean(params.id);

  const [name, setName] = useState(params.name ?? "");
  const [description, setDescription] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState(params.selling_price ?? "");
  const [unit, setUnit] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [reorderPoint, setReorderPoint] = useState("");
  const [trackInventory, setTrackInventory] = useState(true);
  const [categoryId, setCategoryId] = useState(params.category_id ?? "");
  const [metadata, setMetadata] = useState<MetadataEntry[]>([]);
  const [errors, setErrors] = useState<Partial<Record<ProductField, string>>>(
    {},
  );

  const [sheetVisible, setSheetVisible] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [storeSheetVisible, setStoreSheetVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
    description?: string;
  } | null>(null);
  const [storeId, setStoreId] = useState(params.store_id ?? "");

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchTenantCategories,
  });

  const { data: storesData } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchTenantStores,
  });

  const stores = storesData ?? [];

  const { mutate: createProductMutation, isPending } = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.back();
    },
    onError: (error) => {
      console.error("Failed to create product", error);
    },
  });

  const categories = categoriesData ?? [];

  const addMetadataField = () => {
    setMetadata((current) => [...current, { key: "", value: "" }]);
  };

  const updateMetadata = (
    index: number,
    field: "key" | "value",
    newValue: string,
  ) => {
    setMetadata((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: newValue } : item,
      ),
    );
  };

  const removeMetadataField = (index: number) => {
    setMetadata((current) => current.filter((_, i) => i !== index));
  };

  const buildMetadataObject = (): Record<string, string> | null => {
    const valid = metadata.filter((m) => m.key.trim() !== "");
    if (valid.length === 0) return null;
    const obj: Record<string, string> = {};
    valid.forEach((m) => {
      obj[m.key.trim()] = m.value.trim();
    });
    return obj;
  };

  const handleSubmit = () => {
    const result = productSchema.safeParse({
      name,
      cost_price: costPrice,
      selling_price: sellingPrice,
      reorder_point: reorderPoint,
      category_id: categoryId || undefined,
      description: description || undefined,
      unit: unit || undefined,
      tax_rate: taxRate || undefined,
    });

    if (!result.success) {
      const fieldErrors: Partial<Record<ProductField, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as ProductField;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    const payload = {
      name: result.data.name,
      cost_price: parseFloat(result.data.cost_price) || 0,
      selling_price: parseFloat(result.data.selling_price) || 0,
      reorder_point: parseInt(result.data.reorder_point, 10) || 0,
      category_id: result.data.category_id || null,
      description: result.data.description || null,
      unit: result.data.unit || null,
      tax_rate: result.data.tax_rate ? parseFloat(result.data.tax_rate) : null,
      metadata: buildMetadataObject(),
      store_id: storeId || null,
    };

    createProductMutation(payload);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? "Edit Product" : "Add Product",
          headerShown: true,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 20,
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Name */}
        <View style={styles.section}>
          <AppTextInput
            leftIcon="tag"
            placeholder="Product name"
            value={name}
            onChangeText={setName}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            DESCRIPTION
          </Text>
          <AppTextInput
            placeholder="Product description"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            PRICING
          </Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <AppTextInput
                leftIcon="banknote"
                placeholder="Cost price"
                value={costPrice}
                onChangeText={setCostPrice}
                keyboardType="decimal-pad"
              />
              {errors.cost_price && (
                <Text style={styles.errorText}>{errors.cost_price}</Text>
              )}
            </View>
            <View style={styles.halfField}>
              <AppTextInput
                leftIcon="banknote"
                placeholder="Selling price"
                value={sellingPrice}
                onChangeText={setSellingPrice}
                keyboardType="decimal-pad"
              />
              {errors.selling_price && (
                <Text style={styles.errorText}>{errors.selling_price}</Text>
              )}
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <AppTextInput
                leftIcon="percent"
                placeholder="Tax rate (%)"
                value={taxRate}
                onChangeText={setTaxRate}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfField}>
              <AppTextInput
                leftIcon="package"
                placeholder="Reorder point"
                value={reorderPoint}
                onChangeText={setReorderPoint}
                keyboardType="number-pad"
              />
              {errors.reorder_point && (
                <Text style={styles.errorText}>{errors.reorder_point}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Unit */}
        <View style={styles.section}>
          <AppTextInput
            leftIcon="ruler"
            placeholder="Unit (e.g. pcs, kg, litre)"
            value={unit}
            onChangeText={setUnit}
          />
        </View>

        {/* Store */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            STORE
          </Text>
          <Pressable
            style={[
              styles.selectorButton,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.backgroundSelected,
              },
            ]}
            onPress={() => setStoreSheetVisible(true)}
          >
            <Lucide name="store" size={16} color={colors.textSecondary} />
            <Text
              style={[
                styles.selectorText,
                { color: storeId ? colors.text : colors.textSecondary },
              ]}
            >
              {storeId
                ? stores.find((s) => s.id === storeId)?.name ?? "Selected Store"
                : "Select store"}
            </Text>
            <Lucide name="chevron-down" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              CATEGORY
            </Text>
            <Pressable
              onPress={() => setSheetVisible(true)}
              style={styles.addBtn}
            >
              <Lucide name="plus" size={14} color={colors.buttonPrimary} />
              <Text
                style={[styles.addBtnText, { color: colors.buttonPrimary }]}
              >
                Add
              </Text>
            </Pressable>
          </View>
          {categories.length > 0 && (
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Long press a category for more options
            </Text>
          )}
          {categories.length > 0 ? (
            <View style={styles.pills}>
              {categories.map((cat) => {
                const isActive = categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isActive
                          ? colors.buttonPrimary
                          : colors.backgroundElement,
                      },
                    ]}
                    onPress={() => setCategoryId(isActive ? "" : cat.id)}
                    onLongPress={() => {
                      setSelectedCategory({
                        id: cat.id,
                        name: cat.name,
                        description: cat.description,
                      });
                      setActionsVisible(true);
                    }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: isActive ? "#fff" : colors.text },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <AppTextInput
              leftIcon="tag"
              placeholder="Category"
              value={categoryId}
              onChangeText={setCategoryId}
            />
          )}
        </View>

        {/* Metadata */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              METADATA
            </Text>
            <Pressable onPress={addMetadataField} style={styles.addBtn}>
              <Lucide name="plus" size={14} color={colors.buttonPrimary} />
              <Text
                style={[styles.addBtnText, { color: colors.buttonPrimary }]}
              >
                Add field
              </Text>
            </Pressable>
          </View>
          {metadata.length === 0 && (
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Add custom key-value pairs for this product
            </Text>
          )}
          {metadata.map((item, index) => (
            <View key={index} style={styles.metadataRow}>
              <View style={styles.metadataField}>
                <AppTextInput
                  placeholder="Key"
                  value={item.key}
                  onChangeText={(v) => updateMetadata(index, "key", v)}
                />
              </View>
              <View style={styles.metadataField}>
                <AppTextInput
                  placeholder="Value"
                  value={item.value}
                  onChangeText={(v) => updateMetadata(index, "value", v)}
                />
              </View>
              <Pressable
                style={[
                  styles.removeBtn,
                  { backgroundColor: "rgba(220,38,38,0.08)" },
                ]}
                onPress={() => removeMetadataField(index)}
              >
                <Lucide name="x" size={16} color="#DC2626" />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Save */}
        <Pressable
          style={[styles.saveBtn, isPending && { opacity: 0.5 }]}
          disabled={isPending}
          onPress={handleSubmit}
        >
          <Lucide name="save" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>
            {isPending ? "Saving..." : isEditing ? "Update Product" : "Save Product"}
          </Text>
        </Pressable>
      </ScrollView>

      <AddCategorySheet
        visible={sheetVisible}
        onVisibleChange={setSheetVisible}
        onCreated={(createdName) => {
          const newCat = categories.find((c) => c.name === createdName);
          if (newCat) setCategoryId(newCat.id);
        }}
      />
      <CategoryActionsSheet
        visible={actionsVisible}
        onVisibleChange={setActionsVisible}
        category={selectedCategory}
      />
      <AppBottomSheet
        visible={storeSheetVisible}
        onVisibleChange={setStoreSheetVisible}
        snapPoints={["40%", "70%"]}
      >
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            Select Store
          </Text>
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            Choose a store for this product
          </Text>
        </View>
        {stores.length > 0 ? (
          <View style={styles.pills}>
            {stores.map((store) => {
              const isActive = storeId === store.id;
              return (
                <Pressable
                  key={store.id}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isActive
                        ? colors.buttonPrimary
                        : colors.backgroundElement,
                    },
                  ]}
                  onPress={() => {
                    setStoreId(isActive ? "" : store.id);
                    setStoreSheetVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: isActive ? "#fff" : colors.text },
                    ]}
                  >
                    {store.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No stores available
          </Text>
        )}
      </AppBottomSheet>
    </>
  );
};

export default AddProduct;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 18,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  headerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  headerActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  hintText: {
    fontSize: 11,
    fontStyle: "italic",
  },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
  },
  sheetHeader: {
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: -6,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  metadataField: {
    flex: 1,
  },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 50,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
