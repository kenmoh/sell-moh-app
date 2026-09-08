import { fetchTrialBalance } from "@/api/accounting";
import InfoTooltip from "@/components/info-tooltip";
import { Colors } from "@/constants/theme";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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

const TrialBalance = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const router = useRouter();

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const asAtDate = date.toISOString().split("T")[0];

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const {
    data: items = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["trial-balance", asAtDate],
    queryFn: () => fetchTrialBalance(asAtDate),
  });

  const totalDebit = items.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = items.reduce((sum, item) => sum + item.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const renderItem = useCallback(
    ({ item }: { item: (typeof items)[0] }) => (
      <View
        style={[
          styles.row,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? "#282b32" : "#eef0f4",
          },
        ]}
      >
        <View style={styles.rowLeft}>
          <Text style={[styles.accountCode, { color: colors.textSecondary }]}>
            {item.account_code}
          </Text>
          <Text style={[styles.accountName, { color: colors.text }]}>
            {item.account_name}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.debitCol, { color: "#10b981" }]}>
            {item.debit > 0 ? `₦${item.debit.toLocaleString()}` : "-"}
          </Text>
          <Text style={[styles.creditCol, { color: "#ef4444" }]}>
            {item.credit > 0 ? `₦${item.credit.toLocaleString()}` : "-"}
          </Text>
        </View>
      </View>
    ),
    [colors, isDark],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Lucide name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Trial Balance
        </Text>
        <InfoTooltip
          title="Trial Balance"
          message="A trial balance lists all your accounts and their balances at a specific point in time. It's used to verify that total debits equal total credits — if they don't, there's an error in your books that needs fixing."
        />
        <View style={styles.backBtn} />
      </View>

      {/* Date Picker */}
      <View style={styles.dateContainer}>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={({ pressed }) => [
            styles.datePill,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? "#262930" : "#eef0f4",
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Lucide name="calendar" size={16} color={colors.text} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDate(date)}
          </Text>
          <Lucide name="chevron-down" size={16} color={colors.textSecondary} />
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="compact"
            presentation="dialog"
            onValueChange={(_, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
            onDismiss={() => setShowPicker(false)}
          />
        )}
      </View>

      {/* Column Headers */}
      <View style={[styles.columnHeader, { borderBottomColor: isDark ? "#282b32" : "#e5e7eb" }]}>
        <Text style={[styles.columnHeaderText, { color: colors.textSecondary }]}>
          Account
        </Text>
        <View style={styles.columnHeaderRight}>
          <Text style={[styles.columnHeaderText, { color: colors.textSecondary }]}>
            Debit
          </Text>
          <Text style={[styles.columnHeaderText, { color: colors.textSecondary }]}>
            Credit
          </Text>
        </View>
      </View>

      {/* Table */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.account_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={renderItem}
          ListFooterComponent={
            <>
              {/* Totals Row */}
              <View
                style={[
                  styles.totalRow,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: isDark ? "#282b32" : "#e5e7eb",
                  },
                ]}
              >
                <Text style={[styles.totalLabel, { color: colors.text }]}>
                  Total
                </Text>
                <View style={styles.totalAmounts}>
                  <Text style={[styles.totalDebit, { color: "#10b981" }]}>
                    ₦{totalDebit.toLocaleString()}
                  </Text>
                  <Text style={[styles.totalCredit, { color: "#ef4444" }]}>
                    ₦{totalCredit.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Balance Status */}
              <View
                style={[
                  styles.balanceStatus,
                  {
                    backgroundColor: isBalanced
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(239,68,68,0.1)",
                  },
                ]}
              >
                <Lucide
                  name={isBalanced ? "check-circle" : "alert-circle"}
                  size={18}
                  color={isBalanced ? "#10b981" : "#ef4444"}
                />
                <Text
                  style={[
                    styles.balanceText,
                    { color: isBalanced ? "#10b981" : "#ef4444" },
                  ]}
                >
                  {isBalanced ? "Balance is equal" : "Balance is not equal"}
                </Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconBadge,
                  { backgroundColor: colors.backgroundElement },
                ]}
              >
                <Lucide name="scale" size={32} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Data
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                No trial balance data for this date
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default TrialBalance;

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  dateContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
  },
  columnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  columnHeaderText: { fontSize: 12, fontWeight: "600" },
  columnHeaderRight: { flexDirection: "row", gap: 40 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 2,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  accountCode: { fontSize: 12, fontFamily: "monospace", fontWeight: "600" },
  accountName: { fontSize: 14, fontWeight: "500" },
  rowRight: { flexDirection: "row", gap: 24 },
  debitCol: { fontSize: 13, fontWeight: "600", width: 80, textAlign: "right" },
  creditCol: { fontSize: 13, fontWeight: "600", width: 80, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: { fontSize: 15, fontWeight: "800" },
  totalAmounts: { flexDirection: "row", gap: 24 },
  totalDebit: { fontSize: 14, fontWeight: "800" },
  totalCredit: { fontSize: 14, fontWeight: "800" },
  balanceStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
  },
  balanceText: { fontSize: 14, fontWeight: "700" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  emptySubtitle: { fontSize: 13, textAlign: "center", marginBottom: 18 },
});
