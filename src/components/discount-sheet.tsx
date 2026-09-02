import { createDiscount, deleteDiscount, updateDiscount } from "@/api/discount";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Discount } from "@/types/discount";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  discount?: Discount | null;
};

const DISCOUNT_TYPES = [
  { key: "percentage", label: "% Off", icon: "percent", color: "#3b82f6" },
  { key: "fixed_amount", label: "₦ Off", icon: "banknote", color: "#10b981" },
  { key: "buy_x_get_y", label: "Buy X Get Y", icon: "gift", color: "#a855f7" },
];

const SCOPE_OPTIONS = [
  { key: "all", label: "All Items" },
  { key: "specific_products", label: "Specific Products" },
  { key: "specific_categories", label: "Specific Categories" },
];

const DiscountSheet = ({ visible, onVisibleChange, discount }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();
  const isEditing = !!discount;

  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [value, setValue] = useState("");
  const [buyXGetYFreeQty, setBuyXGetYFreeQty] = useState("1");
  const [scope, setScope] = useState("all");
  const [minOrder, setMinOrder] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (discount) {
      setName(discount.name);
      setDiscountType(discount.discount_type);
      setValue(String(discount.value));
      setBuyXGetYFreeQty(String(discount.buy_x_get_y_free_qty || 1));
      setScope(discount.scope);
      setMinOrder(discount.min_order > 0 ? String(discount.min_order) : "");
    } else {
      reset();
    }
  }, [discount, visible]);

  const { mutate: saveDiscount, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        discount_type: discountType as any,
        value: parseFloat(value) || 0,
        buy_x_get_y_free_qty: parseInt(buyXGetYFreeQty) || 0,
        scope: scope as any,
        min_order: parseFloat(minOrder) || 0,
        is_active: true,
      };
      return discount
        ? updateDiscount(discount.id, payload)
        : createDiscount(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      onVisibleChange(false);
      reset();
    },
  });

  const { mutate: removeDiscount, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteDiscount(discount!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      onVisibleChange(false);
      reset();
    },
  });

  const reset = () => {
    setName("");
    setDiscountType("percentage");
    setValue("");
    setBuyXGetYFreeQty("1");
    setScope("all");
    setMinOrder("");
    setErrors({});
    setShowDeleteConfirm(false);
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!value || parseFloat(value) <= 0) newErrors.value = "Enter a valid value";
    if (discountType === "buy_x_get_y" && (!buyXGetYFreeQty || parseInt(buyXGetYFreeQty) <= 0)) {
      newErrors.buyXGetYFreeQty = "Enter free quantity";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    saveDiscount();
  };

  const canSubmit = !isPending;

  return (
    <AppBottomSheet
      snapPoints={["80%", "95%"]}
      visible={visible}
      onVisibleChange={(v) => {
        if (!v) reset();
        onVisibleChange(v);
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? "Edit Promotion" : "New Promotion"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Create a discount for your customers
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Discount Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Discount Type
          </Text>
          <View style={styles.typeRow}>
            {DISCOUNT_TYPES.map((t) => {
              const isActive = discountType === t.key;
              return (
                <Pressable
                  key={t.key}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: isActive ? t.color : colors.backgroundElement,
                      borderColor: isActive ? t.color : "transparent",
                    },
                  ]}
                  onPress={() => setDiscountType(t.key)}
                >
                  <Lucide
                    name={t.icon as any}
                    size={14}
                    color={isActive ? "#fff" : t.color}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: isActive ? "#fff" : t.color },
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Details
          </Text>
          <AppTextInput
            placeholder="Promotion name"
            value={name}
            onChangeText={setName}
            leftIcon="tag"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Value */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {discountType === "percentage"
              ? "Percentage"
              : discountType === "fixed_amount"
                ? "Amount"
                : "Buy Qty (pay for)"}
          </Text>
          <AppTextInput
            placeholder={
              discountType === "percentage"
                ? "e.g. 10"
                : discountType === "fixed_amount"
                  ? "e.g. 500"
                  : "e.g. 2"
            }
            value={value}
            onChangeText={setValue}
            leftIcon={discountType === "percentage" ? "percent" : "banknote"}
            keyboardType="numeric"
          />
          {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}

          {discountType === "buy_x_get_y" && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Free Quantity
              </Text>
              <AppTextInput
                placeholder="e.g. 1"
                value={buyXGetYFreeQty}
                onChangeText={setBuyXGetYFreeQty}
                leftIcon="gift"
                keyboardType="numeric"
              />
              {errors.buyXGetYFreeQty && (
                <Text style={styles.errorText}>{errors.buyXGetYFreeQty}</Text>
              )}
            </>
          )}
        </View>

        {/* Scope */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Applies To
          </Text>
          <View style={styles.chipRow}>
            {SCOPE_OPTIONS.map((s) => {
              const isActive = scope === s.key;
              return (
                <Pressable
                  key={s.key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isActive ? colors.buttonPrimary : colors.backgroundElement,
                    },
                  ]}
                  onPress={() => setScope(s.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isActive ? "#fff" : colors.textSecondary },
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Min Order */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Minimum Order (optional)
          </Text>
          <AppTextInput
            placeholder="0 = no minimum"
            value={minOrder}
            onChangeText={setMinOrder}
            leftIcon="shopping-cart"
            keyboardType="numeric"
          />
        </View>
      </ScrollView>

      <Pressable
        style={[
          styles.saveBtn,
          { backgroundColor: colors.buttonPrimary, opacity: canSubmit ? 1 : 0.5 },
        ]}
        disabled={!canSubmit}
        onPress={handleSave}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Lucide name={isEditing ? "check" : "plus"} size={18} color="#fff" />
            <Text style={styles.saveBtnText}>
              {isEditing ? "Save Changes" : "Create Promotion"}
            </Text>
          </>
        )}
      </Pressable>

      {isEditing && (
        <>
          {showDeleteConfirm ? (
            <View style={styles.deleteConfirm}>
              <Text style={[styles.deleteConfirmText, { color: colors.text }]}>
                Delete this promotion?
              </Text>
              <View style={styles.deleteConfirmRow}>
                <Pressable
                  style={[styles.deleteCancelBtn, { backgroundColor: colors.backgroundElement }]}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={[styles.deleteCancelText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.deleteConfirmBtn, { backgroundColor: "#ef4444" }]}
                  onPress={() => removeDiscount()}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.deleteConfirmBtnText}>Delete</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={[styles.deleteBtn, { borderColor: "#ef4444" }]}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Lucide name="trash-2" size={16} color="#ef4444" />
              <Text style={styles.deleteBtnText}>Delete Promotion</Text>
            </Pressable>
          )}
        </>
      )}
    </AppBottomSheet>
  );
};

export default DiscountSheet;

const styles = StyleSheet.create({
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  content: { paddingBottom: 8 },
  section: { gap: 10, marginBottom: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  typeBtnText: { fontSize: 13, fontWeight: "700" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  errorText: { fontSize: 12, color: "#DC2626", marginTop: -4 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 16,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 1,
  },
  deleteBtnText: { color: "#ef4444", fontSize: 15, fontWeight: "600" },
  deleteConfirm: { marginTop: 12, gap: 10 },
  deleteConfirmText: { fontSize: 14, textAlign: "center" },
  deleteConfirmRow: { flexDirection: "row", gap: 10 },
  deleteCancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  deleteCancelText: { fontSize: 14, fontWeight: "600" },
  deleteConfirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  deleteConfirmBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
