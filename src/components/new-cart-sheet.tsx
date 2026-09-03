import { createCart } from "@/api/cart";
import { createCustomer, fetchCustomers } from "@/api/customer";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import useCartStore from "@/hooks/use-cart-store";
import { Customer } from "@/types/customer";
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

interface NewCartSheetProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  storeId: string;
  onCartCreated: () => void;
}

const NewCartSheet = ({
  visible,
  onVisibleChange,
  storeId,
  onCartCreated,
}: NewCartSheetProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: customersData } = useQuery({
    queryKey: ["customers", "picker", search],
    queryFn: () => fetchCustomers(1, 20, search || undefined),
    enabled: showResults && search.length >= 2,
  });

  const customers = customersData?.items ?? [];

  useEffect(() => {
    if (!visible) {
      setSearch("");
      setSelectedCustomer(null);
      setCustomerName("");
      setCustomerPhone("");
      setShowResults(false);
    }
  }, [visible]);

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerName(c.name);
    setCustomerPhone(c.phone ?? "");
    setShowResults(false);
    setSearch("");
  };

  const { mutate: handleCreate, isPending } = useMutation({
    mutationFn: async () => {
      let name = customerName.trim();
      let phone = customerPhone.trim() || undefined;

      if (!selectedCustomer && name) {
        const newCustomer = await createCustomer({ name, phone });
        name = newCustomer.name;
        phone = newCustomer.phone ?? undefined;
      }

      return createCart({
        store_id: storeId,
        customer_name: name || undefined,
        customer_phone: phone,
      });
    },
    onSuccess: (cart) => {
      useCartStore
        .getState()
        .createCart(
          cart.customer_name || "Cart",
          cart.session_id,
          cart.customer_name ?? undefined,
          cart.customer_phone ?? undefined,
        );
      queryClient.invalidateQueries({ queryKey: ["carts"] });
      onVisibleChange(false);
      onCartCreated();
    },
  });

  return (
    <AppBottomSheet
      visible={visible}
      onVisibleChange={onVisibleChange}
      snapPoints={["60%"]}
    >
      <Text style={[styles.title, { color: colors.text }]}>New Cart</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Select an existing customer or enter new details
      </Text>

      <View style={{ gap: 12, marginTop: 16 }}>
        <View>
          <AppTextInput
            placeholder="Search customer by name or phone..."
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              setShowResults(true);
              if (t.length < 2) setSelectedCustomer(null);
            }}
          />
          {showResults && customers.length > 0 && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.backgroundElement }]}>
              {customers.slice(0, 5).map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.dropdownItem, { borderBottomColor: colors.backgroundElement }]}
                  onPress={() => selectCustomer(c)}
                >
                  <Text style={[styles.dropdownName, { color: colors.text }]}>{c.name}</Text>
                  <Text style={[styles.dropdownMeta, { color: colors.textSecondary }]}>
                    {c.phone ?? c.email ?? ""}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {selectedCustomer && (
          <View style={[styles.selectedBadge, { backgroundColor: colors.backgroundElement }]}>
            <Lucide name="user-check" size={14} color="#3b82f6" />
            <Text style={[styles.selectedText, { color: colors.text }]}>
              {selectedCustomer.name}
            </Text>
            <Pressable hitSlop={8} onPress={() => {
              setSelectedCustomer(null);
              setCustomerName("");
              setCustomerPhone("");
            }}>
              <Lucide name="x" size={14} color={colors.textSecondary} />
            </Pressable>
          </View>
        )}

        <AppTextInput
          placeholder="Customer name"
          value={customerName}
          onChangeText={setCustomerName}
        />
        <AppTextInput
          placeholder="Phone number (optional)"
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
        />

        <Pressable
          style={[
            styles.createButton,
            { backgroundColor: colors.buttonPrimary },
            isPending && { opacity: 0.6 },
          ]}
          onPress={() => handleCreate()}
          disabled={isPending || !customerName.trim()}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.createButtonText}>Create Cart</Text>
          )}
        </Pressable>
      </View>
    </AppBottomSheet>
  );
};

export default NewCartSheet;

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 4 },
  dropdown: {
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownName: { fontSize: 14, fontWeight: "600" },
  dropdownMeta: { fontSize: 12, marginTop: 2 },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedText: { fontSize: 14, fontWeight: "600", flex: 1 },
  createButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  createButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
