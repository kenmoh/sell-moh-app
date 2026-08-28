import { adjustProduct } from "@/api/inventory";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { AdjustProduct } from "@/types/product";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { z } from "zod";

const adjustSchema = z.object({
  qty_change: z.string().min(1, "Quantity is required"),
  unit_cost: z.string().min(1, "Unit cost is required"),
  reason: z.string().min(1, "Select a reason"),
  notes: z.string().optional(),
});

type AdjustField = keyof z.infer<typeof adjustSchema>;

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  productId: string;
  storeId?: string;
  unitCost?: number;
};

const reasons = [
  { label: "Restock", icon: "package-plus" as const },
  { label: "Return", icon: "rotate-ccw" as const },
  { label: "Correction", icon: "pencil" as const },
];

const AdjustStockSheet = ({
  visible,
  onVisibleChange,
  productId,
  storeId = "",
  unitCost = 0,
}: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState("");
  const [unitCostValue, setUnitCostValue] = useState(String(unitCost));
  const [selectedReason, setSelectedReason] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Partial<Record<AdjustField, string>>>(
    {},
  );

  useEffect(() => {
    setUnitCostValue(String(unitCost));
  }, [unitCost]);

  const { mutate: adjustMutation, isPending } = useMutation({
    mutationFn: (data: AdjustProduct) => adjustProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      onVisibleChange(false);
      reset();
    },
    onError: (error) => {
      console.error("Failed to adjust stock", error);
    },
  });

  const reset = () => {
    setQuantity("");
    setUnitCostValue(String(unitCost));
    setSelectedReason("");
    setNote("");
    setErrors({});
  };

  const parsedQty = parseInt(quantity || "0", 10);

  const handleConfirm = () => {
    const result = adjustSchema.safeParse({
      qty_change: quantity,
      unit_cost: unitCostValue,
      reason: selectedReason,
      notes: note || undefined,
    });

    if (!result.success) {
      const fieldErrors: Partial<Record<AdjustField, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as AdjustField;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    adjustMutation({
      product_id: productId,
      reason: result.data.reason,
      qty_change: parsedQty,
      unit_cost: parseFloat(result.data.unit_cost) || 0,
      notes: result.data.notes || null,
      ...(storeId ? { store_id: storeId } : {}),
    });
  };

  return (
    <AppBottomSheet
      snapPoints={["75%", "85%"]}
      visible={visible}
      onVisibleChange={(v) => {
        if (!v) reset();
        onVisibleChange(v);
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Adjust Stock
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Add or remove stock for this product
        </Text>
      </View>

      {/* Quantity */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Quantity
        </Text>
        <View style={styles.quantityRow}>
          <Pressable
            style={[
              styles.stepButton,
              { backgroundColor: colors.backgroundElement },
            ]}
            onPress={() => {
              if (parsedQty > 0) setQuantity(String(parsedQty - 1));
            }}
          >
            <Lucide name="minus" size={16} color={colors.text} />
          </Pressable>
          <TextInput
            style={[
              styles.quantityInput,
              {
                color: colors.text,
                backgroundColor: colors.backgroundElement,
                borderColor: colors.backgroundElement,
              },
            ]}
            keyboardType="number-pad"
            value={quantity}
            onChangeText={(t) => {
              const filtered = t.replace(/[^0-9]/g, "");
              setQuantity(filtered);
            }}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
          />
          <Pressable
            style={[
              styles.stepButton,
              { backgroundColor: colors.backgroundElement },
            ]}
            onPress={() => setQuantity(String(parsedQty + 1))}
          >
            <Lucide name="plus" size={16} color={colors.text} />
          </Pressable>
        </View>
        {errors.qty_change && (
          <Text style={styles.errorText}>{errors.qty_change}</Text>
        )}
      </View>

      {/* Reason */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Reason
        </Text>
        <View style={styles.chipRow}>
          {reasons.map(({ label, icon }) => {
            const isSelected = selectedReason === label;
            return (
              <Pressable
                key={label}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? colors.buttonPrimary
                      : colors.backgroundElement,
                    borderColor: isSelected
                      ? colors.buttonPrimary
                      : colors.backgroundSelected,
                  },
                ]}
                onPress={() => setSelectedReason(isSelected ? "" : label)}
              >
                <Lucide
                  name={icon}
                  size={14}
                  color={isSelected ? "#fff" : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? "#fff" : colors.text },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.reason && (
          <Text style={styles.errorText}>{errors.reason}</Text>
        )}
      </View>

      {/* Note */}
      <View style={styles.section}>
        <AppTextInput
          placeholder="Note (optional)"
          value={note}
          onChangeText={setNote}
          leftIcon="sticky-note"
          autoCapitalize="sentences"
        />
      </View>

      {/* Confirm */}
      <Pressable
        style={[
          styles.confirmButton,
          {
            backgroundColor: parsedQty > 0 && !isPending
              ? colors.buttonPrimary
              : colors.backgroundSelected,
            opacity: isPending ? 0.5 : 1,
          },
        ]}
        disabled={parsedQty === 0 || isPending}
        onPress={handleConfirm}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Lucide name="package-plus" size={18} color="#fff" />
            <Text style={styles.confirmText}>Confirm Adjustment</Text>
          </>
        )}
      </Pressable>
    </AppBottomSheet>
  );
};

export default AdjustStockSheet;

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    gap: 10,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityInput: {
    width: 72,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: -6,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 16,
    marginTop: 4,
  },
  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
