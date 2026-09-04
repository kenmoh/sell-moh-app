import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { ColorPalette, Colors } from "@/constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";

type PaymentAwaitingParams = {
  saleId: string;
  paymentId: string;
  method: "card" | "transfer";
  amount: string;
  qrCode?: string;
  txRef?: string;
  accountNumber?: string;
  bankName?: string;
  expiryDate?: string;
};

export default function PaymentAwaitingScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];
  const router = useRouter();

  const params = useLocalSearchParams<PaymentAwaitingParams>();
  const {
    saleId,
    paymentId,
    method,
    amount,
    qrCode,
    txRef,
    accountNumber,
    bankName,
    expiryDate,
  } = params;

  const [copied, setCopied] = useState(false);
  const { data: status, error, isPolling } = usePaymentStatus(saleId, true);

  useEffect(() => {
    if (status?.status === "completed") {
      Alert.alert("Payment Confirmed", "Payment received successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/(pos)"),
        },
      ]);
    }
  }, [status?.status, router]);

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Lucide name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Receive money</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* QR Code section — shown for card payments */}
        {method === "card" && qrCode ? (
          <View style={[styles.qrCard, { backgroundColor: colors.backgroundElement }]}>
            <View style={styles.qrWrapper}>
              <Image
                source={{ uri: `data:image/png;base64,${qrCode}` }}
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.qrLabel, { color: colors.textSecondary }]}>
              Scan to pay this account
            </Text>
          </View>
        ) : method === "card" ? (
          <View style={[styles.qrCard, { backgroundColor: colors.backgroundElement }]}>
            <ActivityIndicator size="large" color={colors.buttonPrimary} />
            <Text style={[styles.qrLabel, { color: colors.textSecondary }]}>
              Generating QR code...
            </Text>
          </View>
        ) : null}

        {/* Transfer details — shown for transfer payments */}
        {method === "transfer" && (
          <View style={styles.transferSection}>
            {/* Account Name */}
            <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Account name
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                StoreFlow Payment
              </Text>
            </View>

            {/* Account Number */}
            <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Account number
              </Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {accountNumber || "Generating..."}
                </Text>
                {accountNumber && (
                  <TouchableOpacity
                    onPress={() => handleCopy(accountNumber)}
                    style={styles.copyBtn}
                  >
                    <Lucide
                      name={copied ? "check" : "copy"}
                      size={20}
                      color={copied ? "#10b981" : colors.buttonPrimary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Bank Name */}
            {bankName ? (
              <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Bank
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {bankName}
                </Text>
              </View>
            ) : null}

            {/* Amount */}
            <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Amount
              </Text>
              <Text style={[styles.detailValue, { color: colors.buttonPrimary }]}>
                ₦{parseFloat(amount).toLocaleString()}
              </Text>
            </View>

            {/* Expiration */}
            {expiryDate ? (
              <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Expires
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {expiryDate}
                </Text>
              </View>
            ) : null}

            {/* Tx Ref */}
            {txRef ? (
              <View style={[styles.detailCard, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Reference
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailValue, { color: colors.text, flex: 1 }]}>
                    {txRef}
                  </Text>
                  <TouchableOpacity onPress={() => handleCopy(txRef)} style={styles.copyBtn}>
                    <Lucide
                      name={copied ? "check" : "copy"}
                      size={20}
                      color={copied ? "#10b981" : colors.buttonPrimary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* Polling indicator */}
        <View style={styles.pollingRow}>
          <ActivityIndicator size="small" color={colors.buttonPrimary} />
          <Text style={[styles.pollingText, { color: colors.textSecondary }]}>
            Waiting for payment...
          </Text>
        </View>

        {/* Cancel button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.cancelBtn, { borderColor: colors.backgroundElement }]}
        >
          <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  qrCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  qrWrapper: {
    width: 220,
    height: 220,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  qrLabel: {
    marginTop: 16,
    fontSize: 14,
  },
  transferSection: {
    gap: 12,
  },
  detailCard: {
    borderRadius: 12,
    padding: 16,
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
    paddingVertical: 16,
  },
  pollingText: {
    fontSize: 14,
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
