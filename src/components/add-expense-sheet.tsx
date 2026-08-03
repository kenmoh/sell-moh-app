import { AppBottomSheet } from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onAdd: (expense: { category: string; amount: string; note: string }) => void;
};

const categories = [
  { id: "utility", label: "Utility Bills", icon: "zap", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { id: "rent", label: "Rent", icon: "home", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  { id: "supplies", label: "Supplies", icon: "package", color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  { id: "salaries", label: "Salaries", icon: "users", color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  { id: "maintenance", label: "Maintenance", icon: "wrench", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  { id: "misc", label: "Miscellaneous", icon: "more-horizontal", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
];

const AddExpenseSheet = ({ visible, onVisibleChange, onAdd }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleAdd = () => {
    if (!selectedCategory || !amount) return;
    onAdd({ category: selectedCategory, amount, note });
    setSelectedCategory("");
    setAmount("");
    setNote("");
    onVisibleChange(false);
  };

  return (
    <AppBottomSheet visible={visible} onVisibleChange={onVisibleChange}>
      <Text style={[styles.title, { color: colors.text }]}>Add Expense</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Track a new expense for your store
      </Text>

      {/* Category Chips */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
      <Pressable style={styles.chipRow}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? cat.color : cat.bg,
                  borderColor: isSelected ? cat.color : "transparent",
                },
              ]}
              onPress={() => setSelectedCategory(isSelected ? "" : cat.id)}
            >
              <Lucide
                name={cat.icon as any}
                size={14}
                color={isSelected ? "#fff" : cat.color}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? "#fff" : cat.color },
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </Pressable>

      {/* Amount */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
      <AppTextInput
        leftIcon="banknote"
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      {/* Note */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>Note (optional)</Text>
      <AppTextInput
        leftIcon="file-text"
        placeholder="e.g. Electricity bill, Office supplies"
        value={note}
        onChangeText={setNote}
      />

      {/* Confirm */}
      <Pressable
        style={[
          styles.confirmButton,
          { opacity: selectedCategory && amount ? 1 : 0.5 },
        ]}
        disabled={!selectedCategory || !amount}
        onPress={handleAdd}
      >
        <Lucide name="plus" size={18} color="#fff" />
        <Text style={styles.confirmText}>Add Expense</Text>
      </Pressable>
    </AppBottomSheet>
  );
};

export default AddExpenseSheet;

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 13, marginBottom: 4 },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.8, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  confirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
