import { AuditLogEntry, getAuditLogs, getEmployees } from "@/api/auth";
import { Employee } from "@/types/auth";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useState } from "react";

const TENANT_ACTIONS = [
  "sale_voided",
  "sale_returned",
  "cart_void_approved",
  "cart_cleared",
  "cart_item_deleted",
  "tax_remittance",
  "receivable_created",
  "ar_payment_received",
  "payable_created",
  "ap_payment_recorded",
  "expense_created",
  "journal_created",
  "receivable_store_corrected",
  "payable_store_corrected",
  "expense_store_corrected",
  "role_permissions_updated",
  "sessions_revoked",
] as const;

type Filter = "all" | "voids" | "in" | "out" | "corrections" | "access";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "voids", label: "Voids & Returns" },
  { key: "in", label: "Money In" },
  { key: "out", label: "Money Out" },
  { key: "corrections", label: "Corrections" },
  { key: "access", label: "Access" },
];

const FILTER_ACTIONS: Record<Exclude<Filter, "all">, string[]> = {
  voids: [
    "sale_voided",
    "sale_returned",
    "cart_void_approved",
    "cart_cleared",
    "cart_item_deleted",
  ],
  in: ["receivable_created", "ar_payment_received"],
  out: [
    "expense_created",
    "payable_created",
    "ap_payment_recorded",
    "tax_remittance",
  ],
  corrections: [
    "receivable_store_corrected",
    "payable_store_corrected",
    "expense_store_corrected",
  ],
  access: ["role_permissions_updated", "sessions_revoked"],
};

const money = (v: unknown) =>
  v !== undefined && v !== null
    ? `₦${Number(v).toLocaleString()}`
    : "—";

interface ActionConfig {
  label: string;
  icon: string;
  color: string;
  rows?: (d: Record<string, unknown>) => [string, string][];
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  sale_voided: {
    label: "Sale Voided",
    icon: "x-circle",
    color: "#ef4444",
    rows: (d) => [
      ["Sale", String(d.sale_number ?? "—")],
      ["Total", money(d.total)],
      ["Reason", String(d.reason ?? "—")],
    ],
  },
  sale_returned: {
    label: "Sale Returned",
    icon: "undo-2",
    color: "#ef4444",
    rows: (d) => [
      ["Sale", String(d.sale_number ?? "—")],
      ["Total", money(d.total)],
      ["Refund", money(d.refund_amount)],
      ["Reason", String(d.reason ?? "—")],
    ],
  },
  cart_void_approved: {
    label: "Item Voided",
    icon: "x-circle",
    color: "#ef4444",
    rows: (d) => [
      ["Product", String(d.product_name ?? "—")],
      ["Qty Voided", String(d.qty_voided ?? "—")],
      ["Qty Remaining", String(d.qty_remaining ?? "—")],
      ["Unit Price", money(d.unit_price)],
    ],
  },
  cart_cleared: {
    label: "Cart Cleared",
    icon: "trash-2",
    color: "#f59e0b",
    rows: (d) => [["Items Cleared", String(d.items_cleared ?? "—")]],
  },
  cart_item_deleted: {
    label: "Item Deleted",
    icon: "minus-circle",
    color: "#a855f7",
    rows: (d) => [
      ["Product", String(d.product_name ?? d.product_id ?? "—")],
      ["Quantity", String(d.qty ?? "—")],
    ],
  },
  tax_remittance: {
    label: "Tax Remitted",
    icon: "landmark",
    color: "#0ea5e9",
    rows: (d) => [
      ["Account", String(d.account_code ?? "—")],
      ["Amount", money(d.amount)],
      ["Method", String(d.method ?? "—")],
    ],
  },
  receivable_created: {
    label: "Invoice Created",
    icon: "file-text",
    color: "#10b981",
    rows: (d) => [
      ["Invoice", String(d.invoice_number ?? "—")],
      ["Customer", String(d.customer_name ?? "—")],
      ["Amount", money(d.amount)],
    ],
  },
  ar_payment_received: {
    label: "Invoice Paid",
    icon: "hand-coins",
    color: "#10b981",
    rows: (d) => [
      ["Invoice", String(d.invoice_number ?? "—")],
      ["Amount", money(d.amount)],
    ],
  },
  payable_created: {
    label: "Bill Created",
    icon: "file-minus",
    color: "#f59e0b",
    rows: (d) => [
      ["Bill", String(d.bill_number ?? "—")],
      ["Vendor", String(d.vendor_name ?? "—")],
      ["Amount", money(d.amount)],
    ],
  },
  ap_payment_recorded: {
    label: "Bill Paid",
    icon: "banknote-arrow-down",
    color: "#f59e0b",
    rows: (d) => [
      ["Bill", String(d.bill_number ?? "—")],
      ["Amount", money(d.amount)],
    ],
  },
  expense_created: {
    label: "Expense Added",
    icon: "receipt",
    color: "#f59e0b",
    rows: (d) => [
      ["Category", String(d.category ?? "—")],
      ["Amount", money(d.amount)],
      ["Description", String(d.description ?? "—")],
      ["Vendor", String(d.vendor ?? "—")],
    ],
  },
  journal_created: {
    label: "Journal Posted",
    icon: "book-check",
    color: "#0ea5e9",
    rows: (d) => [
      ["Description", String(d.description ?? "—")],
      ["Lines", String(d.entry_count ?? "—")],
      ["Total", money(d.total)],
    ],
  },
  receivable_store_corrected: {
    label: "Invoice Reassigned",
    icon: "arrow-right-left",
    color: "#8b5cf6",
    rows: () => [["To", "another store"]],
  },
  payable_store_corrected: {
    label: "Bill Reassigned",
    icon: "arrow-right-left",
    color: "#8b5cf6",
    rows: () => [["To", "another store"]],
  },
  expense_store_corrected: {
    label: "Expense Reassigned",
    icon: "arrow-right-left",
    color: "#8b5cf6",
    rows: () => [["To", "another store"]],
  },
  role_permissions_updated: {
    label: "Permissions Updated",
    icon: "shield-check",
    color: "#3b82f6",
  },
  sessions_revoked: {
    label: "Sessions Signed Out",
    icon: "shield-off",
    color: "#3b82f6",
  },
};

const TenantActivityLogs = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [filter, setFilter] = useState<Filter>("all");

  const {
    data: logs,
    isPending,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => getAuditLogs({ limit: 100 }),
  });

  // employee_id -> display name so tiles say who did it, not an id
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });
  const nameById = new Map<string, string>(
    (employees ?? []).map((e: Employee) => [e.id, e.full_name ?? e.email]),
  );

  const tenantLogs = (logs ?? []).filter((l) =>
    TENANT_ACTIONS.includes(l.action as any),
  );
  const visibleLogs =
    filter === "all"
      ? tenantLogs
      : tenantLogs.filter((l) => FILTER_ACTIONS[filter]?.includes(l.action));

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  const renderLog = ({ item }: { item: AuditLogEntry }) => {
    const config = ACTION_CONFIG[item.action] ?? {
      label: item.action,
      icon: "activity",
      color: "#6b7280",
    };
    const details = item.details ?? {};
    const actor =
      (item.user_id && nameById.get(item.user_id)) || "Someone";

    return (
      <View
        style={[
          styles.logCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.backgroundElement,
          },
        ]}
      >
        <View style={styles.logHeader}>
          <View
            style={[styles.iconBadge, { backgroundColor: config.color + "20" }]}
          >
            <Lucide name={config.icon as any} size={18} color={config.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.logTitle, { color: colors.text }]}>
              {config.label}
            </Text>
            <Text style={[styles.logTime, { color: colors.textSecondary }]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
          <Text
            style={[styles.actor, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {actor}
          </Text>
        </View>

        {config.rows && (
          <View style={styles.detailsContainer}>
            {config.rows(details).map(([label, value]) => (
              <DetailRow
                key={label}
                label={label}
                value={value}
                colors={colors}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[styles.chipRow, { borderBottomColor: colors.backgroundElement }]}
      >
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f.key}
          contentContainerStyle={{ paddingHorizontal: 10, gap: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setFilter(item.key)}
              style={[
                styles.chip,
                filter === item.key
                  ? [{ backgroundColor: colors.buttonPrimary }]
                  : [
                      {
                        backgroundColor: colors.card,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: colors.backgroundElement,
                      },
                    ],
              ]}
            >
              <Text
                style={[
                  styles.chipLabel,
                  { color: filter === item.key ? "#fff" : colors.text },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {isPending ? (
        <ActivityIndicator
          color={colors.buttonPrimary}
          style={{ paddingVertical: 48 }}
        />
      ) : visibleLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Lucide
            name="clipboard-list"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No activity logs yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLog}
          contentContainerStyle={{ padding: 10, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onRefresh={() => {
            refetch();
          }}
          refreshing={isRefetching}
        />
      )}
    </View>
  );
};

const DetailRow = ({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
      {label}
    </Text>
    <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
  </View>
);

export default TenantActivityLogs;

const styles = StyleSheet.create({
  logCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logTitle: { fontSize: 15, fontWeight: "600" },
  logTime: { fontSize: 12, marginTop: 2 },
  actor: { fontSize: 11 },
  detailsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: "500" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: { fontSize: 15 },
  chipRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: { fontSize: 13, fontWeight: "600" },
});
