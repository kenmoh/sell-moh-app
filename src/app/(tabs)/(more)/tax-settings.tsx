import {
    createTaxType,
    deleteTaxType,
    fetchTaxTypes,
    TaxType,
    updateTaxType,
} from "@/api/taxes";
import AppBottomSheet from "@/components/bottom-sheet";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TaxSettings() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxType | null>(null);
  const [taxName, setTaxName] = useState("");
  const [taxRate, setTaxRate] = useState("");

  const {
    data: taxes = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["taxes"],
    queryFn: fetchTaxTypes,
  });

  const createMutation = useMutation({
    mutationFn: createTaxType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
      setShowAddSheet(false);
      setTaxName("");
      setTaxRate("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; rate?: number; is_active?: boolean };
    }) => updateTaxType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
      setEditingTax(null);
      setTaxName("");
      setTaxRate("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaxType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateTaxType(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
    },
  });

  const handleSave = () => {
    if (!taxName.trim() || !taxRate) return;
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) return;

    if (editingTax) {
      updateMutation.mutate({
        id: editingTax.id,
        data: { name: taxName.trim(), rate },
      });
    } else {
      createMutation.mutate({ name: taxName.trim(), rate });
    }
  };

  const openEdit = (tax: TaxType) => {
    setEditingTax(tax);
    setTaxName(tax.name);
    setTaxRate(String(tax.rate));
    setShowAddSheet(true);
  };

  const closeSheet = () => {
    setShowAddSheet(false);
    setEditingTax(null);
    setTaxName("");
    setTaxRate("");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Lucide name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Tax Settings
        </Text>
        <Pressable
          onPress={() => setShowAddSheet(true)}
          style={[
            styles.addTrigger,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <Lucide name="plus" size={18} color={colors.text} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.text}
          style={{ marginTop: 40 }}
        />
      ) : taxes.length === 0 ? (
        <View style={styles.emptyState}>
          <Lucide name="receipt" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No tax types configured
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Create a tax type (e.g. VAT) to apply at checkout
          </Text>
        </View>
      ) : (
        <FlatList
          data={taxes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#282b32" : "#eef0f4",
                },
              ]}
            >
              <View style={styles.cardRow}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.cardRate, { color: "#3b82f6" }]}>
                    {item.rate}%
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <Switch
                    value={item.is_active}
                    onValueChange={(val) =>
                      toggleMutation.mutate({ id: item.id, is_active: val })
                    }
                    trackColor={{ false: "#3a3a3c", true: "#34c759" }}
                    thumbColor="#fff"
                  />
                  <Pressable
                    onPress={() => openEdit(item)}
                    style={styles.editBtn}
                  >
                    <Lucide
                      name="pencil"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => deleteMutation.mutate(item.id)}
                    style={styles.deleteBtn}
                  >
                    <Lucide name="trash-2" size={16} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <AppBottomSheet
        visible={showAddSheet}
        onVisibleChange={closeSheet}
        // title={editingTax ? "Edit Tax Type" : "Add Tax Type"}
      >
        <View style={styles.sheetContent}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.backgroundElement,
                borderColor: isDark ? "#282b32" : "#e5e7eb",
              },
            ]}
            placeholder="e.g. VAT"
            placeholderTextColor={colors.textSecondary}
            value={taxName}
            onChangeText={setTaxName}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Rate (%)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.backgroundElement,
                borderColor: isDark ? "#282b32" : "#e5e7eb",
              },
            ]}
            placeholder="e.g. 7.5"
            placeholderTextColor={colors.textSecondary}
            value={taxRate}
            onChangeText={setTaxRate}
            keyboardType="decimal-pad"
          />
          <Pressable
            onPress={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            style={[styles.saveBtn, { backgroundColor: "#3b82f6" }]}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>
                {editingTax ? "Update" : "Create"}
              </Text>
            )}
          </Pressable>
        </View>
      </AppBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 6 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  addTrigger: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: "600" },
  cardRate: { fontSize: 14, fontWeight: "500", marginTop: 2 },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtn: { padding: 6 },
  deleteBtn: { padding: 6 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptySubtext: { fontSize: 13 },
  sheetContent: { padding: 16, gap: 12 },
  label: { fontSize: 13, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  saveBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
