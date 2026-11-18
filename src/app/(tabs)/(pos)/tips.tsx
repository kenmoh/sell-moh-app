import { useSession } from "@/lib/ctx";
import { listTips, fetchTipsSummary } from "@/api/tips";
import type { Tip } from "@/types/tips";
import { useQuery } from "@tanstack/react-query";
import { useColorScheme } from "react-native";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "@/constants/theme";

export default function MyTipsScreen() {
  const { user } = useSession();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const cashierId = user?.user_id ?? "";

  const {
    data: summary,
    isPending: summaryPending,
  } = useQuery({
    queryKey: ["tips-summary", cashierId],
    queryFn: () => fetchTipsSummary(cashierId),
    enabled: !!cashierId,
  });

  const {
    data: tipsData,
    isPending: tipsPending,
  } = useQuery({
    queryKey: ["my-tips", cashierId],
    queryFn: () => listTips({ cashier_id: cashierId, status: "pending" }),
    enabled: !!cashierId,
  });

  const tips: Tip[] = tipsData?.items ?? [];
  const unsettledAmount = summary?.unsettled_amount ?? 0;
  const unsettledCount = summary?.unsettled_count ?? tips.length;

  if (summaryPending || tipsPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16 }}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Text style={[styles.title, { color: colors.text }]}>My Tips</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Unsettled tips
        </Text>
        <Text style={[styles.amount, { color: colors.text }]}>
          ₦{unsettledAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {unsettledCount} pending tip line{tips.length > 1 ? "s" : ""}. Tips are
          settled by the business owner.
        </Text>
      </View>

      <Text style={[styles.section, { color: colors.textSecondary }]}>
        Pending tip lines
      </Text>
      {tips.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          No pending tips.
        </Text>
      ) : (
        <FlatList
          data={tips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.card }]}>
              <View style={styles.rowBody}>
                <Text style={[styles.rowName, { color: colors.text }]}>
                  {item.product_name}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                  Sale {item.sale_number} · {item.qty} ×
                  {(item.extra || 0).toLocaleString()} tip
                </Text>
              </View>
              <Text style={[styles.rowAmount, { color: colors.text }]}>
                ₦{item.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: { padding: 14, borderRadius: 10, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  amount: { fontSize: 24, fontWeight: "800", marginTop: 4 },
  hint: { fontSize: 12, marginTop: 4 },
  section: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginTop: 8, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  rowBody: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: "600" },
  rowMeta: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: "700", minWidth: 100, textAlign: "right" },
  empty: { fontSize: 14, color: "#6b7280" },
});
