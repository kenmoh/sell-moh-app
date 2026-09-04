import { AuditLogEntry, getAuditLogs } from "@/api/auth";
import AppView from "@/components/app-view";
import { Colors } from "@/constants/theme";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const TENANT_ACTIONS = [
  "cart_void_approved",
  "cart_cleared",
  "cart_item_deleted",
] as const;

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  cart_void_approved: {
    label: "Item Voided",
    icon: "x-circle",
    color: "#ef4444",
  },
  cart_cleared: {
    label: "Cart Cleared",
    icon: "trash-2",
    color: "#f59e0b",
  },
  cart_item_deleted: {
    label: "Item Deleted",
    icon: "minus-circle",
    color: "#a855f7",
  },
};

const TenantActivityLogs = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const { data: logs, isPending, refetch, isRefetching } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => getAuditLogs({ limit: 100 }),
  });

  const tenantLogs = (logs ?? []).filter((l) =>
    TENANT_ACTIONS.includes(l.action as any),
  );

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

    return (
      <View
        style={[
          styles.logCard,
          { backgroundColor: colors.card, borderColor: colors.backgroundElement },
        ]}
      >
        <View style={styles.logHeader}>
          <View style={[styles.iconBadge, { backgroundColor: config.color + "20" }]}>
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
        </View>

        <View style={styles.detailsContainer}>
          {item.action === "cart_void_approved" && (
            <>
              <DetailRow label="Product" value={String(details.product_name ?? "—")} colors={colors} />
              <DetailRow label="Qty Voided" value={String(details.qty_voided ?? "—")} colors={colors} />
              <DetailRow label="Qty Remaining" value={String(details.qty_remaining ?? "—")} colors={colors} />
              <DetailRow label="Unit Price" value={details.unit_price ? `₦${Number(details.unit_price).toLocaleString()}` : "—"} colors={colors} />
            </>
          )}
          {item.action === "cart_cleared" && (
            <>
              <DetailRow label="Items Cleared" value={String(details.items_cleared ?? "—")} colors={colors} />
            </>
          )}
          {item.action === "cart_item_deleted" && (
            <>
              <DetailRow label="Product" value={String(details.product_name ?? details.product_id ?? "—")} colors={colors} />
              <DetailRow label="Quantity" value={String(details.qty ?? "—")} colors={colors} />
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <AppView>
      {isPending ? (
        <ActivityIndicator
          color={colors.buttonPrimary}
          style={{ paddingVertical: 48 }}
        />
      ) : tenantLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Lucide name="clipboard-list" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No activity logs yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={tenantLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLog}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onRefresh={() => refetch()}
          refreshing={isRefetching}
        />
      )}
    </AppView>
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
});
