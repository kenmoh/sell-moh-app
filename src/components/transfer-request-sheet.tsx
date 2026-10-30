import { createTransferRequest, fetchProducts } from "@/api/inventory";
import { fetchTenantStores } from "@/api/store";
import AppBottomSheet from "@/components/bottom-sheet";
import { Button } from "@/components/button";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { useToast } from "@/hooks/use-toast";
import type { ProductResponse } from "@/types/product";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
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
  currentStoreId: string;
  /** Pre-selects the item when raised from a product screen. */
  productName?: string;
};

export default function TransferRequestSheet({
  visible,
  onVisibleChange,
  currentStoreId,
  productName,
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();
  const toast = useToast();

  const [itemName, setItemName] = useState(productName ?? "");
  const [supplyingStoreId, setSupplyingStoreId] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");

  const { data: storesData } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchTenantStores,
  });
  const otherStores = (storesData ?? []).filter((s) => s.id !== currentStoreId);

  const { data: productsData } = useQuery({
    queryKey: ["products", currentStoreId, "transfer-request"],
    queryFn: () =>
      fetchProducts(currentStoreId, { page: 1, page_size: 200 }),
    enabled: visible && !!currentStoreId,
  });
  const items = useMemo(
    () => ((productsData?.data ?? []) as ProductResponse[]).slice(0, 60),
    [productsData],
  );


  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createTransferRequest(currentStoreId, {
        item_name: itemName,
        supplying_store_id: supplyingStoreId,
        requested_qty: parseInt(qty, 10),
        notes: notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfer-requests"] });
      toast.success("Request sent", "The other store will approve or reject it.");
      onVisibleChange(false);
    },
    onError: (error) => toast.error("Could not send request", error.message),
  });

  const parsedQty = parseInt(qty || "0", 10) || 0;
  const canSubmit = !!itemName && !!supplyingStoreId && parsedQty > 0;

  const handleVisibleChange = (next: boolean) => {
    if (!next) {
      setItemName(productName ?? "");
      setSupplyingStoreId("");
      setQty("");
      setNotes("");
    }
    onVisibleChange(next);
  };

  return (
    <AppBottomSheet
      snapPoints={["85%"]}
      visible={visible}
      onVisibleChange={handleVisibleChange}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Request Stock
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Ask another store to send an item
          </Text>
        </View>

        {!productName && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Item
            </Text>
            {items.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                No items in this store yet.
              </Text>
            ) : (
              <View style={styles.chipGrid}>
                {items.map((item) => {
                  const isActive = itemName === item.name;
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isActive
                            ? "rgba(59,130,246,0.1)"
                            : colors.backgroundElement,
                          borderColor: isActive ? "#3b82f6" : "transparent",
                        },
                      ]}
                      onPress={() => setItemName(item.name)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isActive ? "#3b82f6" : colors.text },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Request from
          </Text>
          {otherStores.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              No other stores available
            </Text>
          ) : (
            <View style={styles.chipGrid}>
              {otherStores.map((store) => {
                const isActive = supplyingStoreId === store.id;
                return (
                  <Pressable
                    key={store.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive
                          ? "rgba(59,130,246,0.1)"
                          : colors.backgroundElement,
                        borderColor: isActive ? "#3b82f6" : "transparent",
                      },
                    ]}
                    onPress={() =>
                      setSupplyingStoreId(isActive ? "" : store.id)
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
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
        </View>

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
          />
        </View>

        <View style={styles.section}>
          <AppTextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Note (optional)"
            leftIcon="sticky-note"
          />
        </View>

        <Button
          disabled={!canSubmit}
          fullWidth
          leftIcon={(color) => (
            <Lucide name="send" size={18} color={color} />
          )}
          loading={isPending}
          onPress={() => mutate()}
          title="Send Request"
        />
      </ScrollView>
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
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: "500" },
  empty: { fontSize: 14 },
});
