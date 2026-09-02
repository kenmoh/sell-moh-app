import { createReceivable } from "@/api/accounting";
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

const receivableSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required"),
  customerId: z.string().trim().min(1, "Customer ID is required"),
  invoiceNumber: z.string().trim().min(1, "Invoice number is required"),
  amount: z.string().min(1, "Amount is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

type ReceivableField = keyof z.infer<typeof receivableSchema>;

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
};

const AddReceivableSheet = ({ visible, onVisibleChange }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();

  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<Partial<Record<ReceivableField, string>>>({});

  const { mutate: createAR, isPending } = useMutation({
    mutationFn: () =>
      createReceivable({
        customer_id: customerId,
        customer_name: customerName,
        invoice_number: invoiceNumber,
        amount: parseFloat(amount),
        due_date: dueDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      queryClient.invalidateQueries({ queryKey: ["financial-dashboard"] });
      onVisibleChange(false);
      reset();
    },
  });

  const reset = () => {
    setCustomerName("");
    setCustomerId("");
    setInvoiceNumber("");
    setAmount("");
    setDueDate("");
    setErrors({});
  };

  const handleCreate = () => {
    const result = receivableSchema.safeParse({
      customerName,
      customerId,
      invoiceNumber,
      amount,
      dueDate,
    });
    if (!result.success) {
      const fieldErrors: Partial<Record<ReceivableField, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as ReceivableField;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    createAR();
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
          New Receivable
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Record an amount owed by a customer
        </Text>
      </View>

      <View style={styles.content}>
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
          {errors.customerName && (
            <Text style={styles.errorText}>{errors.customerName}</Text>
          )}
          <AppTextInput
            placeholder="Customer ID"
            value={customerId}
            onChangeText={setCustomerId}
            leftIcon="hash"
            autoCapitalize="none"
          />
          {errors.customerId && (
            <Text style={styles.errorText}>{errors.customerId}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Invoice
          </Text>
          <AppTextInput
            placeholder="Invoice number"
            value={invoiceNumber}
            onChangeText={setInvoiceNumber}
            leftIcon="file-text"
            autoCapitalize="characters"
          />
          {errors.invoiceNumber && (
            <Text style={styles.errorText}>{errors.invoiceNumber}</Text>
          )}
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
            <Text style={styles.createBtnText}>Create Receivable</Text>
          </>
        )}
      </Pressable>
    </AppBottomSheet>
  );
};

export default AddReceivableSheet;

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
