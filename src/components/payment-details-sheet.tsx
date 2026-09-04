import { Colors, ColorPalette } from "@/constants/theme";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { PendingPayment } from "@/types/payments";
import { Lucide } from "@react-native-vector-icons/lucide";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export default function PaymentDetailsSheet({
  visible,
  onVisibleChange,
  payment,
}: PaymentDetailsSheetProps) {
  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];
  const [copied, setCopied] = useState(false);

  const { data: status } = usePaymentStatus(
    payment?.sale_id ?? null,
    visible && !!payment?.sale_id,
  );

  useEffect(() => {
    if (status?.status === "completed") {
      onVisibleChange(false);
    }
  }, [status?.status, onVisibleChange]);

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!payment) return null;

  return (
    <AppBottomSheet
      visible={visible}
      onVisibleChange={onVisibleChange}
      snapPoints={["60%", "85%"]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {payment.sale_number || "Payment Details"}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: "#FEF3C7" }]}>
          <Text style={[styles.statusText, { color: "#92400E" }]}>Pending</Text>
        </View>
      </View>

      {/* QR Code for card payments */}
      {payment.method === "card" && payment.qr_code_base64 && (
        <View style={[styles.qrCard, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.qrWrapper}>
            <Image
              source={{ uri: `data:image/png;base64,${payment.qr_code_base64}` }}
              style={styles.qrCode}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.qrLabel, { color: colors.textSecondary }]}>
            Scan to pay this account
          </Text>
        </View>
      )}

      {/* Transfer details */}
      {payment.method === "transfer" && (
        <View style={styles.detailsSection}>
          {payment.account_number && (
            <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Account number
              </Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {payment.account_number}
                </Text>
                <TouchableOpacity
                  onPress={() => handleCopy(payment.account_number!)}
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

          {payment.bank_name && (
            <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Bank
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {payment.bank_name}
              </Text>
            </View>
          )}

          {payment.tx_ref && (
            <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Reference
              </Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailValue, { color: colors.text, flex: 1 }]}>
                  {payment.tx_ref}
                </Text>
                <TouchableOpacity
                  onPress={() => handleCopy(payment.tx_ref!)}
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
      )}

      {/* Amount */}
      <View style={[styles.amountCard, { backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
          Amount
        </Text>
        <Text style={[styles.amountValue, { color: colors.buttonPrimary }]}>
          ₦{payment.amount.toLocaleString()}
        </Text>
      </View>

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
  qrCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
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
    marginBottom: 16,
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
    fontSize: 20,
    fontWeight: "700",
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
