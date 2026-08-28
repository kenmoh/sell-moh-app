import OrderCard, { Order, OrderStatus } from "@/components/order-card";
import SearchInput from "@/components/search-input";
import { ColorPalette, Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterStatus = "All" | OrderStatus;
const filterOptions: FilterStatus[] = ["All", "Completed", "Pending", "Voided"];

const initialOrders: Order[] = [
  {
    id: 1,
    orderNumber: "455",
    customer: "Walk-in Customer",
    itemCount: 3,
    price: 3850,
    status: "Completed",
    date: "11:52 AM, July 31",
    paymentMethod: "Cash",
  },
  {
    id: 2,
    orderNumber: "253",
    customer: "Emeka John",
    itemCount: 12,
    price: 8850,
    status: "Pending",
    date: "10:15 AM, July 29",
    paymentMethod: "Card",
  },
  {
    id: 3,
    orderNumber: "453",
    customer: "Walk-in Customer",
    itemCount: 5,
    price: 3850,
    status: "Voided",
    date: "04:20 PM, July 30",
    paymentMethod: "Transfer",
  },
  {
    id: 4,
    orderNumber: "458",
    customer: "Sarah Williams",
    itemCount: 2,
    price: 12500,
    status: "Completed",
    date: "02:10 PM, Aug 01",
    paymentMethod: "Transfer",
  },
  {
    id: 5,
    orderNumber: "460",
    customer: "Walk-in Customer",
    itemCount: 7,
    price: 4200,
    status: "Completed",
    date: "09:30 AM, Aug 02",
    paymentMethod: "Cash",
  },
  {
    id: 6,
    orderNumber: "462",
    customer: "Chidi Nnamdi",
    itemCount: 1,
    price: 1800,
    status: "Pending",
    date: "08:45 AM, Aug 03",
    paymentMethod: "Card",
  },
];

type ListItemType =
  | { type: "sticky_header" }
  | { type: "order_item"; data: Order };

const OrdersScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];

  const [activeFilter, setActiveFilter] = useState<FilterStatus>("All");
  const [search, setSearch] = useState("");
  const [orders] = useState<Order[]>(initialOrders);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  // Summary Metrics Calculation
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === "Completed")
      .reduce((sum, o) => sum + o.price, 0);
  }, [orders]);

  const completedCount = useMemo(
    () => orders.filter((o) => o.status === "Completed").length,
    [orders],
  );
  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === "Pending").length,
    [orders],
  );
  const voidedCount = useMemo(
    () => orders.filter((o) => o.status === "Voided").length,
    [orders],
  );

  const getFilterCount = (filter: FilterStatus) => {
    if (filter === "All") return orders.length;
    if (filter === "Completed") return completedCount;
    if (filter === "Pending") return pendingCount;
    if (filter === "Voided") return voidedCount;
    return 0;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        (order.customer &&
          order.customer.toLowerCase().includes(search.toLowerCase()));

      const matchesFilter =
        activeFilter === "All" || order.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [orders, search, activeFilter]);

  const flatListData: ListItemType[] = useMemo(() => {
    const items: ListItemType[] = [{ type: "sticky_header" }];
    filteredOrders.forEach((order) => {
      items.push({ type: "order_item", data: order });
    });
    return items;
  }, [filteredOrders]);

  const handleOrderPress = (order: Order) => {
    router.push({
      pathname: "/(tabs)/(orders)/[id]",
      params: { id: String(order.id) },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <FlatList
        data={flatListData}
        keyExtractor={(item) =>
          item.type === "sticky_header" ? "sticky_header" : String(item.data.id)
        }
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <View style={{ backgroundColor: colors.background }}>
            {/* Header Title Section */}
            <View style={styles.headerTitleRow}>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Orders
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Track and manage sales transactions
                </Text>
              </View>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: colors.card,
                    borderColor: isDark ? "#282b32" : "#eef0f4",
                  },
                ]}
              >
                <Lucide name="shopping-bag" size={20} color="#3b82f6" />
              </View>
            </View>

            {/* Summary Metrics Row */}
            <View style={styles.statsRow}>
              <Pressable
                onPress={() => setActiveFilter("All")}
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.card,
                    borderColor:
                      activeFilter === "All"
                        ? "#3b82f6"
                        : isDark
                          ? "#262930"
                          : "#edf0f5",
                  },
                ]}
              >
                <View style={styles.statTop}>
                  <View
                    style={[
                      styles.statIconBadge,
                      { backgroundColor: "rgba(59, 130, 246, 0.12)" },
                    ]}
                  >
                    <Lucide name="dollar-sign" size={13} color="#3b82f6" />
                  </View>
                  <Text
                    style={[
                      styles.statLabelText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Sales
                  </Text>
                </View>
                <Text style={[styles.statValueText, { color: colors.text }]}>
                  ₦{totalRevenue.toLocaleString()}
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setActiveFilter(
                    activeFilter === "Completed" ? "All" : "Completed",
                  )
                }
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.card,
                    borderColor:
                      activeFilter === "Completed"
                        ? "#10b981"
                        : isDark
                          ? "#262930"
                          : "#edf0f5",
                  },
                ]}
              >
                <View style={styles.statTop}>
                  <View
                    style={[
                      styles.statIconBadge,
                      { backgroundColor: "rgba(16, 185, 129, 0.12)" },
                    ]}
                  >
                    <Lucide name="check-circle-2" size={13} color="#10b981" />
                  </View>
                  <Text
                    style={[
                      styles.statLabelText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Done
                  </Text>
                </View>
                <Text style={[styles.statValueText, { color: "#10b981" }]}>
                  {completedCount}
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setActiveFilter(
                    activeFilter === "Pending" ? "All" : "Pending",
                  )
                }
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.card,
                    borderColor:
                      activeFilter === "Pending"
                        ? "#f59e0b"
                        : isDark
                          ? "#262930"
                          : "#edf0f5",
                  },
                ]}
              >
                <View style={styles.statTop}>
                  <View
                    style={[
                      styles.statIconBadge,
                      { backgroundColor: "rgba(245, 158, 11, 0.12)" },
                    ]}
                  >
                    <Lucide name="clock" size={13} color="#f59e0b" />
                  </View>
                  <Text
                    style={[
                      styles.statLabelText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Pending
                  </Text>
                </View>
                <Text style={[styles.statValueText, { color: "#f59e0b" }]}>
                  {pendingCount}
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "sticky_header") {
            return (
              <View
                style={[
                  styles.stickyControlsWrapper,
                  {
                    backgroundColor: colors.background,
                    borderBottomColor: isDark ? "#22252a" : "#f0f2f5",
                  },
                ]}
              >
                {/* Category Pills (Horizontal Scroll) */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillsContainer}
                >
                  {filterOptions.map((filter) => {
                    const isActive = filter === activeFilter;
                    const count = getFilterCount(filter);
                    return (
                      <Pressable
                        key={filter}
                        onPress={() => setActiveFilter(filter)}
                        style={[
                          styles.categoryPill,
                          {
                            backgroundColor: isActive
                              ? "#3b82f6"
                              : colors.backgroundElement,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryPillText,
                            {
                              color: isActive
                                ? "#ffffff"
                                : colors.textSecondary,
                              fontWeight: isActive ? "700" : "600",
                            },
                          ]}
                        >
                          {filter}
                        </Text>
                        <View
                          style={[
                            styles.pillBadge,
                            {
                              backgroundColor: isActive
                                ? "rgba(255, 255, 255, 0.25)"
                                : isDark
                                  ? "#2d3038"
                                  : "#e2e5eb",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.pillBadgeText,
                              {
                                color: isActive
                                  ? "#ffffff"
                                  : colors.textSecondary,
                              },
                            ]}
                          >
                            {count}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Search Input Box */}
                <View style={styles.searchSection}>
                  <SearchInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by order # or customer..."
                    onClear={() => setSearch("")}
                  />
                </View>
              </View>
            );
          }

          return (
            <OrderCard
              order={item.data}
              onPress={() => handleOrderPress(item.data)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconBadge,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Lucide name="inbox" size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Orders Found
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              {search
                ? `No orders matching "${search}"`
                : `There are currently no ${activeFilter.toLowerCase()} orders.`}
            </Text>
            {(search || activeFilter !== "All") && (
              <Pressable
                style={[styles.resetButton, { backgroundColor: "#3b82f6" }]}
                onPress={() => {
                  setSearch("");
                  setActiveFilter("All");
                }}
              >
                <Text style={styles.resetButtonText}>Clear Filters</Text>
              </Pressable>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  statIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabelText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statValueText: {
    fontSize: 16,
    fontWeight: "800",
  },
  stickyControlsWrapper: {
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  pillsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 100,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 7,
  },
  categoryPillText: {
    fontSize: 13,
  },
  pillBadge: {
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  searchSection: {
    paddingHorizontal: 16,
  },
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
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 18,
  },
  resetButton: {
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  resetButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});
