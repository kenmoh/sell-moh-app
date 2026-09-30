import {
  fetchBalanceSheet,
  fetchCashFlow,
  fetchJournals,
  fetchProfitAndLoss,
  fetchTrialBalance,
} from "@/api/accounting";
import InfoTooltip from "@/components/info-tooltip";
import Pill from "@/components/pill";
import { Colors } from "@/constants/theme";
import { useActiveStore } from "@/lib/store-context";
import type {
  BalanceSheetResponse,
  CashFlowResponse,
  JournalListItem,
  PnLLineItem,
  ProfitAndLossResponse,
  TrialBalanceItem,
} from "@/types/accounting";
import Info from "@expo/material-symbols/info.xml";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { Lucide, type LucideIconName } from "@react-native-vector-icons/lucide";
import { useQueries } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Fragment, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type StatementKey = "pnl" | "cashflow" | "tb" | "bs" | "journals";

const STATEMENTS: { key: StatementKey; label: string; icon: LucideIconName }[] =
  [
    { key: "pnl", label: "P&L", icon: "trending-up" },
    { key: "cashflow", label: "Cash Flow", icon: "banknote" },
    { key: "tb", label: "Trial Balance", icon: "scale" },
    { key: "bs", label: "Balance Sheet", icon: "landmark" },
    { key: "journals", label: "Journals", icon: "file-text" },
  ];

const LABEL_WIDTH = 156;
const COL_WIDTH = 116;
const JOURNALS_PAGE_SIZE = 500;

interface Column {
  key: string;
  label: string;
  storeId: string | null;
  derived?: boolean;
}

interface Row {
  key: string;
  label: string;
  code?: string;
  values: number[];
  bold?: boolean;
  tone?: "signed";
}

interface Section {
  title: string;
  color: string;
  icon: LucideIconName;
  rows: Row[];
}

type ItemMap = Map<string, { label: string; code?: string; value: number }>;

const toLineMap = (items: PnLLineItem[] | undefined): ItemMap => {
  const map: ItemMap = new Map();
  for (const item of items ?? []) {
    const prev = map.get(item.account_id);
    if (prev) {
      prev.value += item.amount;
    } else {
      map.set(item.account_id, {
        label: item.account_name,
        code: item.account_code,
        value: item.amount,
      });
    }
  }
  return map;
};

const CompareStores = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const { stores } = useActiveStore();

  const [statement, setStatement] = useState<StatementKey>("pnl");
  const [showInfo, setShowInfo] = useState(false);
  const [picker, setPicker] = useState<null | "from" | "to" | "asAt">(null);

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [toDate, setToDate] = useState(new Date());
  const [asAtDate, setAsAtDate] = useState(new Date());

  const from = fromDate.toISOString().split("T")[0];
  const to = toDate.toISOString().split("T")[0];
  const asAt = asAtDate.toISOString().split("T")[0];

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const columns = useMemo<Column[]>(() => {
    const cols: Column[] = [
      { key: "all", label: "All Stores", storeId: null },
    ];
    for (const s of stores) {
      cols.push({ key: s.id, label: s.name, storeId: s.id });
    }
    if (stores.length > 0) {
      cols.push({ key: "untagged", label: "Untagged", storeId: null, derived: true });
    }
    return cols;
  }, [stores]);

  const fetched = useMemo(() => columns.filter((c) => !c.derived), [columns]);

  const results = useQueries({
    queries: fetched.map((col) => {
      const storeId = col.storeId;
      switch (statement) {
        case "pnl":
          return {
            queryKey: ["profit-and-loss", from, to, storeId],
            queryFn: () => fetchProfitAndLoss(from, to, storeId),
          };
        case "cashflow":
          return {
            queryKey: ["cash-flow", from, to, storeId],
            queryFn: () => fetchCashFlow(from, to, storeId),
          };
        case "tb":
          return {
            queryKey: ["trial-balance", asAt, storeId],
            queryFn: () => fetchTrialBalance(asAt, storeId),
          };
        case "bs":
          return {
            queryKey: ["balance-sheet", asAt, storeId],
            queryFn: () => fetchBalanceSheet(asAt, storeId),
          };
        case "journals":
          return {
            queryKey: ["journals-compare", storeId],
            queryFn: () => fetchJournals(1, JOURNALS_PAGE_SIZE, storeId),
          };
      }
    }),
  });

  const isLoading = results.some((r) => r.isPending);
  const isError = results.some((r) => r.isError);

  const dataByCol: Record<string, any> = {};
  fetched.forEach((col, i) => {
    dataByCol[col.key] = results[i]?.data;
  });

  const derive = (values: number[]): number =>
    values[0] - values.slice(1).reduce((a, b) => a + b, 0);

  const makeRows = (extract: (data: any) => ItemMap): Row[] => {
    const maps = fetched.map((c) => extract(dataByCol[c.key]));
    const order: string[] = [];
    for (const m of maps) {
      m.forEach((_, k) => {
        if (!order.includes(k)) order.push(k);
      });
    }
    return order.map((k) => {
      let label = k;
      let code: string | undefined;
      for (const m of maps) {
        const hit = m.get(k);
        if (hit) {
          label = hit.label;
          code = hit.code;
          break;
        }
      }
      const values = maps.map((m) => m.get(k)?.value ?? 0);
      return { key: k, label, code, values: [...values, derive(values)] };
    });
  };

  const totalRow = (
    key: string,
    label: string,
    vals: number[],
    opts: Partial<Row> = {},
  ): Row => ({
    key,
    label,
    values: [...vals, derive(vals)],
    bold: true,
    ...opts,
  });

  const buildSections = (): Section[] => {
    switch (statement) {
      case "pnl": {
        const datas = fetched.map(
          (c) => dataByCol[c.key] as ProfitAndLossResponse,
        );
        const revenueTotals = datas.map((d) => d.total_revenue);
        const expenseTotals = datas.map((d) => d.total_expenses);
        const netVals = datas.map((d) => d.total_revenue - d.total_expenses);
        return [
          {
            title: "Revenue",
            color: "#3b82f6",
            icon: "trending-up",
            rows: [
              ...makeRows((d) => toLineMap(d?.revenue)),
              totalRow("total_revenue", "Total Revenue", revenueTotals),
            ],
          },
          {
            title: "Expenses",
            color: "#ef4444",
            icon: "trending-down",
            rows: [
              ...makeRows((d) => toLineMap(d?.expenses)),
              totalRow("total_expenses", "Total Expenses", expenseTotals),
            ],
          },
          {
            title: "Net Profit",
            color: "#10b981",
            icon: "wallet",
            rows: [
              {
                key: "net",
                label: "Net Profit / Loss",
                values: [...netVals, derive(netVals)],
                bold: true,
                tone: "signed",
              },
            ],
          },
        ];
      }
      case "cashflow": {
        const datas = fetched.map((c) => dataByCol[c.key] as CashFlowResponse);
        const sum = (items: PnLLineItem[]) =>
          (items ?? []).reduce((s, i) => s + i.amount, 0);
        const inTotals = datas.map((d) => sum(d?.inflows));
        const outTotals = datas.map((d) => sum(d?.outflows));
        const netVals = datas.map((d) => d?.net_cash_flow ?? 0);
        return [
          {
            title: "Inflows",
            color: "#10b981",
            icon: "arrow-down-left",
            rows: [
              ...makeRows((d) => toLineMap(d?.inflows)),
              totalRow("total_in", "Total Inflows", inTotals),
            ],
          },
          {
            title: "Outflows",
            color: "#ef4444",
            icon: "arrow-up-right",
            rows: [
              ...makeRows((d) => toLineMap(d?.outflows)),
              totalRow("total_out", "Total Outflows", outTotals),
            ],
          },
          {
            title: "Net Cash Flow",
            color: "#3b82f6",
            icon: "banknote",
            rows: [
              {
                key: "net",
                label: "Net Cash Flow",
                values: [...netVals, derive(netVals)],
                bold: true,
                tone: "signed",
              },
            ],
          },
        ];
      }
      case "tb": {
        const datas = fetched.map(
          (c) => (dataByCol[c.key] ?? []) as TrialBalanceItem[],
        );
        const netMap = (items: TrialBalanceItem[]): ItemMap => {
          const map: ItemMap = new Map();
          for (const item of items ?? []) {
            const value = item.debit - item.credit;
            const prev = map.get(item.account_id);
            if (prev) {
              prev.value += value;
            } else {
              map.set(item.account_id, {
                label: item.account_name,
                code: item.account_code,
                value,
              });
            }
          }
          return map;
        };
        const debitTotals = datas.map((d) =>
          d.reduce((s, i) => s + i.debit, 0),
        );
        const creditTotals = datas.map((d) =>
          d.reduce((s, i) => s + i.credit, 0),
        );
        const diffVals = datas.map(
          (d) =>
            d.reduce((s, i) => s + i.debit, 0) -
            d.reduce((s, i) => s + i.credit, 0),
        );
        return [
          {
            title: "Accounts (net)",
            color: "#3b82f6",
            icon: "scale",
            rows: makeRows(netMap),
          },
          {
            title: "Totals",
            color: "#8b5cf6",
            icon: "sigma",
            rows: [
              totalRow("debits", "Total Debits", debitTotals),
              totalRow("credits", "Total Credits", creditTotals),
              totalRow("diff", "Debits − Credits", diffVals, {
                tone: "signed",
              }),
            ],
          },
        ];
      }
      case "bs": {
        const datas = fetched.map(
          (c) => dataByCol[c.key] as BalanceSheetResponse,
        );
        const checkVals = datas.map(
          (d) =>
            (d?.total_assets ?? 0) -
            (d?.total_liabilities ?? 0) -
            (d?.total_equity ?? 0),
        );
        return [
          {
            title: "Assets",
            color: "#10b981",
            icon: "briefcase",
            rows: [
              ...makeRows((d) => toLineMap(d?.assets)),
              totalRow("total_assets", "Total Assets", datas.map((d) => d?.total_assets ?? 0)),
            ],
          },
          {
            title: "Liabilities",
            color: "#ef4444",
            icon: "credit-card",
            rows: [
              ...makeRows((d) => toLineMap(d?.liabilities)),
              totalRow("total_liabilities", "Total Liabilities", datas.map((d) => d?.total_liabilities ?? 0)),
            ],
          },
          {
            title: "Equity",
            color: "#3b82f6",
            icon: "landmark",
            rows: [
              ...makeRows((d) => toLineMap(d?.equity)),
              totalRow("total_equity", "Total Equity", datas.map((d) => d?.total_equity ?? 0)),
            ],
          },
          {
            title: "Balance Check",
            color: "#8b5cf6",
            icon: "check-check",
            rows: [
              totalRow("balance_check", "Assets − L − E", checkVals, {
                tone: "signed",
              }),
            ],
          },
        ];
      }
      case "journals": {
        const datas = fetched.map(
          (c) =>
            dataByCol[c.key] as {
              items: JournalListItem[];
              total: number;
            },
        );
        const truncated = datas.some((d) => (d?.total ?? 0) > JOURNALS_PAGE_SIZE);
        const mark = truncated ? "*" : "";
        const sumItems = (fn: (i: JournalListItem) => number) =>
          datas.map((d) => (d?.items ?? []).reduce((s, i) => s + fn(i), 0));
        return [
          {
            title: "Journals",
            color: "#8b5cf6",
            icon: "file-text",
            rows: [
              totalRow("count", "Journal Entries", datas.map((d) => d?.total ?? 0)),
              totalRow("lines", `Entry Lines${mark}`, sumItems((i) => i.entry_count)),
              totalRow("debits", `Total Debits${mark}`, sumItems((i) => i.total_debit)),
              totalRow("credits", `Total Credits${mark}`, sumItems((i) => i.total_credit)),
            ],
          },
        ];
      }
      default:
        return [];
    }
  };

  const journalsTruncated =
    statement === "journals" &&
    fetched.some(
      (c) => ((dataByCol[c.key]?.total as number) ?? 0) > JOURNALS_PAGE_SIZE,
    );

  const sections = isLoading || isError ? [] : buildSections();

  const fmt = (v: number) => {
    if (v === 0) return "—";
    const abs = Math.abs(v).toLocaleString();
    return v < 0 ? `-₦${abs}` : `₦${abs}`;
  };

  const cellColor = (v: number, row: Row, section: Section): string => {
    if (row.tone === "signed") {
      if (v > 0) return "#10b981";
      if (v < 0) return "#ef4444";
      return colors.textSecondary;
    }
    if (row.bold) return section.color;
    return colors.text;
  };

  const needsRange = statement === "pnl" || statement === "cashflow";
  const needsPoint = statement === "tb" || statement === "bs";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={process.env.EXPO_OS === "ios" ? "info.circle" : Info}
          onPress={() => setShowInfo(true)}
        />
      </Stack.Toolbar>
      <InfoTooltip
        title="Compare Stores"
        message="See how each of your stores performs side by side. Every column shows the same statement for one store — plus All Stores and Untagged (journals and expenses not assigned to any store)."
        visible={showInfo}
        onVisibleChange={setShowInfo}
        trigger={false}
      />

      {/* Statement Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {STATEMENTS.map((s) => (
          <Pill
            key={s.key}
            label={s.label}
            icon={s.icon}
            size="sm"
            active={statement === s.key}
            onPress={() => setStatement(s.key)}
          />
        ))}
      </ScrollView>

      {/* Period Controls */}
      {needsRange && (
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
              From
            </Text>
            <Pressable
              onPress={() => setPicker("from")}
              style={({ pressed }) => [
                styles.datePill,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#262930" : "#eef0f4",
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Lucide name="calendar" size={14} color={colors.text} />
              <Text style={[styles.datePillText, { color: colors.text }]}>
                {formatDate(fromDate)}
              </Text>
              <Lucide
                name="chevron-down"
                size={14}
                color={colors.textSecondary}
              />
            </Pressable>
            {picker === "from" && (
              <DateTimePicker
                value={fromDate}
                mode="date"
                display="compact"
                presentation="dialog"
                onValueChange={(_, d) => {
                  setPicker(null);
                  if (d) setFromDate(d);
                }}
                onDismiss={() => setPicker(null)}
              />
            )}
          </View>
          <View style={styles.dateCol}>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
              To
            </Text>
            <Pressable
              onPress={() => setPicker("to")}
              style={({ pressed }) => [
                styles.datePill,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#262930" : "#eef0f4",
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Lucide name="calendar" size={14} color={colors.text} />
              <Text style={[styles.datePillText, { color: colors.text }]}>
                {formatDate(toDate)}
              </Text>
              <Lucide
                name="chevron-down"
                size={14}
                color={colors.textSecondary}
              />
            </Pressable>
            {picker === "to" && (
              <DateTimePicker
                value={toDate}
                mode="date"
                display="compact"
                presentation="dialog"
                onValueChange={(_, d) => {
                  setPicker(null);
                  if (d) setToDate(d);
                }}
                onDismiss={() => setPicker(null)}
              />
            )}
          </View>
        </View>
      )}
      {needsPoint && (
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
              As at
            </Text>
            <Pressable
              onPress={() => setPicker("asAt")}
              style={({ pressed }) => [
                styles.datePill,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? "#262930" : "#eef0f4",
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Lucide name="calendar" size={14} color={colors.text} />
              <Text style={[styles.datePillText, { color: colors.text }]}>
                {formatDate(asAtDate)}
              </Text>
              <Lucide
                name="chevron-down"
                size={14}
                color={colors.textSecondary}
              />
            </Pressable>
            {picker === "asAt" && (
              <DateTimePicker
                value={asAtDate}
                mode="date"
                display="compact"
                presentation="dialog"
                onValueChange={(_, d) => {
                  setPicker(null);
                  if (d) setAsAtDate(d);
                }}
                onDismiss={() => setPicker(null)}
              />
            )}
          </View>
        </View>
      )}

      {/* Table */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Lucide
            name="alert-triangle"
            size={36}
            color={colors.textSecondary}
          />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Could not load the comparison
          </Text>
          <Pressable
            onPress={() => results.forEach((r) => r.refetch())}
            style={[styles.retryButton, { backgroundColor: colors.buttonPrimary }]}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tableScroll}
          >
            <View
              style={{
                width: LABEL_WIDTH + columns.length * COL_WIDTH,
              }}
            >
              {/* Header */}
              <View
                style={[
                  styles.headerRow,
                  {
                    borderBottomColor: isDark ? "#282b32" : "#e5e7eb",
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <View style={styles.labelCell}>
                  <Text
                    style={[
                      styles.headerText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Statement
                  </Text>
                </View>
                {columns.map((c) => (
                  <View
                    key={c.key}
                    style={[
                      styles.valueCell,
                      c.derived && styles.derivedCol,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.headerText,
                        {
                          color: c.derived
                            ? "#8b5cf6"
                            : c.storeId === null
                              ? colors.text
                              : colors.textSecondary,
                        },
                        c.storeId === null && !c.derived && { fontWeight: "700" },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </View>
                ))}
              </View>

              {sections.map((section) => (
                <Fragment key={section.title}>
                  <View
                    style={[
                      styles.sectionRow,
                      { backgroundColor: `${section.color}12` },
                    ]}
                  >
                    <Lucide
                      name={section.icon}
                      size={13}
                      color={section.color}
                    />
                    <Text
                      style={[styles.sectionTitle, { color: section.color }]}
                    >
                      {section.title}
                    </Text>
                  </View>
                  {section.rows.map((row, rowIdx) => (
                    <View
                      key={row.key}
                      style={[
                        styles.dataRow,
                        {
                          borderBottomColor: isDark ? "#23252b" : "#f1f3f7",
                          backgroundColor:
                            rowIdx % 2 === 1
                              ? isDark
                                ? "#17181c"
                                : "#fafbfc"
                              : "transparent",
                        },
                      ]}
                    >
                      <View style={styles.labelCell}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.rowLabel,
                            { color: colors.text },
                            row.bold && { fontWeight: "700" },
                          ]}
                        >
                          {row.label}
                        </Text>
                        {row.code ? (
                          <Text
                            style={[
                              styles.rowCode,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {row.code}
                          </Text>
                        ) : null}
                      </View>
                      {row.values.map((v, i) => (
                        <View
                          key={`${row.key}-${i}`}
                          style={[
                            styles.valueCell,
                            columns[i]?.derived && styles.derivedCol,
                          ]}
                        >
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.valueText,
                              { color: cellColor(v, row, section) },
                              row.bold && { fontWeight: "700" },
                            ]}
                          >
                            {fmt(v)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </Fragment>
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.footnote, { color: colors.textSecondary }]}>
            {journalsTruncated
              ? "* Summed from the latest 500 journal entries per column."
              : "Untagged = All Stores − each store (journals and expenses with no store assigned)."}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

export default CompareStores;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 60,
  },
  errorText: { fontSize: 14, fontWeight: "500" },
  retryButton: {
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  tabsRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  dateCol: { flex: 1 },
  dateLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  datePillText: { fontSize: 13, fontWeight: "600", flex: 1 },
  tableScroll: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 8,
    borderRadius: 8,
  },
  sectionTitle: { fontSize: 12, fontWeight: "700" },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  labelCell: {
    width: LABEL_WIDTH,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  valueCell: {
    width: COL_WIDTH,
    paddingHorizontal: 8,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  derivedCol: {
    backgroundColor: "rgba(139,92,246,0.07)",
  },
  rowLabel: { fontSize: 13, fontWeight: "500" },
  rowCode: { fontSize: 10, marginTop: 1 },
  valueText: { fontSize: 13, fontWeight: "600" },
  footnote: {
    fontSize: 11,
    paddingHorizontal: 20,
    marginTop: 14,
    textAlign: "center",
  },
});
