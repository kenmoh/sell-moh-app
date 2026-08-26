import AppBottomSheet from "@/components/bottom-sheet";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
};

const reasons = ["Restock", "Return", "Correction"];

const AdjustStockSheet = ({ visible, onVisibleChange }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [quantity, setQuantity] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onVisibleChange(false);
    setQuantity("");
    setSelectedReason("");
    setNote("");
  };

  return (
    <AppBottomSheet visible={visible} onVisibleChange={onVisibleChange}>
      <Text style={[styles.title, { color: colors.text }]}>Adjust Stock</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Add or remove stock for this product
      </Text>

      {/* Quantity Input */}
      <View style={styles.quantityRow}>
        <Pressable
          style={[
            styles.stepButton,
            { backgroundColor: colors.backgroundElement },
          ]}
          onPress={() => {
            const current = parseInt(quantity || "0", 10);
            if (current > 0) setQuantity(String(current - 1));
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
          onPress={() => {
            const current = parseInt(quantity || "0", 10);
            setQuantity(String(current + 1));
          }}
        >
          <Lucide name="plus" size={16} color={colors.text} />
        </Pressable>
      </View>

      {/* Reason Chips */}
      <View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Reason
        </Text>
        <View style={styles.chipRow}>
          {reasons.map((r) => {
            const isSelected = selectedReason === r;
            return (
              <Pressable
                key={r}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? "#2563eb"
                      : colors.backgroundElement,
                    borderColor: isSelected
                      ? "#2563eb"
                      : colors.backgroundElement,
                  },
                ]}
                onPress={() => setSelectedReason(isSelected ? "" : r)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? "#fff" : colors.text },
                  ]}
                >
                  {r}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Optional Note */}
      <View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Note (optional)
        </Text>
        <TextInput
          style={[
            styles.noteInput,
            {
              color: colors.text,
              backgroundColor: colors.backgroundElement,
              borderColor: colors.backgroundElement,
            },
          ]}
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Supplier delivery, Damaged units"
          placeholderTextColor={colors.textSecondary}
          multiline
        />
      </View>

      {/* Confirm */}
      <Pressable
        style={[
          styles.confirmButton,
          { opacity: parseInt(quantity || "0", 10) > 0 ? 1 : 0.5 },
        ]}
        disabled={parseInt(quantity || "0", 10) === 0}
        onPress={handleConfirm}
      >
        <Lucide name="package-plus" size={16} color="#fff" />
        <Text style={styles.confirmText}>Add Stock</Text>
      </Pressable>
    </AppBottomSheet>
  );
};

export default AdjustStockSheet;

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 13, marginBottom: 4 },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
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
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.8 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  noteInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  confirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
