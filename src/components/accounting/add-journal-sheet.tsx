import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type EntryLine = {
  account_id: string;
  account_code: string;
  debit: number;
  credit: number;
};

type Account = {
  id: string;
  code: string;
  name: string;
  account_type: string;
};

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onAdd: (data: { description: string; entries: EntryLine[] }) => void;
  accounts: Account[];
  isPending?: boolean;
};

const initialEntries: EntryLine[] = [
  { account_id: "", account_code: "", debit: 0, credit: 0 },
  { account_id: "", account_code: "", debit: 0, credit: 0 },
];

const AddJournalSheet = ({
  visible,
  onVisibleChange,
  onAdd,
  accounts,
  isPending,
}: Props) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState<EntryLine[]>(initialEntries);

  const reset = () => {
    setDescription("");
    setEntries(initialEntries);
  };

  const updateEntry = (index: number, field: keyof EntryLine, value: string | number) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "account_id") {
        const account = accounts.find((a) => a.id === value);
        if (account) {
          updated[index].account_code = account.code;
        }
      }
      return updated;
    });
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { account_id: "", account_code: "", debit: 0, credit: 0 },
    ]);
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    if (!description.trim()) return;
    const validEntries = entries.filter(
      (e) => e.account_id && (e.debit > 0 || e.credit > 0),
    );
    if (validEntries.length < 2) return;
    onAdd({ description: description.trim(), entries: validEntries });
  };

  return (
    <AppBottomSheet
      visible={visible}
      onVisibleChange={(v) => {
        if (!v) reset();
        onVisibleChange(v);
      }}
    >
      <Text style={[styles.title, { color: colors.text }]}>New Journal Entry</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Create a manual journal entry with debit and credit lines
      </Text>

      {/* Description */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Description
      </Text>
      <AppTextInput
        leftIcon="file-text"
        placeholder="e.g. Adjusting entry"
        value={description}
        onChangeText={setDescription}
      />

      {/* Entry Lines */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Entry Lines
      </Text>
      {entries.map((entry, index) => (
        <View key={index} style={[styles.entryCard, { borderColor: isDark ? "#282b32" : "#eef0f4" }]}>
          <View style={styles.entryHeader}>
            <Text style={[styles.entryNumber, { color: colors.textSecondary }]}>
              Line {index + 1}
            </Text>
            {entries.length > 2 && (
              <Pressable onPress={() => removeEntry(index)}>
                <Lucide name="trash-2" size={14} color="#ef4444" />
              </Pressable>
            )}
          </View>

          {/* Account Select */}
          <Text style={[styles.entryLabel, { color: colors.textSecondary }]}>
            Account
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.accountScroll}
          >
            <Pressable style={styles.accountChips}>
              {accounts.map((account) => {
                const isSelected = entry.account_id === account.id;
                return (
                  <Pressable
                    key={account.id}
                    style={[
                      styles.accountChip,
                      {
                        backgroundColor: isSelected
                          ? colors.buttonPrimary
                          : colors.textInput,
                        borderColor: isSelected
                          ? colors.buttonPrimary
                          : "transparent",
                      },
                    ]}
                    onPress={() => updateEntry(index, "account_id", account.id)}
                  >
                    <Text
                      style={[
                        styles.accountChipCode,
                        {
                          color: isSelected ? "#fff" : colors.textSecondary,
                          fontFamily: "monospace",
                        },
                      ]}
                    >
                      {account.code}
                    </Text>
                    <Text
                      style={[
                        styles.accountChipName,
                        { color: isSelected ? "#fff" : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {account.name}
                    </Text>
                  </Pressable>
                );
              })}
            </Pressable>
          </ScrollView>

          {/* Amounts */}
          <View style={styles.amountRow}>
            <View style={styles.amountField}>
              <Text style={[styles.entryLabel, { color: "#10b981" }]}>
                Debit
              </Text>
              <AppTextInput
                placeholder="0"
                value={entry.debit > 0 ? String(entry.debit) : ""}
                onChangeText={(v) => updateEntry(index, "debit", parseFloat(v) || 0)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.amountField}>
              <Text style={[styles.entryLabel, { color: "#ef4444" }]}>
                Credit
              </Text>
              <AppTextInput
                placeholder="0"
                value={entry.credit > 0 ? String(entry.credit) : ""}
                onChangeText={(v) => updateEntry(index, "credit", parseFloat(v) || 0)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      ))}

      {/* Add Line */}
      <Pressable style={styles.addLineBtn} onPress={addEntry}>
        <Lucide name="plus-circle" size={16} color={colors.buttonPrimary} />
        <Text style={[styles.addLineText, { color: colors.buttonPrimary }]}>
          Add Line
        </Text>
      </Pressable>

      {/* Confirm */}
      <Pressable
        style={[
          styles.confirmButton,
          {
            opacity:
              description.trim() && entries.length >= 2 && !isPending ? 1 : 0.5,
          },
        ]}
        disabled={!description.trim() || entries.length < 2 || isPending}
        onPress={handleAdd}
      >
        {isPending ? (
          <ActivityIndicator size={18} color="#fff" />
        ) : (
          <Lucide name="check" size={18} color="#fff" />
        )}
        <Text style={styles.confirmText}>
          {isPending ? "Posting..." : "Post Journal"}
        </Text>
      </Pressable>
    </AppBottomSheet>
  );
};

export default AddJournalSheet;

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 13, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.8, marginTop: 10 },
  entryCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  entryNumber: { fontSize: 12, fontWeight: "600" },
  entryLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  accountScroll: { marginBottom: 8 },
  accountChips: { flexDirection: "row", gap: 6 },
  accountChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  accountChipCode: { fontSize: 11, fontWeight: "700" },
  accountChipName: { fontSize: 11, fontWeight: "500", maxWidth: 80 },
  amountRow: { flexDirection: "row", gap: 10 },
  amountField: { flex: 1 },
  addLineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  addLineText: { fontSize: 13, fontWeight: "600" },
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
