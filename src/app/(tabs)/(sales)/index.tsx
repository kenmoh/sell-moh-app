import { fetchSales } from "@/api/sales";
import OrderCard from "@/components/order-card";
import Pill from "@/components/pill";
import SearchInput from "@/components/search-input";
import { ColorPalette, Colors } from "@/constants/theme";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterStatus = "All" | "Completed" | "Pending" | "Voided";
const filterOptions: FilterStatus[] = ["All", "Completed", "Pending", "Voided"];

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const hr = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const ampm = hr >= 12 ? "PM" : "AM";
    const h12 = hr % 12 || 12;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${h12}:${min} ${ampm}, ${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return iso;
  }
}

const statusMap: Record<string, "Completed" | "Pending" | "Voided"> = {
  completed: "Completed",
  pending: "Pending",
  partial: "Pending",
  voided: "Voided",
};

type ListItemType =
  | { type: "sticky_header" }
  | { type: "order_item"; data: { id: string; orderNumber: string; customer: string; itemCount: number; price: number; status: "Completed" | "Pending" | "Voided"; date: string } };

const SalesScreen = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<FilterStatus>("All");
  const [search, setSearch] = useState("");

  const apiStatus = activeFilter === "All" ? undefined : activeFilter.toLowerCase();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["sales", apiStatus],
    queryFn: () => fetchSales({ status: apiStatus, page_size: 100 }),
  });

  const orders = useMemo(() => {
    const items = data?.items ?? [];
    return items.map((s) => ({
      id: s.id,
      orderNumber: s.sale_number,
      customer: s.customer_name || "Walk-in Customer",
      itemCount: s.item_count ?? 0,
      price: s.total,
      status: statusMap[s.status] ?? "Pending",
      date: formatDate(s.created_at),
    }));
  }, [data]);

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

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status === "Completed").reduce((sum, o) => sum + o.price, 0),
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
        order.customer.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [orders, search]);

  const flatListData: ListItemType[] = useMemo(() => {
    const items: ListItemType[] = [{ type: "sticky_header" }];
    filteredOrders.forEach((order) => {
      items.push({ type: "order_item", data: order });
    });
    return items;
  }, [filteredOrders]);

  const handleOrderPress = (order: { id: string }) => {
    router.push({
      pathname: "/(tabs)/(sales)/[id]",
      params: { id: order.id },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={flatListData}
          keyExtractor={(item) =>
            item.type === "sticky_header" ? "sticky_header" : item.data.id
          }
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[1]}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={
            <View style={{ backgroundColor: colors.background }}>
              {/* Header Title Section */}
              <View style={styles.headerTitleRow}>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Sales
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
                      const count = getFilterCount(filter);
                      return (
                        <Pill
                          key={filter}
                          label={filter}
                          active={filter === activeFilter}
                          onPress={() => setActiveFilter(filter)}
                          badge={count}
                          color="#3b82f6"
                        />
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
      )}
    </SafeAreaView>
  );
};

export default SalesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
