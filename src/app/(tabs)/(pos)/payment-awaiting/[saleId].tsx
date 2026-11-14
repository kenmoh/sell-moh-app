import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { cancelPendingIntents, confirmPayment } from "@/api/payments";
import { ColorPalette, Colors } from "@/constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
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
  qrCode?: string;
};

export default function PaymentAwaitingScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];
  const router = useRouter();

  const params = useLocalSearchParams<PaymentAwaitingParams>();
  const {
    saleId,
    qrCode,
  } = params;

  const { data: status } = usePaymentStatus(saleId, true);

  useEffect(() => {
    if (status?.status === "completed") {
      confirmPayment({ intent_id: saleId }).then((result) => {
        const r = result?.receipt;
        if (r) {
          router.replace({
            pathname: "/(tabs)/(pos)/receipt",
            params: {
              receiptNumber: r.receipt_number,
              businessName: r.business_name,
              businessPhone: r.business_phone,
              storeName: r.store_name,
              storeAddress: r.store_address,
              saleNumber: r.sale_number,
              createdAt: r.created_at,
              customerName: r.customer_name ?? "",
              items: JSON.stringify(r.items),
              subtotal: String(r.subtotal),
              discount: String(r.discount),
              tax: String(r.tax),
              taxBreakdown: JSON.stringify(r.tax_breakdown ?? []),
              total: String(r.total),
              amountPaid: String(r.amount_paid),
              paymentMethod: r.payment_method,
            },
          });
        } else {
          router.replace("/(tabs)/(pos)");
        }
      }).catch(() => {
        router.replace("/(tabs)/(pos)");
      });
    }
  }, [status?.status, router, saleId]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Lucide name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Receive money
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Code — hosted link for card, details page for transfer */}
        {/* QR Code */}
        {qrCode ? (
          <>
            <View
              style={[
                styles.qrCard,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
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
          </>
        ) : (
          <>
            <ActivityIndicator
              size="large"
              color={colors.buttonPrimary}
            />
            <Text
              style={[styles.qrLabel, { color: colors.textSecondary }]}
            >
              Generating QR code...
            </Text>
          </>
        )}

        {/* Polling indicator */}
        <View style={styles.pollingRow}>
          <ActivityIndicator size="small" color={colors.buttonPrimary} />
          <Text
            style={[styles.pollingText, { color: colors.textSecondary }]}
          >
            Waiting for payment...
          </Text>
        </View>
      </ScrollView>

      {/* Cancel button — fixed at bottom */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={async () => {
            try {
              await cancelPendingIntents(saleId);
            } catch {}
            router.back();
          }}
          style={[styles.cancelBtn, { borderColor: colors.backgroundElement }]}
        >
          <Text style={[styles.cancelText, { color: colors.text }]}>
            Cancel
          </Text>
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
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  transferSection: {
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
    paddingVertical: 16,
  },
  pollingText: {
    fontSize: 14,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
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
