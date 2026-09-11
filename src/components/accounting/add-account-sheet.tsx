import AppBottomSheet from "@/components/bottom-sheet";
import Pill from "@/components/pill";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onAdd: (data: { code: string; name: string; account_type: string }) => void;
  isPending?: boolean;
};

const accountTypes = [
  { id: "asset", label: "Asset", icon: "briefcase", color: "#10b981" },
  { id: "liability", label: "Liability", icon: "credit-card", color: "#ef4444" },
  { id: "equity", label: "Equity", icon: "shield", color: "#8b5cf6" },
  { id: "revenue", label: "Revenue", icon: "trending-up", color: "#3b82f6" },
  { id: "expense", label: "Expense", icon: "trending-down", color: "#f59e0b" },
];

const AddAccountSheet = ({
  visible,
  onVisibleChange,
  onAdd,
  isPending,
}: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const reset = () => {
    setCode("");
    setName("");
    setSelectedType("");
  };

  const handleAdd = () => {
    if (!code || !name || !selectedType) return;
    onAdd({ code, name, account_type: selectedType });
  };

  return (
    <AppBottomSheet
      visible={visible}
      onVisibleChange={(v) => {
        if (!v) reset();
        onVisibleChange(v);
      }}
    >
      <Text style={[styles.title, { color: colors.text }]}>Add Account</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Create a new account in your chart of accounts
      </Text>

      {/* Account Code */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Account Code
      </Text>
      <AppTextInput
        leftIcon="hash"
        placeholder="e.g. 1001"
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
      />

      {/* Account Name */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Account Name
      </Text>
      <AppTextInput
        leftIcon="type"
        placeholder="e.g. Cash in Hand"
        value={name}
        onChangeText={setName}
      />

      {/* Account Type */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Account Type
      </Text>
      <View style={styles.chipRow}>
        {accountTypes.map((type) => (
          <Pill
            key={type.id}
            label={type.label}
            icon={type.icon as any}
            color={type.color}
            active={selectedType === type.id}
            onPress={() =>
              setSelectedType(selectedType === type.id ? "" : type.id)
            }
          />
        ))}
      </View>

      {/* Confirm */}
      <Pressable
        style={[
          styles.confirmButton,
          { opacity: code && name && selectedType && !isPending ? 1 : 0.5 },
        ]}
        disabled={!code || !name || !selectedType || isPending}
        onPress={handleAdd}
      >
        {isPending ? (
          <ActivityIndicator size={18} color="#fff" />
        ) : (
          <Lucide name="plus" size={18} color="#fff" />
        )}
        <Text style={styles.confirmText}>
          {isPending ? "Adding..." : "Add Account"}
        </Text>
      </Pressable>
    </AppBottomSheet>
  );
};

export default AddAccountSheet;

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 13, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.8, marginTop: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  confirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
