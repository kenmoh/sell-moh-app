import { distributeStock } from "@/api/inventory";
import { fetchTenantStores } from "@/api/store";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { StoreDistributePayload } from "@/types/product";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { z } from "zod";

const schema = z.object({
  to_store_id: z.string().min(1, "Select a destination store"),
  qty: z.string().min(1, "Quantity is required"),
  notes: z.string().optional(),
});

type Field = keyof z.infer<typeof schema>;

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  productId: string;
  productName: string;
  currentStoreId: string;
};

export default function TransferSheet({
  visible,
  onVisibleChange,
  productId,
  productName,
  currentStoreId,
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();

  const [toStoreId, setToStoreId] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const { data: storesData } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchTenantStores,
  });
  const stores = storesData ?? [];
  const otherStores = stores.filter((s) => s.id !== currentStoreId);

  useEffect(() => {
    if (visible) {
      setToStoreId("");
      setQty("");
      setNotes("");
      setErrors({});
    }
  }, [visible]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: StoreDistributePayload) =>
      distributeStock(currentStoreId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-balances"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onVisibleChange(false);
    },
    onError: (error: any) => {
      console.error("Transfer failed", error);
    },
  });

  const handleConfirm = () => {
    const result = schema.safeParse({ to_store_id: toStoreId, qty, notes });
    if (!result.success) {
      const errs: Partial<Record<Field, string>> = {};
      result.error.issues.forEach((i) => {
        errs[i.path[0] as Field] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    mutate({
      product_id: productId,
      to_store_id: result.data.to_store_id,
      qty: parseInt(result.data.qty, 10),
      notes: result.data.notes || null,
    });
  };

  const parsedQty = parseInt(qty || "0", 10) || 0;

  return (
    <AppBottomSheet
      snapPoints={["70%"]}
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Transfer Stock</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {productName}
        </Text>
      </View>

      {/* Destination store */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Transfer to
        </Text>
        {otherStores.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No other stores available
          </Text>
        ) : (
          <View style={styles.storeGrid}>
            {otherStores.map((store) => {
              const isActive = toStoreId === store.id;
              return (
                <Pressable
                  key={store.id}
                  style={[
                    styles.storeChip,
                    {
                      backgroundColor: isActive
                        ? "rgba(59,130,246,0.1)"
                        : colors.backgroundElement,
                      borderColor: isActive ? "#3b82f6" : "transparent",
                    },
                  ]}
                  onPress={() => setToStoreId(isActive ? "" : store.id)}
                >
                  <Text
                    style={[
                      styles.storeChipText,
                      { color: isActive ? "#3b82f6" : colors.text },
                    ]}
                  >
                    {store.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {errors.to_store_id && (
          <Text style={styles.error}>{errors.to_store_id}</Text>
        )}
      </View>

      {/* Quantity */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Quantity
        </Text>
        <AppTextInput
          value={qty}
          onChangeText={setQty}
          placeholder="Number of units"
          keyboardType="number-pad"
          leftIcon="package"
          error={errors.qty}
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <AppTextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Note (optional)"
          leftIcon="sticky-note"
        />
      </View>

      <Pressable
        style={[
          styles.confirmButton,
          {
            backgroundColor:
              parsedQty > 0 && toStoreId && !isPending
                ? colors.buttonPrimary
                : colors.backgroundSelected,
          },
        ]}
        disabled={parsedQty <= 0 || !toStoreId || isPending}
        onPress={handleConfirm}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Lucide name="arrow-right-left" size={18} color="#fff" />
            <Text style={styles.confirmText}>Transfer Stock</Text>
          </>
        )}
      </Pressable>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  section: { gap: 10, marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  storeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  storeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  storeChipText: { fontSize: 14, fontWeight: "600" },
  empty: { fontSize: 13, fontStyle: "italic" },
  error: { fontSize: 12, color: "#DC2626", marginTop: -6 },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 16,
    marginTop: 4,
  },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
