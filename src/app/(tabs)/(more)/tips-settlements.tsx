import { useSession } from "@/lib/ctx";
import { listTips, settleTips } from "@/api/tips";
import type { Tip } from "@/types/tips";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "@/components/button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "react-native";

interface CashierGroup {
  cashier_id: string;
  cashier_name: string;
  amount: number;
  count: number;
  tips: Tip[];
}

export default function TipsSettlementsScreen() {
  const { user } = useSession();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();
  const canRead = (user?.permissions ?? []).includes("tips:read");
  const canSettle = (user?.permissions ?? []).includes("tips:settle");

  const { data: pendingData, isPending } = useQuery({
    queryKey: ["pending-tips"],
    queryFn: () => listTips({ status: "pending" }),
    enabled: canRead,
  });

  const tips: Tip[] = pendingData?.items ?? [];
  const groups = new Map<string, CashierGroup>();
  for (const tip of tips) {
    const g = groups.get(tip.cashier_id) ?? {
      cashier_id: tip.cashier_id,
      cashier_name: tip.cashier_name,
      amount: 0,
      count: 0,
      tips: [],
    };
    g.amount += tip.amount;
    g.count += 1;
    g.tips.push(tip);
    groups.set(tip.cashier_id, g);
  }
  const groupList = Array.from(groups.values()).sort((a, b) => b.amount - a.amount);

  const handleSettle = (cashierId: string, cashierName: string) => {
    if (!canSettle) return;
    Alert.alert(
      `Settle tips for ${cashierName}`,
      "This will mark all pending tips for this cashier as settled.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Settle",
          onPress: async () => {
            try {
              await settleTips({
                cashier_id: cashierId,
                period_start: new Date(0).toISOString(),
                period_end: new Date().toISOString(),
                note: `POS settlement for ${cashierName}`,
              });
              await queryClient.invalidateQueries({ queryKey: ["pending-tips"] });
            } catch (err: any) {
              Alert.alert(
                "Settlement failed",
                err?.message || "Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  if (isPending) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }} style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={[styles.title, { color: colors.text }]}>Tips &amp; Settlements</Text>
        <ActivityIndicator />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={[styles.title, { color: colors.text }]}>Tips &amp; Settlements</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Cashiers with pending tips
        </Text>
        {groupList.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No pending tips to settle.
          </Text>
        ) : (
          <FlatList
            data={groupList}
            keyExtractor={(item) => item.cashier_id}
            renderItem={({ item }) => (
              <View style={[styles.row, { backgroundColor: colors.card }]}>
                <View>
                  <Text style={[styles.rowName, { color: colors.text }]}>{item.cashier_name}</Text>
                  <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                    {item.count} pending tip line{item.count > 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text style={[styles.rowAmount, { color: colors.text }]}>
                    ₦{item.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  {canSettle ? (
                    <Button
                      size="sm"
                      title="Settle"
                      onPress={() => handleSettle(item.cashier_id, item.cashier_name)}
                    />
                  ) : null}
                </View>
              </View>
            )}
          />
        )}
      </View>

      {!canSettle && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          You need the tips:settle permission to settle tips.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: { padding: 14, borderRadius: 10, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  rowName: { fontSize: 14, fontWeight: "600" },
  rowMeta: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: "700", minWidth: 100, textAlign: "right" },
  empty: { fontSize: 14, color: "#6b7280" },
  hint: { fontSize: 13, color: "#6b7280", marginTop: 8 },
});
