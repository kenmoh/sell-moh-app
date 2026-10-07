import { createPayable } from "@/api/accounting";
import { fetchCustomers } from "@/api/customer";
import AppBottomSheet from "@/components/bottom-sheet";
import Pill from "@/components/pill";
import PillRow from "@/components/pill-row";
import AppTextInput from "@/components/text-input";
import {
  DEFAULT_EXPENSE_CATEGORY,
  EXPENSE_CATEGORIES,
  type ExpenseCategoryId,
} from "@/constants/expense-categories";
import { Colors } from "@/constants/theme";
import type { Customer } from "@/types/customer";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { z } from "zod";

const payableSchema = z.object({
  vendorName: z.string().trim().min(1, "Vendor name is required"),
  billNumber: z.string().trim().min(1, "Bill number is required"),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

type PayableField = keyof z.infer<typeof payableSchema>;

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
};

const AddPayableSheet = ({ visible, onVisibleChange }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();

  const [vendorName, setVendorName] = useState("");
  const [vendor, setVendor] = useState<Customer | null>(null);
  const [vendorSearch, setVendorSearch] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState<ExpenseCategoryId>(
    DEFAULT_EXPENSE_CATEGORY,
  );
  const [errors, setErrors] = useState<Partial<Record<PayableField, string>>>(
    {},
  );

  // Only vendors: a bill is for someone we buy from. Typed names still work
  // for a one-off supplier who is not in the list.
  const { data: vendorResults, isPending: isSearchingVendors } = useQuery({
    queryKey: ["customers", "picker", "vendor", vendorSearch],
    queryFn: () =>
      fetchCustomers(1, 20, vendorSearch.trim() || undefined, "vendor"),
    enabled: visible && !vendor && vendorSearch.trim().length >= 2,
  });

  const { mutate: createAP, isPending } = useApiMutation({
    mutationFn: () =>
      createPayable({
        bill_number: billNumber,
        vendor_name: vendorName,
        vendor_id: vendor?.id,
        description: description || undefined,
        amount: parseFloat(amount),
        due_date: dueDateValue,
        expense_category: category,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      queryClient.invalidateQueries({ queryKey: ["financial-dashboard"] });
      onVisibleChange(false);
      reset();
    },
  });

  const reset = () => {
    setVendorName("");
    setBillNumber("");
    setDescription("");
    setAmount("");
    setDueDate(null);
    setShowDatePicker(false);
    setCategory(DEFAULT_EXPENSE_CATEGORY);
    setErrors({});
  };

  const handleCreate = () => {
    const result = payableSchema.safeParse({
      vendorName,
      billNumber,
      description,
      amount,
      dueDate: dueDateValue,
    });
    if (!result.success) {
      const fieldErrors: Partial<Record<PayableField, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as PayableField;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    createAP();
  };

  const dueDateValue = dueDate ? dueDate.toISOString().split("T")[0] : "";

  const canSubmit = !isPending;

  return (
    <AppBottomSheet
      snapPoints={["75%", "90%"]}
      visible={visible}
      onVisibleChange={(v) => {
        if (!v) reset();
        onVisibleChange(v);
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>New Payable</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Record an amount owed to a vendor
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Vendor
          </Text>

          {vendor ? (
            <View
              style={[
                styles.selectedRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.backgroundElement,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectedName, { color: colors.text }]}>
                  {vendor.name}
                </Text>
                {(vendor.phone || vendor.email) && (
                  <Text
                    style={[
                      styles.selectedMeta,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {vendor.phone || vendor.email}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => {
                  setVendor(null);
                  setVendorName("");
                }}
                hitSlop={8}
              >
                <Lucide name="x" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          ) : (
            <>
              <AppTextInput
                placeholder="Search vendors..."
                value={vendorSearch}
                onChangeText={setVendorSearch}
                leftIcon="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {vendorSearch.trim().length >= 2 && (
                <View
                  style={[
                    styles.dropdown,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.backgroundElement,
                    },
                  ]}
                >
                  {isSearchingVendors ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.buttonPrimary}
                      style={{ paddingVertical: 12 }}
                    />
                  ) : vendorResults?.items.length ? (
                    vendorResults.items.slice(0, 5).map((v) => (
                      <Pressable
                        key={v.id}
                        style={[
                          styles.dropdownItem,
                          { borderBottomColor: colors.backgroundElement },
                        ]}
                        onPress={() => {
                          setVendor(v);
                          setVendorName(v.name);
                          setVendorSearch("");
                          setErrors((prev) => ({
                            ...prev,
                            vendorName: undefined,
                          }));
                        }}
                      >
                        <Text
                          style={[styles.dropdownName, { color: colors.text }]}
                        >
                          {v.name}
                        </Text>
                        <Text
                          style={[
                            styles.dropdownMeta,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {v.phone || v.email || "No contact"}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text
                      style={[
                        styles.dropdownMeta,
                        { color: colors.textSecondary, paddingVertical: 12 },
                      ]}
                    >
                      No matching vendor — type the name below
                    </Text>
                  )}
                </View>
              )}
              <AppTextInput
                placeholder="Vendor name"
                value={vendorName}
                onChangeText={(v) => {
                  setVendorName(v);
                  setVendor(null);
                }}
                leftIcon="building-2"
                autoCapitalize="words"
              />
            </>
          )}
          {errors.vendorName && (
            <Text style={styles.errorText}>{errors.vendorName}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Bill
          </Text>
          <AppTextInput
            placeholder="Bill number"
            value={billNumber}
            onChangeText={setBillNumber}
            leftIcon="file-text"
            autoCapitalize="characters"
          />
          {errors.billNumber && (
            <Text style={styles.errorText}>{errors.billNumber}</Text>
          )}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            What the bill is for
          </Text>
          <PillRow inset={12}>
            {EXPENSE_CATEGORIES.map((c) => (
              <Pill
                key={c.id}
                label={c.label}
                active={c.id === category}
                onPress={() => setCategory(c.id)}
                color="#3b82f6"
              />
            ))}
          </PillRow>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {`Decides which expense the amount is charged to on the books. Currently: ${
              EXPENSE_CATEGORIES.find((c) => c.id === category)?.label
            }.`}
          </Text>
          <AppTextInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            leftIcon="align-left"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Amount & Due Date
          </Text>
          <AppTextInput
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            leftIcon="banknote"
            keyboardType="numeric"
          />
          {errors.amount && (
            <Text style={styles.errorText}>{errors.amount}</Text>
          )}
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
              {dueDate
                ? dueDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Select due date"}
            </Text>
            <Lucide name="chevron-down" size={16} color={colors.textSecondary} />
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
          {errors.dueDate && (
            <Text style={styles.errorText}>{errors.dueDate}</Text>
          )}
        </View>
      </View>

      <Pressable
        style={[
          styles.createBtn,
          {
            backgroundColor: colors.buttonPrimary,
            opacity: canSubmit ? 1 : 0.5,
          },
        ]}
        disabled={!canSubmit}
        onPress={handleCreate}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Lucide name="plus" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Create Payable</Text>
          </>
        )}
      </Pressable>
    </AppBottomSheet>
  );
};

export default AddPayableSheet;

const styles = StyleSheet.create({
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14 },
  content: { paddingBottom: 8 },
  section: { gap: 10, marginBottom: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  errorText: { fontSize: 12, color: "#DC2626", marginTop: -4 },
  fieldLabel: { fontSize: 12, marginTop: 4 },
  hint: { fontSize: 11, lineHeight: 16 },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedName: { fontSize: 14, fontWeight: "600" },
  selectedMeta: { fontSize: 12, marginTop: 2 },
  dropdown: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  dropdownName: { fontSize: 14, fontWeight: "600" },
  dropdownMeta: { fontSize: 12, marginTop: 2 },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  datePickerText: { flex: 1, fontSize: 14 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 16,
  },
  createBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
