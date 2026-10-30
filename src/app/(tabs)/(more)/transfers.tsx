import { fetchTransferRequests } from "@/api/inventory";
import { Button } from "@/components/button";
import Pill from "@/components/pill";
import StoreSwitcher from "@/components/store-switcher";
import TransferDecisionSheet, {
  type DecisionMode,
} from "@/components/transfer-decision-sheet";
import TransferRequestSheet from "@/components/transfer-request-sheet";
import { ColorPalette, Colors } from "@/constants/theme";
import { useActiveStore } from "@/lib/store-context";
import type {
  TransferDirection,
  TransferRequest,
  TransferRequestStatus,
} from "@/types/product";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_LABELS: Record<TransferRequestStatus, string> = {
  pending: "Awaiting approval",
  approved: "Approved",
  fulfilled: "Sent",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<TransferRequestStatus, string> = {
  pending: "#d97706",
  approved: "#0284c7",
  fulfilled: "#059669",
  rejected: "#dc2626",
};

const STATUS_FILTERS: { value: TransferRequestStatus | "all"; label: string }[] =
  [
    { value: "pending", label: "Awaiting" },
    { value: "approved", label: "Approved" },
    { value: "fulfilled", label: "Sent" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];

const DIRECTION_FILTERS: {
  value: TransferDirection | "all";
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "incoming", label: "To send" },
  { value: "outgoing", label: "We asked" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

const TransferCard: React.FC<{
  request: TransferRequest;
  isIncoming: boolean;
  colors: ColorPalette;
  onDecision: (mode: DecisionMode, request: TransferRequest) => void;
}> = ({ request, isIncoming, colors, onDecision }) => {
  const statusColor = STATUS_COLORS[request.status];
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.item, { color: colors.text }]}>
            {request.item_name ?? "Item"}
          </Text>
          <Text style={[styles.route, { color: colors.textSecondary }]}>
            {request.supplying_store_name ?? "?"} →{" "}
            {request.requesting_store_name ?? "?"}
          </Text>
        </View>
        <View
          style={[
            styles.status,
            { backgroundColor: `${statusColor}1A`, borderColor: statusColor },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[request.status]}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {request.request_number ?? "—"} · {formatDate(request.created_at)}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {request.requested_qty} asked
          {request.approved_qty != null
            ? ` · ${request.approved_qty} approved`
            : ""}
        </Text>
      </View>

      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        Asked by {request.created_by_name ?? "—"}
        {request.fulfilled_by_name
          ? ` · Sent by ${request.fulfilled_by_name}`
          : ""}
      </Text>

      {request.rejection_reason ? (
        <Text style={[styles.reason, { color: STATUS_COLORS.rejected }]}>
          {request.rejection_reason}
        </Text>
      ) : null}

      {isIncoming && request.status === "pending" && (
        <View style={styles.actions}>
          <Button
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => onDecision("reject", request)}
            title="Reject"
          />
          <Button
            style={{ flex: 1 }}
            onPress={() => onDecision("approve", request)}
            title="Approve"
          />
        </View>
      )}

      {isIncoming && request.status === "approved" && (
        <View style={styles.actions}>
          <Button
            fullWidth
            leftIcon={(color) => (
              <Lucide name="package-check" size={18} color={color} />
            )}
            onPress={() => onDecision("send", request)}
            title="Send Stock"
          />
        </View>
      )}
    </View>
  );
};

const Transfers = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];
  const { resolvedStoreId, isOwner } = useActiveStore();

  const [status, setStatus] = useState<TransferRequestStatus | "all">(
    "pending",
  );
  const [direction, setDirection] = useState<TransferDirection | "all">("all");
  const [requestSheetVisible, setRequestSheetVisible] = useState(false);
  const [decision, setDecision] = useState<{
    mode: DecisionMode;
    request: TransferRequest;
  } | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["transfer-requests", resolvedStoreId, status, direction],
    queryFn: () =>
      fetchTransferRequests(resolvedStoreId, {
        status: status === "all" ? undefined : status,
        direction: direction === "all" ? undefined : direction,
        page: 1,
        page_size: 50,
      }),
    enabled: !!resolvedStoreId,
  });

  const rows = useMemo(() => data?.data ?? [], [data]);

  const onDecision = (mode: DecisionMode, request: TransferRequest) =>
    setDecision({ mode, request });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: "Transfers", headerShown: true }} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <StoreSwitcher mode="store" />
        </View>
        <Pressable
          onPress={() => setRequestSheetVisible(true)}
          style={[
            styles.headerIconButton,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <Lucide name="plus" size={16} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.filters}>
        {DIRECTION_FILTERS.map((filter) => (
          <Pill
            key={filter.value}
            label={filter.label}
            size="sm"
            active={direction === filter.value}
            onPress={() => setDirection(filter.value)}
          />
        ))}
      </View>
      <View style={styles.filters}>
        {STATUS_FILTERS.map((filter) => (
          <Pill
            key={filter.value}
            label={filter.label}
            size="sm"
            active={status === filter.value}
            onPress={() => setStatus(filter.value)}
          />
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.buttonPrimary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 15,
            paddingBottom: insets.bottom + 24,
            gap: 12,
          }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          renderItem={({ item }) => (
            <TransferCard
              request={item}
              isIncoming={item.supplying_store_id === resolvedStoreId}
              colors={colors}
              onDecision={onDecision}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Lucide
                name="arrow-right-left"
                size={28}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No transfer requests
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Ask another store for stock, or approve what they asked you for.
              </Text>
            </View>
          }
        />
      )}

      <TransferRequestSheet
        visible={requestSheetVisible}
        onVisibleChange={setRequestSheetVisible}
        currentStoreId={resolvedStoreId}
      />

      <TransferDecisionSheet
        key={decision ? `${decision.mode}-${decision.request.id}` : "none"}
        visible={!!decision}
        onVisibleChange={(visible) => !visible && setDecision(null)}
        mode={decision?.mode ?? "approve"}
        request={decision?.request ?? null}
        isOwner={isOwner}
      />
    </View>
  );
};

export default Transfers;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 15,
    paddingBottom: 8,
    flexWrap: "wrap",
  },
  card: { borderRadius: 14, padding: 14, gap: 8 },
  cardTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  item: { fontSize: 16, fontWeight: "700" },
  route: { fontSize: 13, marginTop: 2 },
  status: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  meta: { fontSize: 12 },
  reason: { fontSize: 12, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 6,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 19 },
});
