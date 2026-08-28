import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import {
  DocumentCreateRequest,
  DocumentItemLine,
  DocumentType,
} from "@/types/document-types";
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

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onCreate?: (payload: DocumentCreateRequest) => Promise<void>;
};

const DOC_TYPES: { value: DocumentType; label: string; icon: string }[] = [
  { value: "invoice", label: "Invoice", icon: "file-text" },
  { value: "quote", label: "Quote", icon: "receipt" },
  { value: "receipt", label: "Receipt", icon: "check-circle" },
  { value: "purchase_order", label: "Purchase Order", icon: "shopping-bag" },
];

const emptyItem = (): DocumentItemLine => ({
  description: "",
  qty: 1,
  unit_price: 0,
});

const AddDocumentSheet = ({ visible, onVisibleChange, onCreate }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [docType, setDocType] = useState<DocumentType>("invoice");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DocumentItemLine[]>([emptyItem()]);
  const [isCreating, setIsCreating] = useState(false);

  const updateItem = (index: number, patch: Partial<DocumentItemLine>) => {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => setItems((current) => [...current, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((current) =>
      current.length > 1 ? current.filter((_, i) => i !== index) : current,
    );

  const reset = () => {
    setDocType("invoice");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setDueDate(null);
    setShowDatePicker(false);
    setNotes("");
    setItems([emptyItem()]);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onCreate?.({
        tenant_id: "",
        actor_id: "",
        doc_type: docType,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        customer_address: customerAddress || undefined,
        due_date: dueDate ? dueDate.toISOString() : undefined,
        notes: notes || undefined,
        items: items.filter((i) => i.description.trim() !== ""),
      });
      onVisibleChange(false);
      reset();
    } finally {
      setIsCreating(false);
    }
  };

  const canSubmit = items.some((i) => i.description.trim() !== "");

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AppBottomSheet
      snapPoints={["70%", "90%"]}
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>New Document</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Fill in the details below
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Document Type
          </Text>
          <View style={styles.typeRow}>
            {DOC_TYPES.map((t) => {
              const isActive = docType === t.value;
              return (
                <Pressable
                  key={t.value}
                  style={[
                    styles.typePill,
                    {
                      backgroundColor: isActive
                        ? colors.buttonPrimary
                        : colors.backgroundElement,
                    },
                  ]}
                  onPress={() => setDocType(t.value)}
                >
                  <Lucide
                    name={t.icon as any}
                    size={14}
                    color={isActive ? "#fff" : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typePillText,
                      { color: isActive ? "#fff" : colors.text },
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Customer */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Customer
          </Text>
          <AppTextInput
            placeholder="Customer name"
            value={customerName}
            onChangeText={setCustomerName}
            leftIcon="user"
            autoCapitalize="words"
          />
          <AppTextInput
            placeholder="Phone"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            leftIcon="phone"
            keyboardType="phone-pad"
          />
          <AppTextInput
            placeholder="Address"
            value={customerAddress}
            onChangeText={setCustomerAddress}
            leftIcon="map-pin"
            autoCapitalize="words"
          />
        </View>

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              Items
            </Text>
            <Pressable onPress={addItem} style={styles.addItemBtn}>
              <Lucide name="plus" size={14} color={colors.buttonPrimary} />
              <Text
                style={[styles.addItemText, { color: colors.buttonPrimary }]}
              >
                Add item
              </Text>
            </Pressable>
          </View>

          {items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemCard,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <AppTextInput
                placeholder="Item description"
                value={item.description}
                onChangeText={(v) => updateItem(index, { description: v })}
                autoCapitalize="sentences"
              />
              <View style={styles.itemMeta}>
                <View style={styles.itemField}>
                  <Text
                    style={[
                      styles.itemFieldLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Qty
                  </Text>
                  <AppTextInput
                    placeholder="1"
                    value={String(item.qty)}
                    onChangeText={(v) =>
                      updateItem(index, {
                        qty: parseInt(v.replace(/[^0-9]/g, ""), 10) || 0,
                      })
                    }
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.itemField}>
                  <Text
                    style={[
                      styles.itemFieldLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Price
                  </Text>
                  <AppTextInput
                    placeholder="0"
                    value={item.unit_price ? String(item.unit_price) : ""}
                    onChangeText={(v) =>
                      updateItem(index, {
                        unit_price: parseInt(v.replace(/[^0-9]/g, ""), 10) || 0,
                      })
                    }
                    keyboardType="number-pad"
                  />
                </View>
                <Pressable
                  onPress={() => removeItem(index)}
                  style={styles.removeItemBtn}
                >
                  <Lucide name="trash-2" size={18} color="#DC2626" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Additional */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Additional
          </Text>
          {docType === "invoice" && (
            <View style={styles.datePickerContainer}>
              <Pressable
                style={[
                  styles.datePickerButton,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.backgroundSelected,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Lucide name="calendar" size={16} color={colors.textSecondary} />
                <Text
                  style={[
                    styles.datePickerText,
                    { color: dueDate ? colors.text : colors.textSecondary },
                  ]}
                >
                  {dueDate ? formatDate(dueDate) : "Select due date"}
                </Text>
                <Lucide
                  name="chevron-down"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display="compact"
                  presentation="dialog"
                  onValueChange={(_, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDueDate(selectedDate);
                  }}
                  onDismiss={() => setShowDatePicker(false)}
                />
              )}
            </View>
          )}
          <AppTextInput
            placeholder="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            leftIcon="sticky-note"
            autoCapitalize="sentences"
          />
        </View>
      </ScrollView>

      {/* Create Button */}
      <Pressable
        style={[
          styles.createBtn,
          {
            backgroundColor: colors.buttonPrimary,
            opacity: canSubmit && !isCreating ? 1 : 0.5,
          },
        ]}
        disabled={!canSubmit || isCreating}
        onPress={handleCreate}
      >
        {isCreating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Lucide name="plus" size={18} color="#fff" />
        )}
        <Text style={styles.createBtnText}>
          {isCreating
            ? "Creating..."
            : `Create ${DOC_TYPES.find((t) => t.value === docType)?.label}`}
        </Text>
      </Pressable>
    </AppBottomSheet>
  );
};

export default AddDocumentSheet;

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    paddingBottom: 16,
  },
  section: {
    gap: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typePillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  addItemText: {
    fontSize: 13,
    fontWeight: "600",
  },
  itemCard: {
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  itemField: {
    flex: 1,
    gap: 4,
  },
  itemFieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  removeItemBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220, 38, 38, 0.1)",
  },
  datePickerContainer: {
    gap: 8,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 16,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
