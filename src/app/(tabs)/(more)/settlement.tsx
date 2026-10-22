import {
  createSettlementLink,
  fetchSettlement,
  fetchSettlementBalance,
  SettlementEntry,
} from "@/api/settlement";
import { Colors } from "@/constants/theme";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import { useToast } from "@/hooks/use-toast";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatCurrency = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const methodColors: Record<string, { color: string; bg: string }> = {
  cash: { color: "#059669", bg: "rgba(5, 150, 105, 0.12)" },
  card: { color: "#2563EB", bg: "rgba(37, 99, 235, 0.12)" },
  transfer: { color: "#7C3AED", bg: "rgba(124, 58, 237, 0.12)" },
};

const POLL_MS = 5000;

const SettlementScreen = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  // Only pending settlements are served here: they are what the tenant
  // still owes, and they are what the payment link below clears.
  const [payment, setPayment] = useState<{
    link: string;
    amount: number;
  } | null>(null);

  const {
    data: balance,
    isError,
    error,
  } = useQuery({
    queryKey: ["settlement-balance"],
    queryFn: fetchSettlementBalance,
    // While a settlement link is out in the world, poll until the webhook
    // reports the balance cleared, then the buttons can let go.
    refetchInterval: payment ? POLL_MS : false,
  });

  useApiErrorToast({ isError, error, title: "Couldn't load settlement" });

  const {
    data: settlement,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["settlement", "pending"],
    queryFn: () => fetchSettlement("pending"),
    refetchInterval: payment ? POLL_MS : false,
  });

  const items = (settlement?.items ?? []).filter(
    (item) => item.status === "pending",
  );

  const toast = useToast();

  // Cleared while a link is open: the webhook flipped everything the link
  // stood for. The set-state runs in a timer callback rather than straight
  // in the effect body, which is the sanctioned pattern for reacting to an
  // external system finishing without a cascading render.
  useEffect(() => {
    if (payment && (balance?.pending_balance ?? 0) === 0) {
      const t = setTimeout(() => {
        setPayment(null);
        toast.success("Settlement cleared", "Your pending fees are all paid.");
      }, 0);
      return () => clearTimeout(t);
    }
  }, [payment, balance?.pending_balance, toast]);

  const linkMutation = useMutation({
    mutationFn: createSettlementLink,
    onSuccess: (result) => {
      setPayment({ link: result.link, amount: result.amount });
      toast.success(
        "Payment link ready",
        "Continue to payment when you're ready.",
      );
    },
    onError: (err: Error) => toast.error("Payment link failed", err.message),
  });

  const renderItem = ({ item }: { item: SettlementEntry }) => {
    const method = methodColors[item.payment_method] ?? methodColors.cash;
    const date = new Date(item.created_at).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <View style={[styles.methodBadge, { backgroundColor: method.bg }]}>
              <Lucide
                name={
                  item.payment_method === "cash"
                    ? "banknote"
                    : item.payment_method === "card"
                      ? "credit-card"
                      : "building-2"
                }
                size={14}
                color={method.color}
              />
              <Text style={[styles.methodText, { color: method.color }]}>
                {item.payment_method}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.pending.bg }]}>
              <View
                style={[styles.statusDot, { backgroundColor: statusColors.pending.color }]}
              />
              <Text style={[styles.statusText, { color: statusColors.pending.color }]}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={[styles.amount, { color: colors.text }]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
        <View style={styles.cardBottom}>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {date}
          </Text>
          <Text style={[styles.rate, { color: colors.textSecondary }]}>
            {item.fee_type === "percentage"
              ? `${item.rate}%`
              : formatCurrency(item.rate)}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
      </View>
    );
  }

  const pendingBalance = balance?.pending_balance ?? 0;
  const canPay = pendingBalance > 0 && payment === null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 24,
          gap: 10,
        }}
        ListHeaderComponent={
          <>
            {/* Balance Dashboard */}
            <View
              style={[
                styles.dashboard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.backgroundSelected,
                },
              ]}
            >
              <View style={styles.dashRow}>
                <View style={styles.dashItem}>
                  <View
                    style={[
                      styles.dashIcon,
                      { backgroundColor: "rgba(217,119,6,0.12)" },
                    ]}
                  >
                    <Lucide name="clock" size={16} color="#D97706" />
                  </View>
                  <Text
                    style={[styles.dashLabel, { color: colors.textSecondary }]}
                  >
                    Pending
                  </Text>
                  <Text style={[styles.dashValue, { color: "#D97706" }]}>
                    {formatCurrency(pendingBalance)}
                  </Text>
                </View>
              </View>

              {/* Block Warning */}
              {balance?.is_blocked && (
                <View
                  style={[
                    styles.blockWarning,
                    { backgroundColor: "rgba(220,38,38,0.08)" },
                  ]}
                >
                  <Lucide name="alert-triangle" size={14} color="#DC2626" />
                  <Text style={[styles.blockText, { color: "#DC2626" }]}>
                    Pending fees have reached the limit. New sales may be
                    blocked.
                  </Text>
                </View>
              )}

              {/* Clear Outstanding: one link covering every pending fee.
                  Cleared while a link is still open, the continue button
                  simply drops out — the balance is what it answers to. */}
              {canPay && !payment && (
                <Pressable
                  onPress={() => linkMutation.mutate()}
                  disabled={linkMutation.isPending}
                  style={({ pressed }) => [
                    styles.payButton,
                    pressed && { opacity: 0.85 },
                    linkMutation.isPending && { opacity: 0.6 },
                  ]}
                >
                  {linkMutation.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Lucide name="badge-check" size={16} color="#ffffff" />
                      <Text style={styles.payButtonText}>Clear Outstanding</Text>
                    </>
                  )}
                </Pressable>
              )}

              {/* Continue to payment: the gateway link for the summed
                  amounts, plus a copy fallback for restricted browsers */}
              {payment && pendingBalance > 0 && (
                <View style={styles.payGroup}>
                  <Pressable
                    onPress={() => {
                      void Linking.openURL(payment.link);
                    }}
                    style={({ pressed }) => [
                      styles.payButton,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Lucide name="external-link" size={16} color="#ffffff" />
                    <Text style={styles.payButtonText}>
                      Continue to payment · {formatCurrency(payment.amount)}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      await Clipboard.setStringAsync(payment.link);
                    }}
                    style={({ pressed }) => [
                      styles.payButtonGhost,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Lucide
                      name={isDark ? "copy" : "copy"}
                      size={14}
                      color={colors.buttonPrimary}
                    />
                    <Text
                      style={[styles.payGhostText, { color: colors.buttonPrimary }]}
                    >
                      Copy link
                    </Text>
                  </Pressable>
                  {payment.amount !== pendingBalance && (
                    <Text
                      style={[styles.payNote, { color: colors.textSecondary }]}
                    >
                      The link covers ₦
                      {payment.amount.toLocaleString()} — pay it in full so
                      every fee above clears.
                    </Text>
                  )}
                  <Text style={[styles.payNote, { color: colors.textSecondary }]}>
                    This screen refreshes itself once the payment lands.
                  </Text>
                </View>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Lucide
              name="check-circle"
              size={40}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {payment
                ? "Payment received — all pending fees are settled"
                : "No pending fees. You're all settled."}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={colors.buttonPrimary}
          />
        }
      />
    </View>
  );
};

const statusColors: Record<string, { color: string; bg: string }> = {
  pending: { color: "#D97706", bg: "rgba(217, 119, 6, 0.12)" },
  deducted: { color: "#059669", bg: "rgba(5, 150, 105, 0.12)" },
};

export default SettlementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dashboard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  dashRow: {
    flexDirection: "row",
    gap: 12,
  },
  dashItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  dashIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dashLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  dashValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  blockWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  blockText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  payButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  payGroup: {
    gap: 10,
  },
  payButtonGhost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.35)",
    paddingVertical: 10,
  },
  payGhostText: {
    fontSize: 13,
    fontWeight: "600",
  },
  payNote: {
    fontSize: 11,
    textAlign: "center",
  },
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  methodText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
  },
  rate: {
    fontSize: 12,
    fontWeight: "500",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
