import { fetchCustomers } from "@/api/customer";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Customer, CustomerType } from "@/types/customer";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";

interface CustomerPickerSheetProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onCustomerSelected: (customer: Customer) => void;
  /** Hide vendors — for screens that only make sense for customers. */
  customerType?: CustomerType;
  title?: string;
}

const PAGE_SIZE = 50;

const CustomerPickerSheet = ({
  visible,
  onVisibleChange,
  onCustomerSelected,
  customerType,
  title = "Select Customer",
}: CustomerPickerSheetProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [search, setSearch] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["customers", "picker", search],
    queryFn: () => fetchCustomers(1, PAGE_SIZE, search || undefined),
    enabled: visible,
  });

  const customers = (data?.items ?? []).filter(
    (c) => !customerType || c.type === customerType,
  );

  const handleSelect = (customer: Customer) => {
    onVisibleChange(false);
    onCustomerSelected(customer);
    setSearch("");
  };

  return (
    <AppBottomSheet
      snapPoints={["70%", "90%"]}
      visible={visible}
      onVisibleChange={(v) => {
        if (!v) setSearch("");
        onVisibleChange(v);
      }}
    >
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      <AppTextInput
        placeholder="Search by name, phone or email..."
        value={search}
        onChangeText={setSearch}
        leftIcon="search"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {isPending ? (
        <ActivityIndicator
          color={colors.buttonPrimary}
          style={{ paddingVertical: 24 }}
        />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              {search
                ? "No matching customer"
                : "No customers yet — create one from the form"}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              style={[
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.backgroundElement,
                },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: colors.backgroundElement }]}>
                <Lucide name="user" size={18} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                {(item.phone || item.email) && (
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {item.phone || item.email}
                  </Text>
                )}
              </View>
              {item.type === "vendor" && (
                <View
                  style={[
                    styles.tag,
                    { backgroundColor: colors.backgroundElement },
                  ]}
                >
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                    Vendor
                  </Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}
    </AppBottomSheet>
  );
};

export default CustomerPickerSheet;

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  list: { marginTop: 12, maxHeight: 420 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 14, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: "600" },
  empty: { fontSize: 13, textAlign: "center", paddingVertical: 24 },
});
