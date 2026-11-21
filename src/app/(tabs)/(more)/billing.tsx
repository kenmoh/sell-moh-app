import {
  changePlan,
  createBillingSettleLink,
  fetchBillableTransactions,
  fetchInvoices,
  fetchSubscription,
  fetchWallet,
  fetchWalletTransactions,
  fundWallet,
  formatCurrency,
  type BillingInvoice,
} from "@/api/billing";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BillingScreen = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const {
    data: subscription,
    isError: subError,
  } = useQuery({
    queryKey: ["billing-subscription"],
    queryFn: fetchSubscription,
  });

  const {
    data: invoices,
    isError: invError,
  } = useQuery({
    queryKey: ["billing-invoices"],
    queryFn: fetchInvoices,
  });

  const {
    data: wallet,
    isError: walletError,
  } = useQuery({
    queryKey: ["billing-wallet"],
    queryFn: fetchWallet,
  });

  const {
    data: walletTxns,
    isError: txnsError,
  } = useQuery({
    queryKey: ["billing-wallet-transactions"],
    queryFn: fetchWalletTransactions,
  });

  const {
    data: billables,
    isError: billablesError,
  } = useQuery({
    queryKey: ["billing-billable-transactions"],
    queryFn: fetchBillableTransactions,
  });

  const queryClient = useQueryClient();

  const changePlanMutation = useMutation({
    mutationFn: (slug: string) => changePlan({ plan_slug: slug }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["billing-subscription"] });
      void queryClient.invalidateQueries({ queryKey: ["billing-invoices"] });
    },
  });

  const fundMutation = useMutation({
    mutationFn: (amount: number) => fundWallet({ amount }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["billing-wallet"] });
      void queryClient.invalidateQueries({
        queryKey: ["billing-wallet-transactions"],
      });
    },
  });

  const linkMutation = useMutation({
    mutationFn: createBillingSettleLink,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["billing-wallet"] });
    },
  });

  const [fundAmount, setFundAmount] = useState("");
  const [openFund, setOpenFund] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  const sub = subscription;
  const pendingBalance = sub?.accrued_debt ?? 0;
  const canPay = pendingBalance > 0;

  const invList = invoices ?? [];
  const walletList = walletTxns ?? [];
  const billableList = billables ?? [];

  const handleFund = () => {
    const amount = Number(fundAmount);
    if (!amount || amount <= 0) return;
    fundMutation.mutate(amount);
    setFundAmount("");
    setOpenFund(false);
  };

  const handleLink = () => {
    linkMutation.mutate();
    setOpenLink(false);
  };

  if (
    subError ||
    invError ||
    walletError ||
    txnsError ||
    billablesError
  ) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
      </View>
    );
  }

  if (!sub) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
      </View>
    );
  }

  const unpaidTotal = invList
    .filter((i: BillingInvoice) => i.status !== "paid")
    .reduce((sum: number, i: BillingInvoice) => sum + i.amount_due, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <Stack.Screen
        options={{
          title: "Billing",
          headerShown: true,
        }}
      />

      {/* Summary Cards */}
      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={styles.label}>Subscription</Text>
          <Text style={styles.value}>{sub.status}</Text>
          <Text style={styles.meta}>Plan: {sub.plan_id}</Text>
          <Text style={styles.meta}>
            Next billing:{" "}
            {new Date(sub.next_billing_date).toLocaleDateString("en-NG", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            Accrued debt: {formatCurrency(pendingBalance)}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            Debt cap: {formatCurrency(sub.debt_cap)}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={styles.label}>Wallet Balance</Text>
          <Text style={styles.valueBig}>
            {formatCurrency(wallet?.balance ?? 0)}
          </Text>
          <Text style={styles.meta}>{wallet?.currency ?? "NGN"}</Text>
          <Pressable
            onPress={() => setOpenFund(true)}
            style={[styles.linkRow, { marginTop: 8 }]}
          >
            <Lucide name="plus" size={14} color={colors.buttonPrimary} />
            <Text style={[styles.linkText, { color: colors.buttonPrimary }]}>
              Fund Wallet
            </Text>
          </Pressable>
          {canPay && (
            <Pressable
              onPress={() => setOpenLink(true)}
              style={[styles.linkRow, { marginTop: 6 }]}
            >
              <Lucide name="alert-circle" size={14} color="#DC2626" />
              <Text style={[styles.linkText, { color: "#DC2626" }]}>
                Clear Debt
              </Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={styles.label}>Outstanding</Text>
          <Text style={[styles.valueBig, { color: "#DC2626" }]}>
            {formatCurrency(unpaidTotal)}
          </Text>
          <Text style={styles.meta}>
            {invList.filter((i) => i.status === "issued").length} unpaid
            invoice(s)
          </Text>
        </View>
      </View>

      {/* Plan Change */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={styles.sectionTitle}>Change Plan</Text>
        <Text style={styles.sectionSub}>
          Plan changes take effect at the start of your next 30-day billing
          period. No proration — your current period is unaffected.
        </Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="e.g. basic, pro"
          value={selectedPlan}
          onChangeText={setSelectedPlan}
        />
        <Pressable
          onPress={() => changePlanMutation.mutate(selectedPlan)}
          disabled={changePlanMutation.isPending}
          style={[styles.button, { marginTop: 10 }]}
        >
          <Text style={styles.buttonText}>
            {changePlanMutation.isPending ? "Scheduling…" : "Schedule Change"}
          </Text>
        </Pressable>
      </View>

      {/* Invoices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoices</Text>
        <FlatList
          data={invList}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={[styles.invCard, { backgroundColor: colors.card }]}>
              <View style={styles.invRow}>
                <View>
                  <Text style={styles.invNumber}>{item.invoice_number}</Text>
                  <Text style={styles.invMeta}>
                    {new Date(item.due_at).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <View style={styles.invAmounts}>
                  <Text style={styles.invTotal}>
                    {formatCurrency(item.total_amount)}
                  </Text>
                  <Text style={styles.invDue}>
                    {formatCurrency(item.amount_due)}
                  </Text>
                </View>
                <View>
                  <Text
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          item.status === "paid"
                            ? "rgba(5, 150, 105, 0.12)"
                            : "rgba(217, 119, 6, 0.12)",
                        color:
                          item.status === "paid"
                            ? "#059669"
                            : "#D97706",
                      },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {invList.length === 0
                  ? "No invoices yet."
                  : "All invoices are settled."}
              </Text>
            </View>
          }
        />
      </View>

      {/* Transaction Fees */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Fees</Text>
        <FlatList
          data={billableList}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={[styles.invCard, { backgroundColor: colors.card }]}>
              <View style={styles.invRow}>
                <View>
                  <Text style={styles.invNumber}>
                    Sale: {item.sale_id.slice(0, 8)}…
                  </Text>
                  <Text style={styles.invMeta}>
                    {new Date(item.completed_at).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <View style={styles.invAmounts}>
                  <Text style={styles.invFee}>
                    {formatCurrency(item.transaction_fee)}
                  </Text>
                  <Text style={styles.invMeta}>
                    {item.fee_label_snapshot ?? "Standard"}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No billable transactions yet.
              </Text>
            </View>
          }
        />
      </View>

      {/* Wallet Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Transactions</Text>
        <FlatList
          data={walletList}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={[styles.invCard, { backgroundColor: colors.card }]}>
              <View style={styles.invRow}>
                <View>
                  <Text style={styles.invNumber}>
                    {item.entry_type.replace("_", " ")}
                  </Text>
                  <Text style={styles.invMeta}>
                    {item.description ?? "—"}
                  </Text>
                </View>
                <View style={styles.invAmounts}>
                  <Text style={styles.invTotal}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No wallet transactions yet.
              </Text>
            </View>
          }
        />
      </View>
    </ScrollView>
  );
};

export default BillingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    minWidth: 140,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  valueBig: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  meta: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  section: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionSub: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
  },
  invCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  invRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  invNumber: {
    fontSize: 13,
    fontWeight: "600",
  },
  invMeta: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  invAmounts: {
    flexDirection: "row",
    gap: 8,
  },
  invTotal: {
    fontSize: 14,
    fontWeight: "700",
  },
  invFee: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  invDue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: "700",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#6b7280",
  },
});
