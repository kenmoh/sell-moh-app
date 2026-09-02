import { createPayable } from "@/api/accounting";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [billNumber, setBillNumber] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<Partial<Record<PayableField, string>>>({});

  const { mutate: createAP, isPending } = useMutation({
    mutationFn: () =>
      createPayable({
        bill_number: billNumber,
        vendor_name: vendorName,
        description: description || undefined,
        amount: parseFloat(amount),
        due_date: dueDate,
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
    setDueDate("");
    setErrors({});
  };

  const handleCreate = () => {
    const result = payableSchema.safeParse({
      vendorName,
      billNumber,
      description,
      amount,
      dueDate,
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
        <Text style={[styles.title, { color: colors.text }]}>
          New Payable
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Record an amount owed to a vendor
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Vendor
          </Text>
          <AppTextInput
            placeholder="Vendor name"
            value={vendorName}
            onChangeText={setVendorName}
            leftIcon="building-2"
            autoCapitalize="words"
          />
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
          <AppTextInput
            placeholder="Due date (YYYY-MM-DD)"
            value={dueDate}
            onChangeText={setDueDate}
            leftIcon="calendar"
            autoCapitalize="none"
          />
          {errors.dueDate && (
            <Text style={styles.errorText}>{errors.dueDate}</Text>
          )}
        </View>
      </View>

      <Pressable
        style={[
          styles.createBtn,
          { backgroundColor: colors.buttonPrimary, opacity: canSubmit ? 1 : 0.5 },
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
