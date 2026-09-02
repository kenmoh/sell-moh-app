import { createCoupon, deleteCoupon, updateCoupon } from "@/api/discount";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Coupon } from "@/types/discount";
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
  coupon?: Coupon | null;
};

const CouponSheet = ({ visible, onVisibleChange, coupon }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();
  const isEditing = !!coupon;

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code);
      setDiscountType(coupon.discount_type);
      setValue(String(coupon.value));
      setMaxUses(coupon.max_uses > 0 ? String(coupon.max_uses) : "");
      setMinOrder(coupon.min_order > 0 ? String(coupon.min_order) : "");
    } else {
      reset();
    }
  }, [coupon, visible]);

  const { mutate: saveCoupon, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        code: code.toUpperCase().trim(),
        discount_type: discountType as any,
        value: parseFloat(value) || 0,
        max_uses: parseInt(maxUses) || 0,
        min_order: parseFloat(minOrder) || 0,
        is_active: true,
      };
      return coupon
        ? updateCoupon(coupon.id, payload)
        : createCoupon(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      onVisibleChange(false);
      reset();
    },
  });

  const { mutate: removeCoupon, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteCoupon(coupon!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      onVisibleChange(false);
      reset();
    },
  });

  const reset = () => {
    setCode("");
    setDiscountType("percentage");
    setValue("");
    setMaxUses("");
    setMinOrder("");
    setErrors({});
    setShowDeleteConfirm(false);
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!code.trim()) newErrors.code = "Code is required";
    if (!value || parseFloat(value) <= 0) newErrors.value = "Enter a valid value";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    saveCoupon();
  };

  const canSubmit = !isPending;

  return (
    <AppBottomSheet
      snapPoints={["75%", "90%"]}
      visible={visible}
      onVisibleChange={(v) => {
        if (!v) reset();
        onVisibleChange(v);
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? "Edit Coupon" : "New Coupon"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Create a code customers can apply at checkout
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Code */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Coupon Code
          </Text>
          <AppTextInput
            placeholder="e.g. SAVE10"
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            leftIcon="hash"
            autoCapitalize="characters"
          />
          {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
        </View>

        {/* Discount Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Type
          </Text>
          <View style={styles.typeRow}>
            <Pressable
              style={[
                styles.typeBtn,
                {
                  backgroundColor: discountType === "percentage" ? "#3b82f6" : colors.backgroundElement,
                },
              ]}
              onPress={() => setDiscountType("percentage")}
            >
              <Lucide
                name="percent"
                size={14}
                color={discountType === "percentage" ? "#fff" : "#3b82f6"}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  { color: discountType === "percentage" ? "#fff" : "#3b82f6" },
                ]}
              >
                % Off
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.typeBtn,
                {
                  backgroundColor: discountType === "fixed_amount" ? "#10b981" : colors.backgroundElement,
                },
              ]}
              onPress={() => setDiscountType("fixed_amount")}
            >
              <Lucide
                name="banknote"
                size={14}
                color={discountType === "fixed_amount" ? "#fff" : "#10b981"}
              />
              <Text
                style={[
                  styles.typeBtnText,
                  { color: discountType === "fixed_amount" ? "#fff" : "#10b981" },
                ]}
              >
                ₦ Off
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Value */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {discountType === "percentage" ? "Percentage" : "Amount"}
          </Text>
          <AppTextInput
            placeholder={discountType === "percentage" ? "e.g. 10" : "e.g. 500"}
            value={value}
            onChangeText={setValue}
            leftIcon={discountType === "percentage" ? "percent" : "banknote"}
            keyboardType="numeric"
          />
          {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}
        </View>

        {/* Limits */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Limits (optional)
          </Text>
          <AppTextInput
            placeholder="Max uses (0 = unlimited)"
            value={maxUses}
            onChangeText={setMaxUses}
            leftIcon="repeat"
            keyboardType="numeric"
          />
          <AppTextInput
            placeholder="Min order amount (0 = no min)"
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
              {isEditing ? "Save Changes" : "Create Coupon"}
            </Text>
          </>
        )}
      </Pressable>

      {isEditing && (
        <>
          {showDeleteConfirm ? (
            <View style={styles.deleteConfirm}>
              <Text style={[styles.deleteConfirmText, { color: colors.text }]}>
                Delete this coupon?
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
                  onPress={() => removeCoupon()}
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
              <Text style={styles.deleteBtnText}>Delete Coupon</Text>
            </Pressable>
          )}
        </>
      )}
    </AppBottomSheet>
  );
};

export default CouponSheet;

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
  },
  typeBtnText: { fontSize: 13, fontWeight: "700" },
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
