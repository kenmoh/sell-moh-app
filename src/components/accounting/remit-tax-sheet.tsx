import { fetchTaxesOwed } from "@/api/accounting";
import AppBottomSheet from "@/components/bottom-sheet";
import { Button } from "@/components/button";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { useActiveStore } from "@/lib/store-context";
import type { TaxRemitRequest } from "@/types/accounting";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const METHODS = [
  {
    key: "cash",
    label: "Cash",
    icon: "banknote",
    desc: "Paid out of the till",
  },
  { key: "bank", label: "Bank", icon: "landmark", desc: "Bank transfer" },
] as const;

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  isPending?: boolean;
  onSubmit: (payload: TaxRemitRequest) => void;
};

const RemitTaxSheet = ({
  visible,
  onVisibleChange,
  isPending,
  onSubmit,
}: Props) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const { stores, activeStoreId, activeStoreName } = useActiveStore();

  // The active store stays when a concrete one is viewing; under All Stores
  // the sheet picks which store's tax is being remitted (it names a concrete
  // store on every post, so Nothing is untagged).
  const defaultStoreId = activeStoreId ?? stores[0]?.id ?? "";
  const [storeIdChoice, setStoreIdChoice] = useState<string | null>(null);
  const remitStoreId = storeIdChoice ?? defaultStoreId;
  const remitStoreName =
    stores.find((s) => s.id === remitStoreId)?.name ?? activeStoreName;

  const [accountCode, setAccountCode] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [method, setMethod] = useState<"cash" | "bank">("cash");
  const [notes, setNotes] = useState("");

  // ── Owed balances for the remitting store ──────────────────────────────
  const { data: owedLines = [], isPending: isLoadingLines } = useQuery({
    queryKey: ["taxes-owed", remitStoreId],
    queryFn: () => fetchTaxesOwed(remitStoreId),
    enabled: visible && !!remitStoreId,
  });

  // Nulls fall back to the first account and its still-owed amount, so an
  // opening sheet is always prefilled without rewriting state in an effect.
  const selectedCode = accountCode ?? owedLines[0]?.account_code ?? null;
  const line = owedLines.find((l) => l.account_code === selectedCode) ?? null;
  const amountText = amount ?? (line ? String(line.still_owed) : "");
  const parsedAmount = parseFloat(amountText) || 0;
  const overCeiling = line ? parsedAmount - line.still_owed > 0.009 : false;

  const pickStore = (id: string) => {
    setStoreIdChoice(id);
    setAccountCode(null);
    setAmount(null);
  };

  const reset = () => {
    setStoreIdChoice(null);
    setAccountCode(null);
    setAmount(null);
    setMethod("cash");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!line || parsedAmount <= 0 || overCeiling || isPending) return;
    const paymentDate = new Date().toISOString().split("T")[0];
    onSubmit({
      account_code: line.account_code,
      amount: parsedAmount,
      payment_date: paymentDate,
      method,
      notes: notes.trim() || undefined,
      store_id: remitStoreId,
    });
  };

  return (
    <AppBottomSheet
      visible={visible}
      index={1}
      onVisibleChange={(v) => {
        if (!v) reset();
        onVisibleChange(v);
      }}
    >
      <Text style={[styles.title, { color: colors.text }]}>Remit Tax</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Record tax paid to the authority; the ledger keeps the running balance
      </Text>

      {/* Store (pickable only while All Stores is viewing) */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Remitting from
      </Text>
      {activeStoreId ? (
        <View style={styles.storeRow}>
          <Lucide name="store" size={13} color={colors.textSecondary} />
          <Text style={[styles.storeName, { color: colors.textSecondary }]}>
            {remitStoreName}
          </Text>
        </View>
      ) : (
        <View style={styles.storeChips}>
          {stores.map((s) => {
            const isSelected = s.id === remitStoreId;
            return (
              <Pressable
                key={s.id}
                style={[
                  styles.storeChip,
                  {
                    backgroundColor: isSelected
                      ? "transparent"
                      : colors.textInput,
                    borderColor: isSelected
                      ? colors.buttonPrimary
                      : isDark
                        ? "#282b32"
                        : "#eef0f4",
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
                onPress={() => pickStore(s.id)}
              >
                <Text
                  style={[
                    styles.storeChipName,
                    { color: isSelected ? colors.buttonPrimary : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {s.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Account select */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Tax account
      </Text>
      {isLoadingLines ? (
        <ActivityIndicator size="small" />
      ) : owedLines.length === 0 ? (
        <Text style={[styles.emptyLines, { color: colors.textSecondary }]}>
          No tax is owed by {remitStoreName}
        </Text>
      ) : (
        <View style={styles.accountChips}>
          {owedLines.map((l) => {
            const isSelected = l.account_code === selectedCode;
            return (
              <Pressable
                key={l.account_code}
                style={[
                  styles.accountChip,
                  {
                    backgroundColor: isSelected
                      ? "transparent"
                      : colors.textInput,
                    borderColor: isSelected
                      ? colors.buttonPrimary
                      : isDark
                        ? "#282b32"
                        : "#eef0f4",
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
                onPress={() => {
                  setAccountCode(l.account_code);
                  setAmount(String(l.still_owed));
                }}
              >
                <Text
                  style={[
                    styles.accountChipCode,
                    {
                      color: isSelected
                        ? colors.buttonPrimary
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {l.account_code}
                </Text>
                <Text
                  style={[
                    styles.accountChipName,
                    { color: isSelected ? colors.buttonPrimary : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {l.account_name}
                </Text>
                <Text
                  style={[
                    styles.accountChipOwed,
                    { color: isSelected ? colors.buttonPrimary : "#10b981" },
                  ]}
                >
                  ₦{l.still_owed.toLocaleString()} owed
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Selected line context */}
      {line && (
        <View
          style={[
            styles.contextCard,
            {
              backgroundColor: colors.textInput,
              borderColor: isDark ? "#282b32" : "#eef0f4",
            },
          ]}
        >
          <View style={styles.contextRow}>
            <Text
              style={[styles.contextLabel, { color: colors.textSecondary }]}
            >
              Collected
            </Text>
            <Text style={[styles.contextValue, { color: colors.text }]}>
              ₦{line.collected.toLocaleString()}
            </Text>
          </View>
          <View style={styles.contextRow}>
            <Text
              style={[styles.contextLabel, { color: colors.textSecondary }]}
            >
              Already remitted
            </Text>
            <Text style={[styles.contextValue, { color: "#0ea5e9" }]}>
              ₦{line.remitted.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.contextRow, styles.contextLast]}>
            <Text
              style={[styles.contextLabel, { color: colors.textSecondary }]}
            >
              Still owed
            </Text>
            <Text style={[styles.contextValue, { color: "#10b981" }]}>
              ₦{line.still_owed.toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Amount */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Amount
      </Text>
      <AppTextInput
        placeholder="0"
        value={amountText}
        onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        leftIcon="banknote"
      />
      {line && overCeiling && (
        <Text style={styles.overWarning}>
          More than the ₦{line.still_owed.toLocaleString()} still owed on this
          account
        </Text>
      )}

      {/* Method */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Payment method
      </Text>
      <View style={styles.methodRow}>
        {METHODS.map((m) => {
          const isSelected = method === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMethod(m.key)}
              style={[
                styles.methodPill,
                {
                  backgroundColor: isSelected
                    ? "transparent"
                    : colors.textInput,
                  borderColor: isSelected
                    ? colors.buttonPrimary
                    : isDark
                      ? "#282b32"
                      : "#eef0f4",
                  borderWidth: isSelected ? 1.5 : 1,
                },
              ]}
            >
              <Lucide
                name={m.icon}
                size={16}
                color={isSelected ? colors.buttonPrimary : colors.textSecondary}
              />
              <View style={styles.methodText}>
                <Text
                  style={[
                    styles.methodLabel,
                    {
                      color: isSelected ? colors.buttonPrimary : colors.text,
                    },
                  ]}
                >
                  {m.label}
                </Text>
                <Text
                  style={[styles.methodDesc, { color: colors.textSecondary }]}
                >
                  {m.desc}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Notes */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Notes (optional)
      </Text>
      <AppTextInput
        placeholder="e.g. VAT transfer FIRS"
        value={notes}
        onChangeText={setNotes}
      />

      <Button
        disabled={!line || parsedAmount <= 0 || overCeiling}
        fullWidth
        leftIcon={(color) => <Lucide name="send" size={18} color={color} />}
        loading={isPending}
        loadingTitle="Posting..."
        onPress={handleSubmit}
        style={{ marginTop: 14 }}
        title="Record Remittance"
      />
    </AppBottomSheet>
  );
};

export default RemitTaxSheet;

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700" },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  storeName: { fontSize: 12, fontWeight: "600" },
  storeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  storeChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: "48%",
  },
  storeChipName: { fontSize: 12, fontWeight: "600" },
  emptyLines: { fontSize: 13, marginTop: 4 },
  subtitle: { fontSize: 13, marginBottom: 12 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 6,
  },
  accountChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  accountChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  accountChipCode: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  accountChipName: {
    fontSize: 12,
    fontWeight: "600",
    maxWidth: 140,
    marginTop: 2,
  },
  accountChipOwed: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  contextCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  contextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  contextLast: { borderBottomWidth: 0 },
  contextLabel: { fontSize: 12 },
  contextValue: { fontSize: 13, fontWeight: "700" },
  overWarning: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: -6,
    marginBottom: 4,
  },
  methodRow: { flexDirection: "row", gap: 8 },
  methodPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  methodText: { flex: 1 },
  methodLabel: { fontSize: 13, fontWeight: "700" },
  methodDesc: { fontSize: 11, marginTop: 1 },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 14,
  },
  confirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
