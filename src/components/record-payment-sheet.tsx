import { recordApPayment, recordArPayment } from "@/api/accounting";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

  const [amount, setAmount] = useState(() =>
    balance > 0 ? String(balance) : "",
  );
  const [paymentDate, setPaymentDate] = useState<Date | null>(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [amountError, setAmountError] = useState("");

  const isAr = type === "ar";
  const label = isAr ? "Receivable" : "Payable";
  // Nothing left to collect: the form is dead rather than a chance to type a
  // number that the API would reject anyway.
  const isSettled = !(balance > 0);

  // Opening the sheet (or switching to another row) starts a fresh form
  // pre-filled with the full balance dated today — the common case is settling
  // it in one go, and anything less is a part payment to dial in. Adjusting
  // the draft during render, rather than in an effect, avoids showing a frame
  // with the previously opened row's amount still in the field.
  const [draftFor, setDraftFor] = useState<string | null>(null);
  if (visible && draftFor !== itemId) {
    setDraftFor(itemId);
    setAmount(balance > 0 ? String(balance) : "");
    setPaymentDate(new Date());
    setNotes("");
    setAmountError("");
    setShowDatePicker(false);
  }

  const parsedAmount = parseFloat(amount);
  const isValidAmount =
    amount.trim() !== "" && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const remaining = isValidAmount ? balance - parsedAmount : balance;
  const isFullPayment = isValidAmount && Math.abs(remaining) < 0.01;

  const { mutate: recordPayment, isPending } = useApiMutation({
    mutationFn: () => {
      if (isSettled) {
        throw new Error(`This ${label.toLowerCase()} has no outstanding balance`);
      }
      const payload = {
        amount: parsedAmount,
        payment_date: paymentDate
          ? paymentDate.toISOString().split("T")[0]
          : "",
        notes: notes || undefined,
      };
      if (isAr) {
        return recordArPayment(itemId, payload);
      }
      return recordApPayment(itemId, payload) as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [isAr ? "receivables" : "payables"],
      });
      queryClient.invalidateQueries({ queryKey: ["financial-dashboard"] });
      onVisibleChange(false);
      reset();
    },
  });

  const reset = () => {
    setDraftFor(null);
    setAmount("");
    setPaymentDate(null);
    setShowDatePicker(false);
    setNotes("");
    setAmountError("");
  };

  const handleRecord = () => {
    if (isSettled) return;
    if (!isValidAmount) {
      setAmountError("Enter a valid amount");
      return;
    }
    if (parsedAmount > balance) {
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

  const canSubmit = !isPending && !isSettled;

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
          Record {label} Payment
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

          {isSettled && (
            <View
              style={[
                styles.settledNotice,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Lucide name="check-circle-2" size={16} color="#10b981" />
              <Text style={[styles.settledText, { color: colors.textSecondary }]}>
                This {label.toLowerCase()} is fully paid — there is nothing left
                to record.
              </Text>
            </View>
          )}

          <AppTextInput
            placeholder="Amount"
            value={amount}
            onChangeText={(v) => {
              setAmount(v);
              setAmountError("");
            }}
            leftIcon="banknote"
            keyboardType="numeric"
            error={amountError || undefined}
            editable={!isSettled}
          />

          {isValidAmount && !isFullPayment && (
            <View
              style={[
                styles.remainingRow,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Text style={[styles.remainingLabel, { color: colors.textSecondary }]}>
                Part payment — {`₦${parsedAmount.toLocaleString()}`} of{" "}
                {`₦${balance.toLocaleString()}`}
              </Text>
              <Text style={[styles.remainingValue, { color: colors.text }]}>
                {`₦${Math.max(remaining, 0).toLocaleString()} left`}
              </Text>
            </View>
          )}

          {isValidAmount && !isFullPayment && (
            <Pressable
              style={styles.fullPaymentBtn}
              onPress={() => {
                setAmount(String(balance));
                setAmountError("");
              }}
            >
              <Lucide name="check-check" size={14} color="#3b82f6" />
              <Text style={[styles.fullPaymentText, { color: "#3b82f6" }]}>
                {`Pay full balance (₦${balance.toLocaleString()})`}
              </Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.datePickerButton,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.backgroundSelected,
                opacity: isSettled ? 0.5 : 1,
              },
            ]}
            disabled={isSettled}
            onPress={() => setShowDatePicker(true)}
          >
            <Lucide name="calendar" size={16} color={colors.textSecondary} />
            <Text
              style={[
                styles.datePickerText,
                { color: paymentDate ? colors.text : colors.textSecondary },
              ]}
            >
              {paymentDate
                ? paymentDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Select payment date"}
            </Text>
            <Lucide name="chevron-down" size={16} color={colors.textSecondary} />
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={paymentDate || new Date()}
              mode="date"
              display="compact"
              presentation="dialog"
              onValueChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setPaymentDate(selectedDate);
              }}
              onDismiss={() => setShowDatePicker(false)}
            />
          )}

          <AppTextInput
            placeholder="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            leftIcon="align-left"
            editable={!isSettled}
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
            <Text style={styles.recordBtnText}>
              {isSettled
                ? "Nothing to Record"
                : isFullPayment
                  ? `Record Full ₦${Math.max(parsedAmount || 0, 0).toLocaleString()}`
                  : "Record Part Payment"}
            </Text>
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
  settledNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  settledText: { flex: 1, fontSize: 13 },
  remainingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  remainingLabel: { flex: 1, fontSize: 12 },
  remainingValue: { fontSize: 13, fontWeight: "700" },
  fullPaymentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  fullPaymentText: { fontSize: 13, fontWeight: "600" },
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
