import {
  fetchPayablePayments,
  fetchReceivablePayments,
} from "@/api/accounting";
import AppBottomSheet from "@/components/bottom-sheet";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  type: "ar" | "ap";
  itemId: string;
  itemName: string;
  /** Sum of the listed payments, so the user can check it against amount_paid. */
  totalPaid: number;
};

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const PaymentHistorySheet = ({
  visible,
  onVisibleChange,
  type,
  itemId,
  itemName,
  totalPaid,
}: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const isAr = type === "ar";

  const { data, isPending } = useQuery({
    queryKey: [isAr ? "receivable-payments" : "payable-payments", itemId],
    queryFn: () =>
      isAr ? fetchReceivablePayments(itemId) : fetchPayablePayments(itemId),
    enabled: visible && !!itemId,
  });

  const payments = data ?? [];
  const label = isAr ? "Receivable" : "Payable";

  return (
    <AppBottomSheet
      snapPoints={["60%", "85%"]}
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        {label} Payments
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {itemName} — ₦{Number(totalPaid || 0).toLocaleString()} received
      </Text>

      {isPending ? (
        <ActivityIndicator
          color={colors.buttonPrimary}
          style={{ paddingVertical: 32 }}
        />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Lucide
                name="receipt"
                size={22}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.emptyText, { color: colors.textSecondary }]}
              >
                No payments recorded yet
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.backgroundElement,
                },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: colors.backgroundElement }]}>
                <Lucide name="banknote" size={16} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.amount, { color: colors.text }]}>
                  ₦{Number(item.amount).toLocaleString()}
                </Text>
                <Text style={[styles.date, { color: colors.textSecondary }]}>
                  {formatDate(item.payment_date)}
                </Text>
                {item.notes ? (
                  <Text style={[styles.notes, { color: colors.textSecondary }]}>
                    {item.notes}
                  </Text>
                ) : null}
              </View>
              {index === 0 ? (
                <View
                  style={[
                    styles.latestTag,
                    { backgroundColor: colors.backgroundElement },
                  ]}
                >
                  <Text
                    style={[styles.latestText, { color: colors.textSecondary }]}
                  >
                    Latest
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </AppBottomSheet>
  );
};

export default PaymentHistorySheet;

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 4 },
  list: { marginTop: 12, maxHeight: 420 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  amount: { fontSize: 15, fontWeight: "700" },
  date: { fontSize: 12, marginTop: 2 },
  notes: { fontSize: 12, marginTop: 4, fontStyle: "italic" },
  latestTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  latestText: { fontSize: 10, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13 },
});