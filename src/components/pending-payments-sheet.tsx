import { Colors, ColorPalette } from "@/constants/theme";
import { usePendingPayments } from "@/hooks/usePendingPayments";
import { PendingPayment } from "@/types/payments";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import AppBottomSheet from "./bottom-sheet";
import PaymentDetailsSheet from "./payment-details-sheet";

interface PendingPaymentsSheetProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}

function formatTimeElapsed(isoString: string): string {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function MethodIcon({ method }: { method: string }) {
  const iconName =
    method === "card"
      ? "credit-card"
      : method === "transfer"
        ? "bank"
        : "banknote";
  return <Lucide name={iconName as any} size={20} color="#60646C" />;
}

export default function PendingPaymentsSheet({
  visible,
  onVisibleChange,
}: PendingPaymentsSheetProps) {
  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];
  const { pendingPayments, count, isLoading } = usePendingPayments(visible);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const handleSelectPayment = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setDetailsVisible(true);
  };

  return (
    <>
      <AppBottomSheet
        visible={visible}
        onVisibleChange={onVisibleChange}
        snapPoints={["50%", "80%"]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Pending Payments
          </Text>
          {count > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.buttonPrimary }]}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.buttonPrimary} />
          </View>
        ) : pendingPayments.length === 0 ? (
          <View style={styles.centered}>
            <Lucide name="check-circle" size={48} color="#10b981" />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No pending payments
            </Text>
          </View>
        ) : (
          pendingPayments.map((payment) => (
            <TouchableOpacity
              key={payment.sale_id}
              style={[styles.card, { backgroundColor: colors.backgroundElement }]}
              onPress={() => handleSelectPayment(payment)}
            >
              <View style={styles.cardLeft}>
                <MethodIcon method={payment.method} />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {payment.sale_number || "Sale"}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                    {payment.method.toUpperCase()} · {formatTimeElapsed(payment.created_at)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.cardAmount, { color: colors.text }]}>
                ₦{payment.amount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </AppBottomSheet>

      <PaymentDetailsSheet
        visible={detailsVisible}
        onVisibleChange={setDetailsVisible}
        payment={selectedPayment}
      />
    </>
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
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
});
