import { confirmPayment, switchPaymentMethod } from "@/api/payments";
import { Colors, ColorPalette } from "@/constants/theme";
import { useSession } from "@/lib/ctx";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { InitiatePaymentResult, PendingPayment } from "@/types/payments";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import AppBottomSheet from "./bottom-sheet";

interface PaymentDetailsSheetProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  payment: PendingPayment | null;
}

const METHODS = [
  { key: "cash", label: "Cash", icon: "banknote" },
  { key: "card", label: "Card", icon: "credit-card" },
  { key: "transfer", label: "Transfer", icon: "building-2" },
] as const;

export default function PaymentDetailsSheet({
  visible,
  onVisibleChange,
  payment,
}: PaymentDetailsSheetProps) {
  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];
  const [copied, setCopied] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [activeIntent, setActiveIntent] = useState<InitiatePaymentResult | null>(null);
  const queryClient = useQueryClient();
  const { user } = useSession();

  // Reset activeIntent when a different payment is selected
  useEffect(() => {
    setActiveIntent(null);
  }, [payment?.intent_id]);

  // Derive display data: activeIntent overrides payment prop
  const display = useMemo(() => {
    if (!payment) return null;
    if (!activeIntent) return payment;

    return {
      ...payment,
      intent_id: activeIntent.intent_id,
      method: activeIntent.method,
      amount: activeIntent.amount,
      tx_ref: activeIntent.tx_ref,
      authorization_url: activeIntent.payment_url ?? payment.authorization_url,
      qr_code_base64: activeIntent.qr_code_base64 ?? payment.qr_code_base64,
      account_number: activeIntent.account_number ?? payment.account_number,
      bank_name: activeIntent.bank_name ?? payment.bank_name,
      expiry_date: activeIntent.expiry_date ?? payment.expiry_date,
    };
  }, [payment, activeIntent]);

  // Poll using the active intent_id
  const activeIntentId = display?.intent_id ?? null;
  const { data: status } = usePaymentStatus(
    activeIntentId,
    visible && !!activeIntentId,
  );

  useEffect(() => {
    if (status?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      onVisibleChange(false);
    }
  }, [status?.status, onVisibleChange, queryClient]);

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchMethod = async (newMethod: string) => {
    if (!display || switching || paying) return;
    if (newMethod === display.method) return; // Already active

    Alert.alert(
      "Switch Payment Method",
      `Switch from ${display.method} to ${newMethod}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          onPress: async () => {
            try {
              setSwitching(newMethod);
              const result = await switchPaymentMethod(
                display.intent_id,
                newMethod as "card" | "transfer" | "cash",
                user?.email ?? "",
              );
              // Store the new intent data — sheet stays open
              setActiveIntent(result);
              await queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
            } catch (e: any) {
              // If intent is already completed/cancelled, close and refresh
              const msg = e?.message || "";
              if (msg.includes("not pending") || msg.includes("not found")) {
                await queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
                onVisibleChange(false);
                return;
              }
              Alert.alert("Error", msg || "Failed to switch method");
            } finally {
              setSwitching(null);
            }
          },
        },
      ],
    );
  };

  const handlePayNow = async () => {
    if (!display || paying) return;

    try {
      setPaying(true);

      if (display.method === "cash") {
        await confirmPayment({ intent_id: display.intent_id });
        await queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
        Alert.alert("Success", "Payment confirmed");
        onVisibleChange(false);
      } else if (display.method === "card") {
        const url = display.authorization_url;
        if (url) {
          await Clipboard.setStringAsync(url);
          Alert.alert("Copied", "Payment link copied to clipboard");
        }
      } else if (display.method === "transfer") {
        if (display.account_number) {
          await Clipboard.setStringAsync(display.account_number);
          Alert.alert("Copied", "Account number copied to clipboard");
        }
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (!display) return null;

  return (
    <AppBottomSheet
      visible={visible}
      onVisibleChange={onVisibleChange}
      snapPoints={["60%", "85%"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {display.sale_number || "Payment Details"}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: "#FEF3C7" }]}>
          <Text style={[styles.statusText, { color: "#92400E" }]}>Pending</Text>
        </View>
      </View>

      {/* Amount */}
      <View style={[styles.amountCard, { backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
          Amount
        </Text>
        <Text style={[styles.amountValue, { color: colors.buttonPrimary }]}>
          ₦{display.amount.toLocaleString()}
        </Text>
      </View>

      {/* Method selector pills — always show all 3 */}
      <View style={styles.methodSection}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Payment method
        </Text>
        <View style={styles.methodPills}>
          {METHODS.map((m) => {
            const isActive = m.key === display.method;
            const isSwitching = switching === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.methodPill,
                  {
                    backgroundColor: isActive
                      ? colors.buttonPrimary
                      : colors.backgroundElement,
                    borderColor: isActive
                      ? colors.buttonPrimary
                      : colors.backgroundSelected,
                    opacity: isSwitching ? 0.6 : 1,
                  },
                ]}
                onPress={() => handleSwitchMethod(m.key)}
                disabled={!!switching || !!paying || isActive}
              >
                {isSwitching ? (
                  <ActivityIndicator
                    size="small"
                    color={isActive ? "#fff" : colors.buttonPrimary}
                  />
                ) : (
                  <Lucide
                    name={m.icon as any}
                    size={18}
                    color={isActive ? "#fff" : colors.buttonPrimary}
                  />
                )}
                <Text
                  style={[
                    styles.methodPillText,
                    { color: isActive ? "#fff" : colors.text },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Method-specific content */}
      {display.method === "cash" && (
        <View style={styles.methodContent}>
          <View style={[styles.methodInfoCard, { backgroundColor: colors.backgroundElement }]}>
            <Lucide name="banknote" size={32} color={colors.buttonPrimary} />
            <Text style={[styles.methodInfoTitle, { color: colors.text }]}>
              Cash Payment
            </Text>
            <Text style={[styles.methodInfoSubtitle, { color: colors.textSecondary }]}>
              Collect cash from the customer, then confirm below.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.payNowBtn,
              { backgroundColor: colors.buttonPrimary, opacity: paying ? 0.6 : 1 },
            ]}
            onPress={handlePayNow}
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Lucide name="check-circle" size={18} color="#fff" />
            )}
            <Text style={styles.payNowText}>
              {paying ? "Confirming..." : "Confirm Cash Payment"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {display.method === "card" && (
        <View style={styles.methodContent}>
          {display.qr_code_base64 && (
            <View style={[styles.qrCard, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.qrWrapper}>
                <Image
                  source={{ uri: `data:image/png;base64,${display.qr_code_base64}` }}
                  style={styles.qrCode}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.qrLabel, { color: colors.textSecondary }]}>
                Scan to pay
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.payNowBtn,
              { backgroundColor: colors.buttonPrimary },
            ]}
            onPress={handlePayNow}
          >
            <Lucide name="copy" size={18} color="#fff" />
            <Text style={styles.payNowText}>Copy Payment Link</Text>
          </TouchableOpacity>
        </View>
      )}

      {display.method === "transfer" && (
        <View style={styles.methodContent}>
          <View style={styles.detailsSection}>
            {display.account_number && (
              <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Account number
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {display.account_number}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleCopy(display.account_number!)}
                    style={styles.copyBtn}
                  >
                    <Lucide
                      name={copied ? "check" : "copy"}
                      size={20}
                      color={copied ? "#10b981" : colors.buttonPrimary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {display.bank_name && (
              <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Bank
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {display.bank_name}
                </Text>
              </View>
            )}

            {display.tx_ref && (
              <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Reference
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailValue, { color: colors.text, flex: 1 }]}>
                    {display.tx_ref}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleCopy(display.tx_ref!)}
                    style={styles.copyBtn}
                  >
                    <Lucide
                      name={copied ? "check" : "copy"}
                      size={20}
                      color={copied ? "#10b981" : colors.buttonPrimary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.payNowBtn,
              { backgroundColor: colors.buttonPrimary },
            ]}
            onPress={handlePayNow}
          >
            <Lucide name="copy" size={18} color="#fff" />
            <Text style={styles.payNowText}>Copy Account Number</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Polling indicator */}
      <View style={styles.pollingRow}>
        <ActivityIndicator size="small" color={colors.buttonPrimary} />
        <Text style={[styles.pollingText, { color: colors.textSecondary }]}>
          Waiting for payment...
        </Text>
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  amountCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  methodSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  methodPills: {
    flexDirection: "row",
    gap: 8,
  },
  methodPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  methodPillText: {
    fontSize: 14,
    fontWeight: "500",
  },
  methodContent: {
    gap: 12,
    marginBottom: 16,
  },
  methodInfoCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  methodInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  methodInfoSubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  payNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  payNowText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  qrCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  qrWrapper: {
    width: 200,
    height: 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  qrCode: {
    width: 180,
    height: 180,
  },
  qrLabel: {
    marginTop: 12,
    fontSize: 14,
  },
  detailsSection: {
    gap: 10,
  },
  detailCard: {
    borderRadius: 12,
    padding: 14,
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  copyBtn: {
    padding: 8,
  },
  pollingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  pollingText: {
    fontSize: 14,
  },
});
