import {
  fetchSettlement,
  fetchSettlementBalance,
  SettlementEntry,
} from "@/api/settlement";
import Pill from "@/components/pill";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Filter = "all" | "pending" | "deducted";

const formatCurrency = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const methodColors: Record<string, { color: string; bg: string }> = {
  cash: { color: "#059669", bg: "rgba(5, 150, 105, 0.12)" },
  card: { color: "#2563EB", bg: "rgba(37, 99, 235, 0.12)" },
  transfer: { color: "#7C3AED", bg: "rgba(124, 58, 237, 0.12)" },
};

const statusColors: Record<string, { color: string; bg: string }> = {
  pending: { color: "#D97706", bg: "rgba(217, 119, 6, 0.12)" },
  deducted: { color: "#059669", bg: "rgba(5, 150, 105, 0.12)" },
};

const SettlementScreen = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const [filter, setFilter] = useState<Filter>("all");

  const { data: balance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ["settlement-balance"],
    queryFn: fetchSettlementBalance,
  });

  const {
    data: settlement,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["settlement", filter],
    queryFn: () => fetchSettlement(filter === "all" ? undefined : filter),
  });

  const items = useMemo(() => settlement?.items ?? [], [settlement?.items]);

  const renderItem = ({ item }: { item: SettlementEntry }) => {
    const method = methodColors[item.payment_method] ?? methodColors.cash;
    const status = statusColors[item.status] ?? statusColors.pending;
    const date = new Date(item.created_at).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.backgroundSelected,
          },
        ]}
      >
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
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <View
                style={[styles.statusDot, { backgroundColor: status.color }]}
              />
              <Text style={[styles.statusText, { color: status.color }]}>
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 16,
          // paddingTop: insets.top + 8,
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
                    {formatCurrency(balance?.pending_balance ?? 0)}
                  </Text>
                </View>
                <View style={styles.dashItem}>
                  <View
                    style={[
                      styles.dashIcon,
                      { backgroundColor: "rgba(5,150,105,0.12)" },
                    ]}
                  >
                    <Lucide name="check-circle" size={16} color="#059669" />
                  </View>
                  <Text
                    style={[styles.dashLabel, { color: colors.textSecondary }]}
                  >
                    Deducted
                  </Text>
                  <Text style={[styles.dashValue, { color: "#059669" }]}>
                    {formatCurrency(settlement?.total_deducted ?? 0)}
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
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              <Pill
                label="All"
                active={filter === "all"}
                onPress={() => setFilter("all")}
                badge={settlement?.total}
              />
              <Pill
                label="Pending"
                active={filter === "pending"}
                onPress={() => setFilter("pending")}
              />
              <Pill
                label="Deducted"
                active={filter === "deducted"}
                onPress={() => setFilter("deducted")}
              />
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
              No {filter !== "all" ? filter : ""} entries
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.buttonPrimary}
          />
        }
      />
    </View>
  );
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
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 10,
  },
  card: {
    borderWidth: 1,
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
