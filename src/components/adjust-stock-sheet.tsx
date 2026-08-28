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

const reasons = [
  { label: "Restock", icon: "package-plus" as const },
  { label: "Return", icon: "rotate-ccw" as const },
  { label: "Correction", icon: "pencil" as const },
];

const AdjustStockSheet = ({ visible, onVisibleChange }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [quantity, setQuantity] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [note, setNote] = useState("");

  const parsedQty = parseInt(quantity || "0", 10);

  const handleConfirm = () => {
    onVisibleChange(false);
    setQuantity("");
    setSelectedReason("");
    setNote("");
  };

  return (
    <AppBottomSheet
      snapPoints={["75%", "85%"]}
      visible={visible}
      onVisibleChange={onVisibleChange}
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
      </View>

      {/* Note */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Note (optional)
        </Text>
        <TextInput
          style={[
            styles.noteInput,
            {
              color: colors.text,
              backgroundColor: colors.backgroundElement,
              borderColor: colors.backgroundSelected,
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
          {
            backgroundColor: parsedQty > 0 ? colors.buttonPrimary : colors.backgroundSelected,
            opacity: parsedQty > 0 ? 1 : 0.5,
          },
        ]}
        disabled={parsedQty === 0}
        onPress={handleConfirm}
      >
        <Lucide name="package-plus" size={18} color="#fff" />
        <Text style={styles.confirmText}>Add Stock</Text>
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
  noteInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: "top",
    lineHeight: 20,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
