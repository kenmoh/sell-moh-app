import { fetchDistributions, fetchDistribution, createDistribution, receiveDistribution, cancelDistribution } from "@/api/inventory";
import { Button } from "@/components/button";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import StoreSwitcher from "@/components/store-switcher";
import { Colors, ColorPalette } from "@/constants/theme";
import { useActiveStore } from "@/lib/store-context";
import { isOwnerRole } from "@/lib/roles";
import { useSession } from "@/lib/ctx";
import { useToast } from "@/hooks/use-toast";
import type {
  Distribution,
  DistributionDirection,
  DistributionListItem,
  DistributionStatus,
  DistributeCancelPayload,
  DistributeCreatePayload,
  DistributeReceivePayload,
} from "@/types/product";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_LABELS: Record<DistributionStatus, string> = {
  in_transit: "In transit",
  received: "Received",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<DistributionStatus, string> = {
  in_transit: "#d97706",
  received: "#059669",
  cancelled: "#dc2626",
};

const STATUS_FILTERS: { value: DistributionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_transit", label: "In transit" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
];

const DIRECTION_FILTERS: {
  value: DistributionDirection | "all";
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "incoming", label: "We receive" },
  { value: "outgoing", label: "We send" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

const DistributionCard: React.FC<{
  distribution: DistributionListItem;
  isIncoming: boolean;
  colors: ColorPalette;
  onPress: (distribution: DistributionListItem) => void;
}> = ({ distribution, isIncoming, colors, onPress }) => {
  const statusColor = STATUS_COLORS[distribution.status];
  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => onPress(distribution)}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.item, { color: colors.text }]}>
            {distribution.distribution_number ?? "—"}
          </Text>
          <Text style={[styles.route, { color: colors.textSecondary }]}>
            {distribution.from_store_name ?? "?"} →{" "}
            {distribution.to_store_name ?? "?"}
          </Text>
        </View>
        <View
          style={[
            styles.status,
            { backgroundColor: `${statusColor}1A`, borderColor: statusColor },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[distribution.status]}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {formatDate(distribution.created_at)}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {distribution.qty_dispatched} sent
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {distribution.qty_received} received
        </Text>
        {distribution.qty_damaged > 0 && (
          <Text style={[styles.meta, { color: STATUS_COLORS.cancelled }]}>
            {distribution.qty_damaged} damaged
          </Text>
        )}
        {distribution.shortage > 0 && (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {distribution.shortage} short
          </Text>
        )}
      </View>

      {isIncoming && distribution.status === "in_transit" && (
        <View style={styles.actions}>
          <Button
            fullWidth
            leftIcon={(color) => (
              <Lucide name="truck" size={18} color={color} />
            )}
            onPress={() => onPress(distribution)}
            title="Receive"
          />
        </View>
      )}

      {!isIncoming && distribution.status === "in_transit" && (
        <View style={styles.actions}>
          <Button
            variant="outline"
            fullWidth
            leftIcon={(color) => (
              <Lucide name="x" size={18} color={color} />
            )}
            onPress={() => onPress(distribution)}
            title="Cancel"
          />
        </View>
      )}
    </Pressable>
  );
};

type StorePick = { id: string; name: string; is_warehouse: boolean };

const Distributions = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];
  const { resolvedStoreId, stores } = useActiveStore();
  const { user } = useSession();
  const canCreate = user?.permissions?.includes("inventory:distribution_create") ?? false;
  const queryClient = useQueryClient();
  const toast = useToast();

  const [status, setStatus] = useState<DistributionStatus | "all">("all");
  const [direction, setDirection] = useState<DistributionDirection | "all">("all");
  const [selected, setSelected] = useState<DistributionListItem | null>(null);
  const [detail, setDetail] = useState<Distribution | null>(null);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const [receiveSheetVisible, setReceiveSheetVisible] = useState(false);
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const warehouseStores = useMemo(
    () => (stores ?? []).filter((s) => s.is_warehouse),
    [stores],
  );
  const destinationStores = useMemo(
    () => (stores ?? []).filter((s) => !s.is_warehouse),
    [stores],
  );
  const isWarehouse = useMemo(
    () => (stores ?? []).some((s) => s.id === resolvedStoreId && s.is_warehouse),
    [stores, resolvedStoreId],
  );

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["distributions", resolvedStoreId, status, direction],
    queryFn: () =>
      fetchDistributions({
        storeId: resolvedStoreId || undefined,
        direction: direction === "all" ? undefined : direction,
        status: status === "all" ? undefined : status,
        page: 1,
        page_size: 50,
      }),
    enabled: !!resolvedStoreId,
  });

  const rows = useMemo(() => data?.data ?? [], [data]);

  const onSelect = async (distribution: DistributionListItem) => {
    setSelected(distribution);
    const res = await fetchDistribution(distribution.id);
    setDetail(res);
    setDetailOpen(true);
  };

  const { mutate: createMutate, isPending: createPending } = useMutation({
    mutationFn: (payload: DistributeCreatePayload) =>
      createDistribution(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributions"] });
      toast.success("Distribution created");
      setCreateSheetVisible(false);
    },
    onError: (error) => toast.error("Could not create distribution", error.message),
  });

  const { mutate: receiveMutate, isPending: receivePending } = useMutation({
    mutationFn: ({ distributionId, payload }: { distributionId: string; payload: DistributeReceivePayload }) =>
      receiveDistribution(distributionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributions"] });
      toast.success("Received");
      setReceiveSheetVisible(false);
    },
    onError: (error) => toast.error("Could not receive distribution", error.message),
  });

  const { mutate: cancelMutate, isPending: cancelPending } = useMutation({
    mutationFn: ({ distributionId, payload }: { distributionId: string; payload: DistributeCancelPayload }) =>
      cancelDistribution(distributionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributions"] });
      toast.success("Cancelled");
      setCancelSheetVisible(false);
    },
    onError: (error) => toast.error("Could not cancel distribution", error.message),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: "Distributions", headerShown: true }} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <StoreSwitcher mode="store" />
        </View>
        {isWarehouse && canCreate && warehouseStores.length > 0 && (
          <Pressable
            onPress={() => setCreateSheetVisible(true)}
            style={[
              styles.headerIconButton,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <Lucide name="plus" size={16} color={colors.text} />
          </Pressable>
        )}
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
            <DistributionCard
              distribution={item}
              isIncoming={item.to_store_id === resolvedStoreId}
              colors={colors}
              onPress={onSelect}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Lucide name="truck" size={28} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No distributions
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Warehouse sends stock to stores here.
              </Text>
            </View>
          }
        />
      )}

      <CreateDistributionSheet
        visible={createSheetVisible}
        onVisibleChange={setCreateSheetVisible}
        warehouseStores={warehouseStores}
        destinationStores={destinationStores}
        disabled={!canCreate || warehouseStores.length === 0}
      />
      <ReceiveDistributionSheet
        visible={receiveSheetVisible}
        onVisibleChange={setReceiveSheetVisible}
        distribution={detail}
      />
      <CancelDistributionSheet
        visible={cancelSheetVisible}
        onVisibleChange={setCancelSheetVisible}
        distribution={selected}
      />
      <DistributionDetail
        open={detailOpen}
        distribution={detail}
        onClose={() => setDetailOpen(false)}
      />
    </View>
  );
};

export default Distributions;

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
  metaLabel: { fontSize: 11, fontWeight: "600", color: "#666" },
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

  // sheet styles
  sheetHeader: { gap: 4 },
  sheetSection: { marginHorizontal: 16, marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetSubtitle: { fontSize: 13, color: "#666", marginBottom: 8 },
  sheetLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  linesBox: { gap: 8, marginBottom: 8 },
  lineRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  lineInput: { flex: 1, height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10 },
  qtyInput: { width: 70, height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10 },
  lineName: { flex: 1 },
  lineItemName: { fontSize: 14, fontWeight: "600" },
  lineMeta: { fontSize: 12, color: "#666", marginTop: 2 },
  removeLine: { padding: 4 },
  addLine: { marginTop: 8, alignSelf: "flex-start" },
  notesInput: { height: 80, borderWidth: 1, borderRadius: 8, padding: 10, textAlignVertical: "top" },
  pinInput: { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10 },
  sheetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  cancelPress: {},
  cancelText: { fontSize: 14, fontWeight: "600" },
  submitPress: { marginLeft: 8 },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: 14, fontWeight: "700" },
  fromText: { fontSize: 14 },
});

function Pill({ label, active, onPress, size = "sm" }: { label: string; active: boolean; onPress: () => void; size?: "sm" | "md" }) {
  return (
    <Pressable onPress={onPress} style={[sheetStyles.pill, active && sheetStyles.pillActive]}>
      <Text style={[sheetStyles.pillText, active && sheetStyles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const sheetStyles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillActive: {},
  pillText: { fontSize: 12 },
  pillTextActive: { fontWeight: "700" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Create distribution sheet (warehouse)
// ─────────────────────────────────────────────────────────────────────────────

function CreateDistributionSheet({
  visible,
  onVisibleChange,
  warehouseStores,
  destinationStores,
  disabled,
}: {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  warehouseStores: StorePick[];
  destinationStores: StorePick[];
  disabled: boolean;
}) {
  const toast = useToast();
  const { user } = useSession();
  const isOwner = isOwnerRole(user);
  const { mutate, isPending } = useMutation({
    mutationFn: (payload: DistributeCreatePayload) => createDistribution(payload),
    onSuccess: () => {
      toast.success("Distribution created");
      onVisibleChange(false);
    },
    onError: (error) => toast.error("Could not create distribution", error.message),
  });

  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];

  const [fromStoreId, setFromStoreId] = useState(warehouseStores[0]?.id ?? "");
  const [toStoreId, setToStoreId] = useState("");
  const [notes, setNotes] = useState("");
  const [pin, setPin] = useState("");
  const [lines, setLines] = useState<{
    id: string;
    product_id: string;
    item_name: string;
    qty_dispatched: string;
    condition_dispatched: string;
  }[]>([]);

  const addLine = () =>
    setLines([
      ...lines,
      {
        id: String(Date.now()),
        product_id: "",
        item_name: "",
        qty_dispatched: "",
        condition_dispatched: "GOOD",
      },
    ]);
  const removeLine = (id: string) => setLines(lines.filter((l) => l.id !== id));

  const valid =
    lines.length > 0 &&
    lines.every((l) => l.product_id && l.item_name && Number(l.qty_dispatched) > 0) &&
    !!toStoreId &&
    (isOwner || pin.trim().length > 0);

  const handleVisibleChange = (next: boolean) => {
    if (!next) {
      setFromStoreId(warehouseStores[0]?.id ?? "");
      setToStoreId("");
      setNotes("");
      setPin("");
      setLines([]);
    }
    onVisibleChange(next);
  };

  return (
    <AppBottomSheet snapPoints={["85%"]} visible={visible} onVisibleChange={handleVisibleChange}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            Create distribution
          </Text>
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            Send stock from the warehouse to a store
          </Text>
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>From (warehouse)</Text>
          <AppTextInput
            value={fromStoreId}
            onChangeText={setFromStoreId}
            placeholder="Choose a warehouse"
            editable={false}
          />
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>To (store)</Text>
          <AppTextInput
            value={toStoreId}
            onChangeText={setToStoreId}
            placeholder="Choose a store"
            editable={false}
          />
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Items</Text>
          <View style={styles.linesBox}>
            {lines.map((line) => (
              <View key={line.id} style={styles.lineRow}>
                <AppTextInput
                  value={line.item_name}
                  onChangeText={(v) => {
                    const nl = lines.map((l) => (l.id === line.id ? { ...l, item_name: v } : l));
                    setLines(nl);
                  }}
                  placeholder="Product"
                  style={styles.lineInput}
                />
                <AppTextInput
                  value={line.qty_dispatched}
                  onChangeText={(v) => {
                    const nl = lines.map((l) => (l.id === line.id ? { ...l, qty_dispatched: v } : l));
                    setLines(nl);
                  }}
                  placeholder="Qty"
                  keyboardType="numeric"
                  style={styles.qtyInput}
                />
                <Pressable onPress={() => removeLine(line.id)} style={styles.removeLine}>
                  <Text style={{ color: "#dc2626", fontWeight: "700" }}>×</Text>
                </Pressable>
              </View>
            ))}
            {lines.length === 0 && (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>No items yet.</Text>
            )}
            <Pressable onPress={addLine} style={styles.addLine}>
              <Text style={{ color: colors.buttonPrimary, fontWeight: "700" }}>+ Add item</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Notes (optional)</Text>
          <AppTextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Weekend restock"
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
        </View>

        {!isOwner && (
          <View style={styles.sheetSection}>
            <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Supervisor PIN</Text>
            <AppTextInput
              value={pin}
              onChangeText={setPin}
              placeholder="Required to create a distribution"
              keyboardType="numeric"
              style={styles.pinInput}
            />
          </View>
        )}

        <View style={styles.sheetFooter}>
          <Pressable onPress={() => onVisibleChange(false)} style={styles.cancelPress}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              mutate({
                from_store_id: fromStoreId,
                to_store_id: toStoreId,
                lines: lines.map((l) => ({
                  product_id: l.product_id,
                  item_name: l.item_name,
                  qty_dispatched: Number(l.qty_dispatched),
                  condition_dispatched: l.condition_dispatched || undefined,
                })),
                notes: notes || null,
                supervisor_pin: isOwner ? undefined : pin || undefined,
              });
            }}
            disabled={disabled || !valid || isPending}
            style={[styles.submitPress, disabled || !valid ? styles.submitDisabled : {}]}
          >
            <Text style={[styles.submitText, { color: colors.buttonPrimary }]}>
              {isPending ? "Creating…" : "Create distribution"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppBottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Receive distribution sheet (store)
// ─────────────────────────────────────────────────────────────────────────────

function ReceiveDistributionSheet({
  visible,
  onVisibleChange,
  distribution,
}: {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  distribution: Distribution | null;
}) {
  const toast = useToast();
  const { user } = useSession();
  const isOwner = isOwnerRole(user);
  const { mutate, isPending } = useMutation({
    mutationFn: ({ distributionId, payload }: { distributionId: string; payload: DistributeReceivePayload }) =>
      receiveDistribution(distributionId, payload),
    onSuccess: () => {
      toast.success("Received");
      onVisibleChange(false);
    },
    onError: (error) => toast.error("Could not receive distribution", error.message),
  });

  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];

  const [pin, setPin] = useState("");
  const [lines, setLines] = useState<{
    id: string;
    item_id: string;
    item_name: string;
    qty_dispatched: number;
    qty_received: string;
    qty_damaged: string;
    condition_received: string;
    receive_notes: string;
  }[]>([]);

  React.useEffect(() => {
    if (!visible || !distribution) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(
      (distribution.items ?? []).map((item) => ({
        id: item.id,
        item_id: item.id,
        item_name: item.item_name,
        qty_dispatched: item.qty_dispatched,
        qty_received: String(item.qty_dispatched),
        qty_damaged: "0",
        condition_received: "GOOD",
        receive_notes: "",
      })),
    );
  }, [visible, distribution]);

  const anyDamage = lines.some((l) => Number(l.qty_damaged) > 0);

  const handleSubmit = () => {
    if (!distribution) return;
    mutate({
      distributionId: distribution.id,
      payload: {
        lines: lines.map((l) => ({
          item_id: l.item_id,
          qty_received: Number(l.qty_received),
          qty_damaged: Number(l.qty_damaged),
          condition_received: l.condition_received || undefined,
          receive_notes: l.receive_notes || undefined,
        })),
        supervisor_pin: anyDamage && !isOwner ? pin || undefined : undefined,
      },
    });
  };

  const handleVisibleChange = (next: boolean) => {
    if (!next) setLines([]);
    onVisibleChange(next);
  };

  return (
    <AppBottomSheet snapPoints={["85%"]} visible={visible} onVisibleChange={handleVisibleChange}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            Receive distribution
          </Text>
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            Confirm what arrived and its condition
          </Text>
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>From</Text>
          <Text style={styles.fromText}>{distribution?.from_store_name ?? "—"}</Text>
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Items</Text>
          <View style={styles.linesBox}>
            {lines.map((line) => (
              <View key={line.id} style={styles.lineRow}>
                <View style={styles.lineName}>
                  <Text style={[styles.lineItemName, { color: colors.text }]}>{line.item_name}</Text>
                  <Text style={[styles.lineMeta, { color: colors.textSecondary }]}>
                    dispatched {line.qty_dispatched}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>
                    Received
                  </Text>
                  <AppTextInput
                    value={line.qty_received}
                    onChangeText={(v) => {
                      const nl = lines.map((l) => (l.id === line.id ? { ...l, qty_received: v } : l));
                      setLines(nl);
                    }}
                    keyboardType="numeric"
                    style={styles.qtyInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>
                    Damaged
                  </Text>
                  <AppTextInput
                    value={line.qty_damaged}
                    onChangeText={(v) => {
                      const nl = lines.map((l) => (l.id === line.id ? { ...l, qty_damaged: v } : l));
                      setLines(nl);
                    }}
                    keyboardType="numeric"
                    style={styles.qtyInput}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {anyDamage && !isOwner && (
          <View style={styles.sheetSection}>
            <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Supervisor PIN</Text>
            <AppTextInput
              value={pin}
              onChangeText={setPin}
              placeholder="Required to record damage"
              keyboardType="numeric"
              style={styles.pinInput}
            />
          </View>
        )}

        <View style={styles.sheetFooter}>
          <Pressable onPress={() => onVisibleChange(false)} style={styles.cancelPress}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={isPending}
            style={[styles.submitPress, {}]}
          >
            <Text style={[styles.submitText, { color: colors.buttonPrimary }]}>
              {isPending ? "Receiving…" : "Confirm receipt"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppBottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cancel distribution sheet (warehouse)
// ─────────────────────────────────────────────────────────────────────────────

function CancelDistributionSheet({
  visible,
  onVisibleChange,
  distribution,
}: {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  distribution: DistributionListItem | null;
}) {
  const toast = useToast();
  const { user } = useSession();
  const isOwner = isOwnerRole(user);
  const { mutate, isPending } = useMutation({
    mutationFn: ({ distributionId, payload }: { distributionId: string; payload: DistributeCancelPayload }) =>
      cancelDistribution(distributionId, payload),
    onSuccess: () => {
      toast.success("Cancelled");
      onVisibleChange(false);
    },
    onError: (error) => toast.error("Could not cancel distribution", error.message),
  });

  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];

  const [reason, setReason] = useState("");
  const [pin, setPin] = useState("");

  const handleVisibleChange = (next: boolean) => {
    if (!next) {
      setReason("");
      setPin("");
    }
    onVisibleChange(next);
  };

  return (
    <AppBottomSheet snapPoints={["60%"]} visible={visible} onVisibleChange={handleVisibleChange}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            Cancel distribution
          </Text>
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            Returns dispatched stock to the warehouse
          </Text>
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Reason (optional)</Text>
          <AppTextInput
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Wrong destination"
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
        </View>

        {!isOwner && (
          <View style={styles.sheetSection}>
            <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Supervisor PIN</Text>
            <AppTextInput
              value={pin}
              onChangeText={setPin}
              placeholder="Required to cancel"
              keyboardType="numeric"
              style={styles.pinInput}
            />
          </View>
        )}

        <View style={styles.sheetFooter}>
          <Pressable onPress={() => onVisibleChange(false)} style={styles.cancelPress}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!distribution) return;
              mutate({
                distributionId: distribution.id,
                payload: {
                  cancel_reason: reason || null,
                  supervisor_pin: isOwner ? undefined : pin || undefined,
                },
              });
            }}
            disabled={isPending || !distribution}
            style={[styles.submitPress, {}]}
          >
            <Text style={[styles.submitText, { color: "#dc2626", fontWeight: "700" }]}>
              {isPending ? "Cancelling…" : "Cancel distribution"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppBottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Distribution detail
// ─────────────────────────────────────────────────────────────────────────────

function DistributionDetail({
  open,
  distribution,
  onClose,
}: {
  open: boolean;
  distribution: Distribution | null;
  onClose: () => void;
}) {
  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];

  if (!open || !distribution) return null;

  const statusColor = STATUS_COLORS[distribution.status];

  return (
    <AppBottomSheet snapPoints={["70%"]} visible={open} onVisibleChange={onClose}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {distribution.distribution_number ?? "Distribution"}
          </Text>
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            {distribution.from_store_name ?? "?"} → {distribution.to_store_name ?? "?"}
          </Text>
        </View>

        <View style={styles.sheetSection}>
          <View style={[styles.status, { backgroundColor: `${statusColor}1A`, borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[distribution.status]}
            </Text>
          </View>
        </View>

        <View style={styles.sheetSection}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Dispatched</Text>
            <Text style={[styles.meta, { color: colors.text }]}>{distribution.qty_dispatched}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Received</Text>
            <Text style={[styles.meta, { color: colors.text }]}>{distribution.qty_received}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Damaged</Text>
            <Text style={[styles.meta, { color: colors.text }]}>{distribution.qty_damaged}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Shortage</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{distribution.shortage}</Text>
          </View>
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Items</Text>
          <View style={styles.linesBox}>
            {distribution.items.map((item) => (
              <View key={item.id} style={styles.lineRow}>
                <View style={styles.lineName}>
                  <Text style={[styles.lineItemName, { color: colors.text }]}>{item.item_name}</Text>
                  <Text style={[styles.lineMeta, { color: colors.textSecondary }]}>
                    {item.qty_dispatched} → {item.qty_received} received, {item.qty_damaged} damaged
                  </Text>
                </View>
                {item.shortage > 0 && (
                  <Text style={[styles.lineMeta, { color: colors.textSecondary }]}>Shortage {item.shortage}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {distribution.notes && (
          <View style={styles.sheetSection}>
            <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>Notes</Text>
            <Text style={[styles.meta, { color: colors.text }]}>{distribution.notes}</Text>
          </View>
        )}

        <View style={styles.sheetFooter}>
          <Pressable onPress={onClose} style={styles.cancelPress}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Close</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppBottomSheet>
  );
}
