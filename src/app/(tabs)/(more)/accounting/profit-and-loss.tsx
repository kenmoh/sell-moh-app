import { fetchProfitAndLoss } from "@/api/accounting";
import InfoTooltip from "@/components/info-tooltip";
import { Colors } from "@/constants/theme";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PnLLineItem } from "@/types/accounting";

const ProfitAndLoss = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const router = useRouter();

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const from = fromDate.toISOString().split("T")[0];
  const to = toDate.toISOString().split("T")[0];

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const { data, isLoading } = useQuery({
    queryKey: ["profit-and-loss", from, to],
    queryFn: () => fetchProfitAndLoss(from, to),
  });

  const netProfit = (data?.total_revenue ?? 0) - (data?.total_expenses ?? 0);
  const isProfit = netProfit >= 0;

  const sections = useMemo(() => {
    if (!data) return [];
    return [
      { title: "Revenue", items: data.revenue, total: data.total_revenue, color: "#3b82f6", icon: "trending-up" },
      { title: "Expenses", items: data.expenses, total: data.total_expenses, color: "#ef4444", icon: "trending-down" },
    ];
  }, [data]);

  const renderSection = useCallback(
    (section: (typeof sections)[0]) => (
      <View key={section.title} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIcon, { backgroundColor: `${section.color}15` }]}>
              <Lucide name={section.icon as any} size={16} color={section.color} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
          </View>
          <Text style={[styles.sectionTotal, { color: section.color }]}>
            ₦{section.total.toLocaleString()}
          </Text>
        </View>
        {section.items.map((item: PnLLineItem) => (
          <View
            key={item.account_id}
            style={[styles.lineItem, { backgroundColor: colors.card, borderColor: isDark ? "#282b32" : "#eef0f4" }]}
          >
            <View style={styles.lineItemLeft}>
              <Text style={[styles.lineItemCode, { color: colors.textSecondary }]}>{item.account_code}</Text>
              <Text style={[styles.lineItemName, { color: colors.text }]}>{item.account_name}</Text>
            </View>
            <Text style={[styles.lineItemAmount, { color: section.color }]}>₦{item.amount.toLocaleString()}</Text>
          </View>
        ))}
        {section.items.length === 0 && (
          <Text style={[styles.emptySection, { color: colors.textSecondary }]}>
            No {section.title.toLowerCase()} recorded
          </Text>
        )}
      </View>
    ),
    [colors, isDark],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Lucide name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profit & Loss</Text>
        <InfoTooltip
          title="Profit & Loss"
          message="Your Profit & Loss statement (also called an income statement) shows how much money your business made or lost over a period. It subtracts all expenses from your revenue to give you the bottom line — your net profit or loss."
        />
        <View style={styles.backBtn} />
      </View>

      {/* Date Pickers */}
      <View style={styles.dateRow}>
        <View style={styles.dateCol}>
          <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>From</Text>
          <Pressable
            onPress={() => setShowFromPicker(true)}
            style={({ pressed }) => [styles.datePill, { backgroundColor: colors.card, borderColor: isDark ? "#262930" : "#eef0f4" }, pressed && { opacity: 0.8 }]}
          >
            <Lucide name="calendar" size={14} color={colors.text} />
            <Text style={[styles.datePillText, { color: colors.text }]}>{formatDate(fromDate)}</Text>
            <Lucide name="chevron-down" size={14} color={colors.textSecondary} />
          </Pressable>
          {showFromPicker && (
            <DateTimePicker
              value={fromDate}
              mode="date"
              display="compact"
              presentation="dialog"
              onValueChange={(_, d) => { setShowFromPicker(false); if (d) setFromDate(d); }}
              onDismiss={() => setShowFromPicker(false)}
            />
          )}
        </View>
        <View style={styles.dateCol}>
          <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>To</Text>
          <Pressable
            onPress={() => setShowToPicker(true)}
            style={({ pressed }) => [styles.datePill, { backgroundColor: colors.card, borderColor: isDark ? "#262930" : "#eef0f4" }, pressed && { opacity: 0.8 }]}
          >
            <Lucide name="calendar" size={14} color={colors.text} />
            <Text style={[styles.datePillText, { color: colors.text }]}>{formatDate(toDate)}</Text>
            <Lucide name="chevron-down" size={14} color={colors.textSecondary} />
          </Pressable>
          {showToPicker && (
            <DateTimePicker
              value={toDate}
              mode="date"
              display="compact"
              presentation="dialog"
              onValueChange={(_, d) => { setShowToPicker(false); if (d) setToDate(d); }}
              onDismiss={() => setShowToPicker(false)}
            />
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      ) : (
        <>
          <FlatList
            data={sections}
            keyExtractor={(item) => item.title}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => renderSection(item)}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconBadge, { backgroundColor: colors.backgroundElement }]}>
                  <Lucide name="trending-up" size={32} color={colors.textSecondary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Data</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  No profit & loss data for this period
                </Text>
              </View>
            }
          />
          <View
            style={[
              styles.netProfitFooter,
              { backgroundColor: isProfit ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderColor: isProfit ? "#10b981" : "#ef4444" },
            ]}
          >
            <Text style={[styles.netProfitLabel, { color: colors.text }]}>Net Profit</Text>
            <Text style={[styles.netProfitValue, { color: isProfit ? "#10b981" : "#ef4444" }]}>
              {isProfit ? "+" : ""}₦{Math.abs(netProfit).toLocaleString()}
            </Text>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default ProfitAndLoss;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  dateRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  dateCol: { flex: 1 },
  dateLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" },
  datePill: { flexDirection: "row", alignItems: "center", borderRadius: 100, paddingHorizontal: 12, paddingVertical: 8, gap: 6, borderWidth: 1 },
  datePillText: { fontSize: 12, fontWeight: "600", flex: 1 },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionTotal: { fontSize: 16, fontWeight: "800" },
  lineItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 4, borderWidth: StyleSheet.hairlineWidth },
  lineItemLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  lineItemCode: { fontSize: 12, fontFamily: "monospace", fontWeight: "600" },
  lineItemName: { fontSize: 14, fontWeight: "500" },
  lineItemAmount: { fontSize: 14, fontWeight: "700" },
  emptySection: { fontSize: 13, fontStyle: "italic", paddingVertical: 8 },
  netProfitFooter: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
  netProfitLabel: { fontSize: 16, fontWeight: "800" },
  netProfitValue: { fontSize: 18, fontWeight: "800" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 24 },
  emptyIconBadge: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: "center", marginBottom: 18 },
});
