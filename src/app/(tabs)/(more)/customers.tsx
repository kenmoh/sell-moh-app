import { fetchCustomers } from "@/api/customer";
import CustomerSheet from "@/components/customer-sheet";
import SearchInput from "@/components/search-input";
import { Colors } from "@/constants/theme";
import { Customer } from "@/types/customer";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
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

const CustomersScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["customers", page, search],
    queryFn: () => fetchCustomers(page, 50, search || undefined),
  });

  const customers = useMemo(() => data ?? [], [data]);
  const total = data?.total ?? 0;

  const handleOpenAdd = useCallback(() => {
    setSelectedCustomer(null);
    setSheetVisible(true);
  }, []);

  const handleOpenEdit = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setSheetVisible(true);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Customer }) => (
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? "#282b32" : "#eef0f4",
          },
        ]}
        onPress={() => handleOpenEdit(item)}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: "rgba(59,130,246,0.12)" },
            ]}
          >
            <Text style={[styles.avatarText, { color: "#3b82f6" }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: colors.text }]}>
              {item.name}
            </Text>
            {item.email ? (
              <Text
                style={[styles.cardEmail, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.email}
              </Text>
            ) : null}
          </View>
          <Lucide name="chevron-right" size={16} color={colors.textSecondary} />
        </View>

        <View
          style={[
            styles.cardFooter,
            { borderTopColor: isDark ? "#22252a" : "#f0f2f5" },
          ]}
        >
          {item.phone ? (
            <View style={styles.cardDetail}>
              <Lucide name="phone" size={12} color={colors.textSecondary} />
              <Text
                style={[styles.cardDetailText, { color: colors.textSecondary }]}
              >
                {item.phone}
              </Text>
            </View>
          ) : null}
          {item.address ? (
            <View style={styles.cardDetail}>
              <Lucide name="map-pin" size={12} color={colors.textSecondary} />
              <Text
                style={[styles.cardDetailText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.address}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    ),
    [colors, isDark, handleOpenEdit],
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
        data={customers || []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ backgroundColor: colors.background }}>
            <View style={styles.headerTitleRow}>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Customers
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {total} customer{total !== 1 ? "s" : ""} total
                </Text>
              </View>
              <Pressable
                style={[
                  styles.addBtn,
                  { backgroundColor: colors.buttonPrimary },
                ]}
                onPress={handleOpenAdd}
              >
                <Lucide name="plus" size={20} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.searchSection}>
              <SearchInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name, email or phone..."
                onClear={() => setSearch("")}
              />
            </View>
          </View>
        }
        renderItem={renderItem}
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
              <Lucide
                name="users-round"
                size={32}
                color={colors.textSecondary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Customers Found
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              {search
                ? `No customers matching "${search}"`
                : "Add your first customer to get started."}
            </Text>
            {!search && (
              <Pressable
                style={[
                  styles.emptyBtn,
                  { backgroundColor: colors.buttonPrimary },
                ]}
                onPress={handleOpenAdd}
              >
                <Lucide name="plus" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Add Customer</Text>
              </Pressable>
            )}
          </View>
        }
      />

      <CustomerSheet
        visible={sheetVisible}
        onVisibleChange={setSheetVisible}
        customer={selectedCustomer}
      />
    </SafeAreaView>
  );
};

export default CustomersScreen;

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
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: "700" },
  cardEmail: { fontSize: 13, marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cardDetail: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  cardDetailText: { fontSize: 12, flex: 1 },
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
