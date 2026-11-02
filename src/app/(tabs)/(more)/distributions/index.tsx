import {
  cancelDistribution,
  createDistribution,
  fetchDistribution,
  fetchDistributions,
  fetchProducts,
  receiveDistribution,
} from "@/api/inventory";
import AppBottomSheet from "@/components/bottom-sheet";
import { Button } from "@/components/button";
import Pill from "@/components/pill";
import StoreSwitcher from "@/components/store-switcher";
import AppTextInput from "@/components/text-input";
import { ColorPalette, Colors } from "@/constants/theme";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/lib/ctx";
import { isOwnerRole } from "@/lib/roles";
import { useActiveStore } from "@/lib/store-context";
import type {
  DistributeCancelPayload,
  DistributeCreatePayload,
  DistributeReceivePayload,
  Distribution,
  DistributionListItem,
  DistributionStatus,
  ProductResponse,
} from "@/types/product";
import Add from "@expo/material-symbols/add.xml";
import { Checkbox, Host } from "@expo/ui";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
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
  { value: "in_transit", label: "Dispatched" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
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
        <Pill
          label={STATUS_LABELS[distribution.status]}
          active
          color={statusColor}
          size="sm"
        />
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
            leftIcon={(color) => <Lucide name="x" size={18} color={color} />}
            onPress={() => onPress(distribution)}
            title="Cancel"
          />
        </View>
      )}
    </Pressable>
  );
};

type StorePick = { id: string; name: string; is_warehouse: boolean };
type DistributionLineDraft = {
  product: ProductResponse;
  qtyDispatched: string;
  conditionDispatched: "GOOD" | "FAIR" | "DAMAGED";
};

type ReceiveLineDraft = {
  id: string;
  item_id: string;
  item_name: string;
  qty_dispatched: number;
  qty_received: string;
  qty_damaged: string;
  condition_received: string;
  receive_notes: string;
};

const DISPATCH_CONDITIONS: DistributionLineDraft["conditionDispatched"][] = [
  "GOOD",
  "FAIR",
  "DAMAGED",
];

const RECEIVE_CONDITIONS = ["GOOD", "FAIR", "DAMAGED"] as const;

const Distributions = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];
  const { resolvedStoreId, stores } = useActiveStore();
  const { user } = useSession();
  const canCreate =
    user?.permissions?.includes("inventory:distribution_create") ?? false;
  const queryClient = useQueryClient();
  const toast = useToast();

  const [status, setStatus] = useState<DistributionStatus | "all">("all");
  const [selected, setSelected] = useState<DistributionListItem | null>(null);
  const [detail, setDetail] = useState<Distribution | null>(null);
  const [receiveSheetVisible, setReceiveSheetVisible] = useState(false);
  const [cancelSheetVisible, setCancelSheetVisible] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const warehouseStores = useMemo(
    () => (stores ?? []).filter((s) => s.is_warehouse),
    [stores],
  );
  const isWarehouse = useMemo(
    () =>
      (stores ?? []).some((s) => s.id === resolvedStoreId && s.is_warehouse),
    [stores, resolvedStoreId],
  );

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["distributions", resolvedStoreId, status],
    queryFn: () =>
      fetchDistributions({
        storeId: resolvedStoreId || undefined,
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

  const { mutate: receiveMutate, isPending: receivePending } = useMutation({
    mutationFn: ({
      distributionId,
      payload,
    }: {
      distributionId: string;
      payload: DistributeReceivePayload;
    }) => receiveDistribution(distributionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributions"] });
      toast.success("Received");
      setReceiveSheetVisible(false);
    },
    onError: (error) =>
      toast.error("Could not receive distribution", error.message),
  });

  const { mutate: cancelMutate, isPending: cancelPending } = useMutation({
    mutationFn: ({
      distributionId,
      payload,
    }: {
      distributionId: string;
      payload: DistributeCancelPayload;
    }) => cancelDistribution(distributionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributions"] });
      toast.success("Cancelled");
      setCancelSheetVisible(false);
    },
    onError: (error) =>
      toast.error("Could not cancel distribution", error.message),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: "Distributions", headerShown: true }} />

      {isWarehouse && canCreate && warehouseStores.length > 0 && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon={process.env.EXPO_OS === "ios" ? "plus" : Add}
            onPress={() =>
              router.push("/(tabs)/(more)/distributions/new-distribution")
            }
          />
        </Stack.Toolbar>
      )}

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <StoreSwitcher mode="store" />
        </View>
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
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
            />
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
        resolvedStoreId={resolvedStoreId}
        onClose={() => setDetailOpen(false)}
        onReceive={() => {
          if (!detail) return;
          setDetailOpen(false);
          setReceiveSheetVisible(true);
          setSelected({ id: detail.id } as DistributionListItem);
        }}
        onCancel={() => {
          if (!detail) return;
          setDetailOpen(false);
          setCancelSheetVisible(true);
          setSelected({ id: detail.id } as DistributionListItem);
        }}
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
  actionsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 19 },

  // sheet styles
  sheetHeader: { gap: 4 },
  sheetSection: { marginHorizontal: 16, marginBottom: 12, gap: 8 },
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
  lineInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  qtyInput: {
    width: 70,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  lineName: { flex: 1 },
  lineItemName: { fontSize: 14, fontWeight: "600" },
  lineMeta: { fontSize: 12, color: "#666", marginTop: 2 },
  removeLine: { padding: 4 },
  addLine: { marginTop: 8, alignSelf: "flex-start" },
  notesInput: {
    height: 80,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
  },
  pinInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  receiveContent: { paddingTop: 8, paddingBottom: 8 },
  receiveHeader: { gap: 6, marginBottom: 20 },
  receiveTitle: { fontSize: 20, fontWeight: "700" },
  receiveSubtitle: { fontSize: 14, lineHeight: 20 },
  receiveSection: { gap: 10, marginBottom: 20 },
  receiveLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  receiveSource: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
  },
  receiveSourceName: { fontSize: 15, fontWeight: "600" },
  receiveItemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  receiveItemCount: { fontSize: 12 },
  receiveItems: { gap: 12 },
  receiveItemCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  receiveItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  receiveItemName: { flex: 1, fontSize: 15, fontWeight: "700" },
  receiveDispatched: {
    overflow: "hidden",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: "600",
  },
  receiveQuantityRow: { flexDirection: "row", gap: 10 },
  receiveField: { flex: 1 },
  receiveFieldGroup: { gap: 8 },
  receiveFieldLabel: { fontSize: 12, fontWeight: "600" },
  receiveConditions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  receivePinSection: { gap: 8, marginBottom: 16 },
  receivePinHint: { fontSize: 12, lineHeight: 18, paddingHorizontal: 4 },
  receiveFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  receiveFooterButton: { flex: 1 },
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
  alertsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  alertStat: {
    width: "48%",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  alertStatValue: { fontSize: 20, fontWeight: "800" },
  alertStatLabel: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  createContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  createHeader: { gap: 4, marginBottom: 20 },
  createSubtitle: { fontSize: 14, lineHeight: 20 },
  createSection: { gap: 10, marginBottom: 20 },
  createSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  createLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  createHelper: { fontSize: 12, lineHeight: 18 },
  createPillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  createSelectionList: { gap: 8 },
  createSelectionCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  createCheckboxHost: { width: "100%", minHeight: 40 },
  createProductCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
  },
  createLineDetails: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    gap: 12,
  },
  createQtyField: { gap: 6 },
  createConditionField: { gap: 8 },
  createFieldLabel: { fontSize: 12, fontWeight: "600" },
  createConditionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  createLoading: { paddingVertical: 18 },
  createMessage: { gap: 8 },
  createError: { color: "#dc2626", fontSize: 12 },
  createRetry: { fontSize: 13, fontWeight: "700" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Create distribution sheet (warehouse)
// ─────────────────────────────────────────────────────────────────────────────

export function CreateDistributionScreen({
  warehouseStores,
  destinationStores,
  disabled,
}: {
  warehouseStores: StorePick[];
  destinationStores: StorePick[];
  disabled: boolean;
}) {
  const toast = useToast();
  const { user } = useSession();
  const isOwner = isOwnerRole(user);
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async (payloads: DistributeCreatePayload[]) => {
      const createdStoreIds: string[] = [];
      const failures: { storeId: string; message: string }[] = [];

      for (const payload of payloads) {
        try {
          await createDistribution(payload);
          createdStoreIds.push(payload.to_store_id);
        } catch (error) {
          failures.push({
            storeId: payload.to_store_id,
            message:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred.",
          });
        }
      }

      return { createdStoreIds, failures };
    },
    onSuccess: ({ createdStoreIds, failures }) => {
      if (createdStoreIds.length > 0) {
        void queryClient.invalidateQueries({ queryKey: ["distributions"] });
      }

      if (failures.length > 0) {
        setToStoreIds(failures.map((failure) => failure.storeId));
        toast.error(
          createdStoreIds.length > 0
            ? "Some distributions could not be created"
            : "Could not create distribution",
          failures
            .map((failure) => {
              const storeName = destinationStores.find(
                (store) => store.id === failure.storeId,
              )?.name;
              return `${storeName ?? failure.storeId}: ${failure.message}`;
            })
            .join("; "),
        );
        return;
      }

      toast.success(
        `Created distribution${createdStoreIds.length === 1 ? "" : "s"} to ${
          createdStoreIds.length
        } store${createdStoreIds.length === 1 ? "" : "s"}`,
      );
      router.back();
    },
    onError: (error) =>
      toast.error("Could not create distribution", error.message),
  });

  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const [fromStoreId, setFromStoreId] = useState(warehouseStores[0]?.id ?? "");
  const [toStoreIds, setToStoreIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [pin, setPin] = useState("");
  const [lines, setLines] = useState<DistributionLineDraft[]>([]);

  const selectedFromStoreId = warehouseStores.some(
    (store) => store.id === fromStoreId,
  )
    ? fromStoreId
    : (warehouseStores[0]?.id ?? "");
  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
    error: productError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["distribution-products", selectedFromStoreId],
    queryFn: () => fetchProducts(selectedFromStoreId, { page_size: 100 }),
    enabled: !!selectedFromStoreId,
  });
  const products = useMemo(() => productsData?.data ?? [], [productsData]);
  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    if (!search) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.sku?.toLowerCase().includes(search),
    );
  }, [productSearch, products]);

  const setProductSelected = (product: ProductResponse, selected: boolean) => {
    setLines((current) => {
      const alreadySelected = current.some(
        (line) => line.product.id === product.id,
      );
      if (selected && !alreadySelected) {
        return [
          ...current,
          {
            product,
            qtyDispatched: "1",
            conditionDispatched: "GOOD",
          },
        ];
      }
      if (!selected && alreadySelected) {
        return current.filter((line) => line.product.id !== product.id);
      }
      return current;
    });
  };

  const valid =
    !!selectedFromStoreId &&
    toStoreIds.length > 0 &&
    lines.length > 0 &&
    lines.every((line) => {
      const quantity = Number(line.qtyDispatched);
      return Number.isInteger(quantity) && quantity > 0;
    }) &&
    (isOwner || pin.trim().length > 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.createContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.createHeader}>
          <Text
            style={[styles.createSubtitle, { color: colors.textSecondary }]}
          >
            Send warehouse stock to one or more stores
          </Text>
        </View>

        <View style={styles.createSection}>
          <Text style={[styles.createLabel, { color: colors.textSecondary }]}>
            From warehouse
          </Text>
          {warehouseStores.length > 0 ? (
            <View style={styles.createPillRow}>
              {warehouseStores.map((store) => (
                <Pill
                  key={store.id}
                  label={store.name}
                  icon="store"
                  active={selectedFromStoreId === store.id}
                  onPress={() => {
                    if (selectedFromStoreId === store.id) return;
                    setFromStoreId(store.id);
                    setLines([]);
                  }}
                />
              ))}
            </View>
          ) : (
            <Text
              style={[styles.createHelper, { color: colors.textSecondary }]}
            >
              No warehouse is available.
            </Text>
          )}
        </View>

        <View style={styles.createSection}>
          <View style={styles.createSectionHeader}>
            <Text style={[styles.createLabel, { color: colors.textSecondary }]}>
              To stores
            </Text>
            <Text
              style={[styles.createHelper, { color: colors.textSecondary }]}
            >
              {toStoreIds.length} selected
            </Text>
          </View>
          <View style={styles.createPillRow}>
            {destinationStores.map((store) => (
              <Pill
                key={store.id}
                label={store.name}
                size="sm"
                active={toStoreIds.includes(store.id)}
                disabled={disabled}
                onPress={() =>
                  setToStoreIds((current) =>
                    current.includes(store.id)
                      ? current.filter((id) => id !== store.id)
                      : [...current, store.id],
                  )
                }
              />
            ))}
            {destinationStores.length === 0 && (
              <Text
                style={[styles.createHelper, { color: colors.textSecondary }]}
              >
                No destination stores are available.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.createSection}>
          <View style={styles.createSectionHeader}>
            <Text style={[styles.createLabel, { color: colors.textSecondary }]}>
              Items
            </Text>
            <Text
              style={[styles.createHelper, { color: colors.textSecondary }]}
            >
              {lines.length} selected
            </Text>
          </View>
          <AppTextInput
            placeholder="Search warehouse items..."
            value={productSearch}
            onChangeText={setProductSearch}
            leftIcon="search"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {productsLoading ? (
            <ActivityIndicator
              color={colors.buttonPrimary}
              style={styles.createLoading}
            />
          ) : productsError ? (
            <View style={styles.createMessage}>
              <Text style={[styles.createError, { color: "#dc2626" }]}>
                Could not load warehouse items:{" "}
                {productError instanceof Error
                  ? productError.message
                  : "Please try again."}
              </Text>
              <Pressable onPress={() => void refetchProducts()}>
                <Text
                  style={[styles.createRetry, { color: colors.buttonPrimary }]}
                >
                  Try again
                </Text>
              </Pressable>
            </View>
          ) : filteredProducts.length > 0 ? (
            <View style={styles.createSelectionList}>
              {filteredProducts.map((product) => {
                const line = lines.find(
                  (item) => item.product.id === product.id,
                );
                const isSelected = !!line;

                return (
                  <View
                    key={product.id}
                    style={[
                      styles.createProductCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.backgroundElement,
                      },
                    ]}
                  >
                    <Host matchContents style={styles.createCheckboxHost}>
                      <Checkbox
                        label={product.name}
                        value={isSelected}
                        onValueChange={(selected) =>
                          setProductSelected(product, selected)
                        }
                      />
                    </Host>
                    {line && (
                      <View
                        style={[
                          styles.createLineDetails,
                          {
                            borderTopColor:
                              scheme === "dark" ? "#22252a" : "#f0f2f5",
                          },
                        ]}
                      >
                        <View style={styles.createQtyField}>
                          <Text
                            style={[
                              styles.createFieldLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Quantity
                          </Text>
                          <AppTextInput
                            value={line.qtyDispatched}
                            onChangeText={(value) =>
                              setLines((current) =>
                                current.map((item) =>
                                  item.product.id === product.id
                                    ? {
                                        ...item,
                                        qtyDispatched: value.replace(
                                          /[^0-9]/g,
                                          "",
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                            placeholder="1"
                            keyboardType="number-pad"
                          />
                        </View>
                        <View style={styles.createConditionField}>
                          <Text
                            style={[
                              styles.createFieldLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Condition
                          </Text>
                          <View style={styles.createConditionRow}>
                            {DISPATCH_CONDITIONS.map((condition) => (
                              <Pill
                                key={condition}
                                label={
                                  condition.charAt(0) +
                                  condition.slice(1).toLowerCase()
                                }
                                size="sm"
                                active={line.conditionDispatched === condition}
                                onPress={() =>
                                  setLines((current) =>
                                    current.map((item) =>
                                      item.product.id === product.id
                                        ? {
                                            ...item,
                                            conditionDispatched: condition,
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text
              style={[styles.createHelper, { color: colors.textSecondary }]}
            >
              {products.length === 0
                ? "No items in this warehouse."
                : "No items match your search."}
            </Text>
          )}
        </View>

        <View style={styles.createSection}>
          <Text style={[styles.createLabel, { color: colors.textSecondary }]}>
            Notes (optional)
          </Text>
          <AppTextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Weekend restock"
            multiline
          />
        </View>

        {!isOwner && (
          <View style={styles.createSection}>
            <Text style={[styles.createLabel, { color: colors.textSecondary }]}>
              Supervisor PIN
            </Text>
            <AppTextInput
              value={pin}
              onChangeText={setPin}
              placeholder="Required to create a distribution"
              keyboardType="numeric"
              secureTextEntry
            />
          </View>
        )}

        <Button
          disabled={disabled || !valid || isPending}
          fullWidth
          leftIcon={(color) => <Lucide name="truck" size={18} color={color} />}
          loading={isPending}
          loadingTitle="Creating..."
          onPress={() => {
            const payloads = toStoreIds.map((toStoreId) => ({
              from_store_id: selectedFromStoreId,
              to_store_id: toStoreId,
              lines: lines.map((line) => ({
                product_id: line.product.id,
                item_name: line.product.name,
                qty_dispatched: Number(line.qtyDispatched),
                condition_dispatched: line.conditionDispatched,
              })),
              notes: notes || undefined,
              supervisor_pin: isOwner ? undefined : pin.trim(),
            }));
            mutate(payloads);
          }}
          title="Create distribution"
        />
      </ScrollView>
    </View>
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
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: ({
      distributionId,
      payload,
    }: {
      distributionId: string;
      payload: DistributeReceivePayload;
    }) => receiveDistribution(distributionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["distributions"] });
      toast.success("Received");
      setLines([]);
      setPin("");
      onVisibleChange(false);
    },
    onError: (error) =>
      toast.error("Could not receive distribution", error.message),
  });

  const scheme = useColorScheme();
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];

  const [pin, setPin] = useState("");
  const [lines, setLines] = useState<ReceiveLineDraft[]>([]);

  React.useEffect(() => {
    if (!visible || !distribution) return;
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

  const updateLine = (lineId: string, patch: Partial<ReceiveLineDraft>) => {
    setLines((current) =>
      current.map((line) =>
        line.id === lineId ? { ...line, ...patch } : line,
      ),
    );
  };

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
    if (!next) {
      setLines([]);
      setPin("");
    }
    onVisibleChange(next);
  };

  return (
    <AppBottomSheet
      snapPoints={["85%"]}
      visible={visible}
      onVisibleChange={handleVisibleChange}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.receiveContent}
      >
        <View style={styles.receiveHeader}>
          <Text style={[styles.receiveTitle, { color: colors.text }]}>
            Receive distribution
          </Text>
          <Text
            style={[styles.receiveSubtitle, { color: colors.textSecondary }]}
          >
            Confirm what arrived and its condition. Damaged units are logged
            separately and never added to stock.
          </Text>
        </View>

        <View style={styles.receiveSection}>
          <Text style={[styles.receiveLabel, { color: colors.textSecondary }]}>
            From
          </Text>
          <View
            style={[
              styles.receiveSource,
              {
                backgroundColor: colors.card,
                borderColor: colors.backgroundElement,
              },
            ]}
          >
            <Lucide name="warehouse" size={18} color={colors.textSecondary} />
            <Text style={[styles.receiveSourceName, { color: colors.text }]}>
              {distribution?.from_store_name ?? "—"}
            </Text>
          </View>
        </View>

        <View style={styles.receiveSection}>
          <View style={styles.receiveItemsHeader}>
            <Text style={[styles.receiveLabel, { color: colors.textSecondary }]}>
              Items
            </Text>
            <Text
              style={[
                styles.receiveItemCount,
                { color: colors.textSecondary },
              ]}
            >
              {lines.length} {lines.length === 1 ? "item" : "items"}
            </Text>
          </View>
          <View style={styles.receiveItems}>
            {lines.map((line) => (
              <View
                key={line.id}
                style={[
                  styles.receiveItemCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.backgroundElement,
                  },
                ]}
              >
                <View style={styles.receiveItemHeader}>
                  <Text
                    style={[styles.receiveItemName, { color: colors.text }]}
                  >
                    {line.item_name}
                  </Text>
                  <Text
                    style={[
                      styles.receiveDispatched,
                      {
                        color: colors.textSecondary,
                        backgroundColor: colors.backgroundElement,
                      },
                    ]}
                  >
                    Sent {line.qty_dispatched}
                  </Text>
                </View>

                <View style={styles.receiveQuantityRow}>
                  <View style={styles.receiveField}>
                    <AppTextInput
                      label="Received"
                      value={line.qty_received}
                      onChangeText={(value) =>
                        updateLine(line.id, {
                          qty_received: value.replace(/[^0-9]/g, ""),
                        })
                      }
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.receiveField}>
                    <AppTextInput
                      label="Damaged"
                      value={line.qty_damaged}
                      onChangeText={(value) =>
                        updateLine(line.id, {
                          qty_damaged: value.replace(/[^0-9]/g, ""),
                        })
                      }
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.receiveFieldGroup}>
                  <Text
                    style={[
                      styles.receiveFieldLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Condition received
                  </Text>
                  <View style={styles.receiveConditions}>
                    {RECEIVE_CONDITIONS.map((condition) => (
                      <Pill
                        key={condition}
                        label={
                          condition.charAt(0) +
                          condition.slice(1).toLowerCase()
                        }
                        size="sm"
                        active={line.condition_received === condition}
                        onPress={() =>
                          updateLine(line.id, {
                            condition_received: condition,
                          })
                        }
                      />
                    ))}
                  </View>
                </View>

                <AppTextInput
                  label="Notes (optional)"
                  placeholder="Add a note about this item"
                  value={line.receive_notes}
                  onChangeText={(value) =>
                    updateLine(line.id, { receive_notes: value })
                  }
                />
              </View>
            ))}
          </View>
        </View>

        {!isOwner && (
          <View style={styles.receivePinSection}>
            <AppTextInput
              label="Supervisor PIN"
              value={pin}
              onChangeText={setPin}
              placeholder="Required if any damage is recorded"
              keyboardType="number-pad"
              secureTextEntry
              autoComplete="off"
              textContentType="none"
            />
            <Text
              style={[styles.receivePinHint, { color: colors.textSecondary }]}
            >
              Needed only when damaged units are recorded.
            </Text>
          </View>
        )}

        <View style={styles.receiveFooter}>
          <Button
            variant="outline"
            style={styles.receiveFooterButton}
            onPress={() => onVisibleChange(false)}
            title="Cancel"
          />
          <Button
            style={styles.receiveFooterButton}
            onPress={handleSubmit}
            loading={isPending}
            loadingTitle="Receiving..."
            title="Confirm receipt"
          />
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
    mutationFn: ({
      distributionId,
      payload,
    }: {
      distributionId: string;
      payload: DistributeCancelPayload;
    }) => cancelDistribution(distributionId, payload),
    onSuccess: () => {
      toast.success("Cancelled");
      onVisibleChange(false);
    },
    onError: (error) =>
      toast.error("Could not cancel distribution", error.message),
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
    <AppBottomSheet
      snapPoints={["60%"]}
      visible={visible}
      onVisibleChange={handleVisibleChange}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            Cancel distribution
          </Text>
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            Returns dispatched stock to the warehouse
          </Text>
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>
            Reason (optional)
          </Text>
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
            <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>
              Supervisor PIN
            </Text>
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
          <Pressable
            onPress={() => onVisibleChange(false)}
            style={styles.cancelPress}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
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
            <Text
              style={[
                styles.submitText,
                { color: "#dc2626", fontWeight: "700" },
              ]}
            >
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
  resolvedStoreId,
  onClose,
  onReceive,
  onCancel,
}: {
  open: boolean;
  distribution: Distribution | null;
  resolvedStoreId: string | null;
  onClose: () => void;
  onReceive?: () => void;
  onCancel?: () => void;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[scheme === "dark" ? "dark" : "light"];

  if (!open || !distribution) return null;

  const statusColor = STATUS_COLORS[distribution.status];
  const isIncoming = distribution.to_store_id === resolvedStoreId;
  const canReceive = isIncoming && distribution.status === "in_transit";
  const canCancel = !isIncoming && distribution.status === "in_transit";

  return (
    <AppBottomSheet
      snapPoints={["90%"]}
      visible={open}
      onVisibleChange={onClose}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheetHeader}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {distribution.distribution_number ?? "Distribution"}
            </Text>

            <Pill
              label={STATUS_LABELS[distribution.status]}
              active
              color={statusColor}
              size="sm"
            />
          </View>
          <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
            {distribution.from_store_name ?? "?"} →{" "}
            {distribution.to_store_name ?? "?"}
          </Text>
        </View>

        <View style={styles.alertsRow}>
          <View
            style={[
              styles.alertStat,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#282b32" : "#eef0f4",
              },
            ]}
          >
            <Text
              style={[styles.alertStatValue, { color: colors.textSecondary }]}
            >
              {distribution.qty_dispatched}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.alertStatLabel, { color: colors.textSecondary }]}
            >
              Dispatched
            </Text>
          </View>
          <View
            style={[
              styles.alertStat,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#282b32" : "#eef0f4",
              },
            ]}
          >
            <Text style={[styles.alertStatValue, { color: "#059669" }]}>
              {distribution.qty_received}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.alertStatLabel, { color: colors.textSecondary }]}
            >
              Received
            </Text>
          </View>
          <View
            style={[
              styles.alertStat,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#282b32" : "#eef0f4",
              },
            ]}
          >
            <Text
              style={[
                styles.alertStatValue,
                {
                  color:
                    distribution.qty_damaged > 0
                      ? "#dc2626"
                      : colors.textSecondary,
                },
              ]}
            >
              {distribution.qty_damaged}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.alertStatLabel, { color: colors.textSecondary }]}
            >
              Damaged
            </Text>
          </View>
          <View
            style={[
              styles.alertStat,
              {
                backgroundColor: colors.card,
                borderColor: isDark ? "#282b32" : "#eef0f4",
              },
            ]}
          >
            <Text
              style={[
                styles.alertStatValue,
                {
                  color:
                    distribution.shortage > 0
                      ? "#d97706"
                      : colors.textSecondary,
                },
              ]}
            >
              {distribution.shortage}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.alertStatLabel, { color: colors.textSecondary }]}
            >
              Shortage
            </Text>
          </View>
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>
            Items
          </Text>
          <View style={styles.linesBox}>
            {distribution.items.map((item) => (
              <View key={item.id} style={styles.lineRow}>
                <View style={styles.lineName}>
                  <Text style={[styles.lineItemName, { color: colors.text }]}>
                    {item.item_name}
                  </Text>
                  <Text
                    style={[styles.lineMeta, { color: colors.textSecondary }]}
                  >
                    {item.qty_dispatched} → {item.qty_received} received,{" "}
                    {item.qty_damaged} damaged
                  </Text>
                </View>
                {item.shortage > 0 && (
                  <Pill
                    label={`Short ${item.shortage}`}
                    active
                    color="#d97706"
                    size="sm"
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {distribution.notes && (
          <View style={styles.sheetSection}>
            <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>
              Notes
            </Text>
            <Text style={[styles.meta, { color: colors.text }]}>
              {distribution.notes}
            </Text>
          </View>
        )}

        <View style={styles.sheetSection}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
              Dispatched by
            </Text>
            <Text style={[styles.meta, { color: colors.text }]}>
              {distribution.dispatched_by_name ?? "—"}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
              Received by
            </Text>
            <Text style={[styles.meta, { color: colors.text }]}>
              {distribution.received_by_name ?? "—"}
            </Text>
          </View>
          {distribution.pin_verified_by_name && (
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                PIN authorised by
              </Text>
              <Text style={[styles.meta, { color: colors.text }]}>
                {distribution.pin_verified_by_name}
              </Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
              Created on
            </Text>
            <Text style={[styles.meta, { color: colors.text }]}>
              {distribution.created_at
                ? new Date(distribution.created_at).toLocaleDateString(
                    undefined,
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )
                : "—"}
            </Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          {canReceive && (
            <Button
              fullWidth
              leftIcon={(color) => (
                <Lucide name="truck" size={18} color={color} />
              )}
              onPress={onReceive}
              title="Receive"
            />
          )}
          {canCancel && (
            <Button
              variant="outline"
              fullWidth
              leftIcon={(color) => <Lucide name="x" size={18} color={color} />}
              onPress={onCancel}
              title="Cancel distribution"
            />
          )}
        </View>
      </ScrollView>
    </AppBottomSheet>
  );
}
