import { recordApPayment, recordArPayment } from "@/api/accounting";
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

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  type: "ar" | "ap";
  itemId: string;
  itemName: string;
  balance: number;
};

const RecordPaymentSheet = ({
  visible,
  onVisibleChange,
  type,
  itemId,
  itemName,
  balance,
}: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [amountError, setAmountError] = useState("");

  const { mutate: recordPayment, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        amount: parseFloat(amount),
        payment_date: paymentDate,
        notes: notes || undefined,
      };
      if (type === "ar") {
        return recordArPayment(itemId, payload);
      }
      return recordApPayment(itemId, payload) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [type === "ar" ? "receivables" : "payables"],
      });
      queryClient.invalidateQueries({ queryKey: ["financial-dashboard"] });
      onVisibleChange(false);
      reset();
    },
  });

  const reset = () => {
    setAmount("");
    setPaymentDate("");
    setNotes("");
    setAmountError("");
  };

  const handleRecord = () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setAmountError("Enter a valid amount");
      return;
    }
    if (numAmount > balance) {
      setAmountError(`Amount cannot exceed ₦${balance.toLocaleString()}`);
      return;
    }
    if (!paymentDate) {
      setAmountError("Payment date is required");
      return;
    }
    setAmountError("");
    recordPayment();
  };

  const canSubmit = !isPending;

  return (
    <AppBottomSheet
      snapPoints={["60%", "80%"]}
      visible={visible}
      onVisibleChange={(v) => {
        if (!v) reset();
        onVisibleChange(v);
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Record {type === "ar" ? "Receivable" : "Payable"} Payment
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {itemName} — Balance: ₦{balance.toLocaleString()}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Payment
          </Text>
          <AppTextInput
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            leftIcon="banknote"
            keyboardType="numeric"
          />
          {amountError ? (
            <Text style={styles.errorText}>{amountError}</Text>
          ) : null}
          <AppTextInput
            placeholder="Payment date (YYYY-MM-DD)"
            value={paymentDate}
            onChangeText={setPaymentDate}
            leftIcon="calendar"
            autoCapitalize="none"
          />
          <AppTextInput
            placeholder="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            leftIcon="align-left"
          />
        </View>
      </View>

      <Pressable
        style={[
          styles.recordBtn,
          { backgroundColor: colors.buttonPrimary, opacity: canSubmit ? 1 : 0.5 },
        ]}
        disabled={!canSubmit}
        onPress={handleRecord}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Lucide name="check-circle" size={18} color="#fff" />
            <Text style={styles.recordBtnText}>Record Payment</Text>
          </>
        )}
      </Pressable>
    </AppBottomSheet>
  );
};

export default RecordPaymentSheet;

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
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 16,
  },
  recordBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
