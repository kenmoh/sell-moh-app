import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import type { BalanceSheetResponse } from "@/types/accounting";

const naira = (value: number) =>
  `${value < 0 ? "-" : ""}₦${Math.abs(value).toLocaleString()}`;

type Props = {
  data: BalanceSheetResponse;
};

/**
 * The audit panel for a balance sheet.
 *
 * Two controls live here:
 *
 *  - The balance check, Assets - Liabilities - Equity. In double-entry
 *    bookkeeping this is always zero: every transaction debits one account and
 *    credits another, so the books cannot disagree with themselves. A
 *    non-zero figure means something reached the ledger one-sided.
 *
 *  - The reconciliations. A receivable or payable lives in a sub-ledger
 *    (the customer list) *and* in the general ledger (account 1100 / 2000).
 *    Those two must agree to the naira. When a record is saved without its
 *    journal, the customer list and the balance sheet quietly disagree, and
 *    this is the row that says so.
 */
const BalanceSheetIntegrity = ({ data }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [open, setOpen] = useState(true);

  const balanced = Math.abs(data.balance_check) < 0.01;
  const arOk = Math.abs(data.receivable_difference) < 0.01;
  const apOk = Math.abs(data.payable_difference) < 0.01;
  const allClear = balanced && arOk && apOk;

  const checks = [
    {
      label: "Balance check",
      hint: "Assets − Liabilities − Equity",
      ok: balanced,
      value: data.balance_check,
      detail: balanced
        ? "The books balance."
        : "The books do not balance. A journal is missing a side.",
    },
    {
      label: "Receivables",
      hint: "Customer list vs account 1100",
      ok: arOk,
      value: data.receivable_difference,
      detail: arOk
        ? `${naira(data.receivable_subledger)} owed agrees with the ledger.`
        : `The customer list says ${naira(data.receivable_subledger)} but the ledger says ${naira(data.receivable_control)}.`,
    },
    {
      label: "Payables",
      hint: "Bills list vs account 2000",
      ok: apOk,
      value: data.payable_difference,
      detail: apOk
        ? `${naira(data.payable_subledger)} owed agrees with the ledger.`
        : `The bills list says ${naira(data.payable_subledger)} but the ledger says ${naira(data.payable_control)}.`,
    },
  ];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: allClear
            ? colors.backgroundElement
            : "rgba(239,68,68,0.45)",
        },
      ]}
    >
      <Pressable
        style={styles.header}
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel={
          allClear
            ? "Books are in balance. Tap for details."
            : "Books are out of balance. Tap for details."
        }
      >
        <View
          style={[
            styles.icon,
            {
              backgroundColor: allClear
                ? "rgba(16,185,129,0.12)"
                : "rgba(239,68,68,0.12)",
            },
          ]}
        >
          <Lucide
            name={allClear ? "shield-check" : "shield-alert"}
            size={16}
            color={allClear ? "#10b981" : "#ef4444"}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>
            {allClear ? "Books are in balance" : "Books need attention"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {allClear
              ? "Every transaction is recorded on both sides."
              : "Some figures do not agree. Tap to see which."}
          </Text>
        </View>
        <Lucide
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>

      {open && (
        <View style={styles.body}>
          {checks.map((check) => (
            <View key={check.label} style={styles.check}>
              <Lucide
                name={check.ok ? "circle-check" : "circle-alert"}
                size={15}
                color={check.ok ? "#10b981" : "#ef4444"}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.checkLabel, { color: colors.text }]}>
                  {check.label}
                  <Text style={{ color: colors.textSecondary }}>
                    {`  ·  ${check.hint}`}
                  </Text>
                </Text>
                <Text
                  style={[styles.checkDetail, { color: colors.textSecondary }]}
                >
                  {check.detail}
                </Text>
              </View>
              {check.ok && (
                <Text style={[styles.checkValue, { color: "#10b981" }]}>
                  {naira(0)}
                </Text>
              )}
            </View>
          ))}

          <View
            style={[
              styles.equityBox,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <Text
              style={[styles.equityTitle, { color: colors.textSecondary }]}
            >
              WHERE EQUITY COMES FROM
            </Text>
            <Text style={[styles.equityLine, { color: colors.text }]}>
              Owner&apos;s capital{"  "}
              <Text style={{ color: colors.textSecondary }}>
                {naira(data.capital)}
              </Text>
            </Text>
            <Text style={[styles.equityLine, { color: colors.text }]}>
              Revenue{"  "}
              <Text style={{ color: colors.textSecondary }}>
                {naira(data.total_revenue)}
              </Text>
            </Text>
            <Text style={[styles.equityLine, { color: colors.text }]}>
              Less expenses{"  "}
              <Text style={{ color: colors.textSecondary }}>
                ({naira(data.total_expenses)})
              </Text>
            </Text>
            <View
              style={[
                styles.equityDivider,
                { backgroundColor: colors.backgroundSelected },
              ]}
            />
            <Text style={[styles.equityTotal, { color: colors.text }]}>
              Equity{"  "}
              <Text style={{ color: colors.textSecondary }}>
                {naira(data.total_equity)}
              </Text>
            </Text>
            <Text
              style={[styles.equityNote, { color: colors.textSecondary }]}
            >
              Earnings are not transferred into retained earnings at year end,
              so they count here until that is done.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default BalanceSheetIntegrity;

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },
  body: { marginTop: 14, gap: 12 },
  check: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkLabel: { fontSize: 13, fontWeight: "600" },
  checkDetail: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  checkValue: { fontSize: 13, fontWeight: "700" },
  equityBox: { borderRadius: 12, padding: 12, gap: 6, marginTop: 4 },
  equityTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  equityLine: { fontSize: 13, fontWeight: "600" },
  equityDivider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  equityTotal: { fontSize: 14, fontWeight: "800" },
  equityNote: { fontSize: 11, lineHeight: 16, marginTop: 4 },
});