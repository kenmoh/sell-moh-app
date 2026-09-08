import { fetchCashierPerformance } from "@/api/reports";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ReportCashiers = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const router = useRouter();

  const fromDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  }, []);
  const toDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const {
    data: cashiers = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["reports-cashier-performance", fromDate, toDate],
    queryFn: () => fetchCashierPerformance(fromDate, toDate, 20),
  });

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Lucide name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Cashier Performance
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {cashiers.map((item) => (
          <View
            key={item.user_id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#282b32" : "#eef0f4",
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: "rgba(59,130,246,0.12)" },
                ]}
              >
                <Text style={[styles.avatarText, { color: "#3b82f6" }]}>
                  {item.user_id.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: colors.text }]}>
                  {item.user_id}
                </Text>
                <Text
                  style={[styles.cardSub, { color: colors.textSecondary }]}
                >
                  {item.sales_count} sales
                </Text>
              </View>
              <Text style={[styles.revenueText, { color: "#10b981" }]}>
                ₦{item.total_revenue.toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.cardFooter,
                { borderTopColor: isDark ? "#22252a" : "#f0f2f5" },
              ]}
            >
              <View style={styles.footerStat}>
                <Lucide name="shopping-bag" size={12} color={colors.textSecondary} />
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  {item.sales_count} orders
                </Text>
              </View>
              <View style={styles.footerStat}>
                <Lucide name="trending-up" size={12} color={colors.textSecondary} />
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  ₦{item.avg_transaction.toLocaleString()} avg
                </Text>
              </View>
              <View style={styles.footerStat}>
                <Lucide name="x-circle" size={12} color={colors.textSecondary} />
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  {item.void_count} voids
                </Text>
              </View>
            </View>
          </View>
        ))}

        {cashiers.length === 0 && (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconBadge,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Lucide name="users" size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Cashiers Found
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              No cashier data available for this period.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReportCashiers;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: "700" },
  cardSub: { fontSize: 13, marginTop: 2 },
  revenueText: { fontSize: 14, fontWeight: "800" },
  cardFooter: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerStat: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  footerText: { fontSize: 12 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
});
