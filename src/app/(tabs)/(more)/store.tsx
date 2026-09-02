import { fetchTenantStores } from "@/api/store";
import SearchInput from "@/components/search-input";
import StoreSheet from "@/components/store-sheet";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

type StoreData = {
  id: string;
  name: string;
  address: string;
  is_warehouse: boolean;
  status: string;
  created_at: string;
};

const StoresScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);

  const {
    data: stores = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchTenantStores,
  });

  const filteredStores = useMemo(() => {
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.address?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [stores, search]);

  const handleOpenAdd = useCallback(() => {
    setSelectedStore(null);
    setSheetVisible(true);
  }, []);

  const handleViewStore = useCallback(
    (store: StoreData) => {
      router.push({
        pathname: "/(tabs)/(more)/[storeId]",
        params: { storeId: store.id },
      });
    },
    [router],
  );

  const handleOpenEdit = useCallback((store: StoreData) => {
    setSelectedStore(store);
    setSheetVisible(true);
  }, []);

  const renderStoreCard = useCallback(
    ({ item }: { item: StoreData }) => (
      <Pressable
        style={[
          styles.storeCard,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? "#282b32" : "#eef0f4",
          },
        ]}
        onPress={() => handleViewStore(item)}
      >
        <View style={styles.storeCardHeader}>
          <View
            style={[
              styles.storeIcon,
              { backgroundColor: item.is_warehouse ? "rgba(168,85,247,0.12)" : "rgba(59,130,246,0.12)" },
            ]}
          >
            <Lucide
              name={item.is_warehouse ? "warehouse" : "store"}
              size={20}
              color={item.is_warehouse ? "#a855f7" : "#3b82f6"}
            />
          </View>
          <View style={styles.storeInfo}>
            <Text style={[styles.storeName, { color: colors.text }]}>
              {item.name}
            </Text>
            {item.address ? (
              <Text
                style={[styles.storeAddress, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.address}
              </Text>
            ) : null}
          </View>
          <Pressable
            style={[
              styles.editIconBtn,
              { backgroundColor: colors.backgroundElement },
            ]}
            onPress={(e) => {
              e.stopPropagation?.();
              handleOpenEdit(item);
            }}
          >
            <Lucide name="pencil" size={14} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.storeCardFooter}>
          <View style={styles.storeType}>
            <Lucide
              name={item.is_warehouse ? "package" : "shopping-bag"}
              size={12}
              color={colors.textSecondary}
            />
            <Text style={[styles.storeTypeText, { color: colors.textSecondary }]}>
              {item.is_warehouse ? "Warehouse" : "Retail Store"}
            </Text>
          </View>
          <Lucide name="chevron-right" size={16} color={colors.textSecondary} />
        </View>
      </Pressable>
    ),
    [colors, isDark, handleViewStore, handleOpenEdit],
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <FlatList
        data={filteredStores}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ backgroundColor: colors.background }}>
            <View style={styles.headerTitleRow}>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Stores
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {stores.length} store{stores.length !== 1 ? "s" : ""} total
                </Text>
              </View>
              <Pressable
                style={[styles.addBtn, { backgroundColor: colors.buttonPrimary }]}
                onPress={handleOpenAdd}
              >
                <Lucide name="plus" size={20} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.searchSection}>
              <SearchInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search stores..."
                onClear={() => setSearch("")}
              />
            </View>
          </View>
        }
        renderItem={renderStoreCard}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconBadge,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Lucide name="store" size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Stores Found
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: colors.textSecondary },
              ]}
            >
              {search
                ? `No stores matching "${search}"`
                : "Create your first store to get started."}
            </Text>
            {!search && (
              <Pressable
                style={[styles.emptyBtn, { backgroundColor: colors.buttonPrimary }]}
                onPress={handleOpenAdd}
              >
                <Lucide name="plus" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Add Store</Text>
              </Pressable>
            )}
          </View>
        }
      />

      <StoreSheet
        visible={sheetVisible}
        onVisibleChange={setSheetVisible}
        store={selectedStore}
      />
    </SafeAreaView>
  );
};

export default StoresScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  searchSection: { paddingHorizontal: 16, paddingBottom: 12 },
  storeCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  storeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  storeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: "700" },
  storeAddress: { fontSize: 13, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  storeCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  storeType: { flexDirection: "row", alignItems: "center", gap: 4 },
  storeTypeText: { fontSize: 12, fontWeight: "500" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: "center", marginBottom: 18 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  emptyBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
