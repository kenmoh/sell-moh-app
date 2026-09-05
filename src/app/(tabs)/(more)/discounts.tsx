import { fetchCoupons, fetchDiscounts, toggleDiscount } from "@/api/discount";
import CouponSheet from "@/components/coupon-sheet";
import DiscountSheet from "@/components/discount-sheet";
import { Colors } from "@/constants/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Host, Switch } from "@expo/ui";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Discount, Coupon } from "@/types/discount";

type FilterType = "All" | "Percentage" | "Fixed Amount" | "Buy X Get Y";

type TabType = "promotions" | "coupons";

const filters: FilterType[] = ["All", "Percentage", "Fixed Amount", "Buy X Get Y"];

const Discounts = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [activeTab, setActiveTab] = useState<TabType>("promotions");

  // Discount sheet state
  const [showDiscountSheet, setShowDiscountSheet] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);

  // Coupon sheet state
  const [showCouponSheet, setShowCouponSheet] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Fetch discounts
  const {
    data: discountsData,
    isLoading: discountsLoading,
    refetch: refetchDiscounts,
  } = useQuery({
    queryKey: ["discounts"],
    queryFn: () => fetchDiscounts(),
  });

  // Fetch coupons
  const {
    data: couponsData,
    isLoading: couponsLoading,
    refetch: refetchCoupons,
  } = useQuery({
    queryKey: ["coupons"],
    queryFn: () => fetchCoupons(),
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDiscounts(), refetchCoupons()]);
    setRefreshing(false);
  }, [refetchDiscounts, refetchCoupons]);

  // Toggle discount
  const { mutate: toggleDiscountMutation } = useMutation({
    mutationFn: toggleDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
  });

  const discounts = discountsData?.items ?? [];
  const coupons = couponsData?.items ?? [];

  const filteredDiscounts = discounts.filter((d) => {
    if (activeFilter === "All") return true;
    return d.discount_type === activeFilter.toLowerCase().replace(" ", "_");
  });

  const activeDiscounts = filteredDiscounts.filter((d) => d.is_active);
  const inactiveDiscounts = filteredDiscounts.filter((d) => !d.is_active);

  const getDiscountLabel = (d: Discount) => {
    if (d.discount_type === "percentage") return `${d.value}% OFF`;
    if (d.discount_type === "fixed_amount") return `₦${d.value} OFF`;
    return `Buy ${d.value} Get ${d.buy_x_get_y_free_qty} Free`;
  };

  const getDiscountIcon = (type: string) => {
    if (type === "percentage") return "percent";
    if (type === "fixed_amount") return "banknote";
    return "gift";
  };

  const getDiscountColor = (type: string) => {
    if (type === "percentage") return "#3b82f6";
    if (type === "fixed_amount") return "#10b981";
    return "#a855f7";
  };

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderPromoCard = (promo: Discount) => {
    const color = getDiscountColor(promo.discount_type);
    const icon = getDiscountIcon(promo.discount_type);
    const isValidityExpired = promo.end_date && new Date(promo.end_date) < new Date();

    return (
      <Pressable
        key={promo.id}
        style={[
          styles.promoCard,
          { backgroundColor: colors.card },
          (!promo.is_active || isValidityExpired) && styles.expiredCard,
        ]}
        onPress={() => {
          setSelectedDiscount(promo);
          setShowDiscountSheet(true);
        }}
      >
        <View style={[styles.iconBadge, { backgroundColor: `${color}15` }]}>
          <Lucide name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.promoInfo}>
          <Text
            style={[
              styles.promoName,
              { color: colors.text },
              (!promo.is_active || isValidityExpired) && styles.expiredText,
            ]}
          >
            {promo.name}
          </Text>
          <Text style={[styles.promoDiscount, { color }]}>
            {getDiscountLabel(promo)}{" "}
            <Text style={[styles.promoDescription, { color: colors.textSecondary }]}>
              {promo.scope === "all"
                ? "all items"
                : promo.scope === "specific_products"
                  ? "selected products"
                  : "selected categories"}
            </Text>
          </Text>
          {(promo.start_date || promo.end_date) && (
            <View style={styles.validityRow}>
              <Lucide name="calendar" size={12} color="#9ca3af" />
              <Text style={[styles.validityText, { color: colors.textSecondary }]}>
                {formatDate(promo.start_date) ?? "Ongoing"} – {formatDate(promo.end_date) ?? "No end"}
              </Text>
            </View>
          )}
          {promo.min_order > 0 && (
            <View style={styles.validityRow}>
              <Lucide name="shopping-cart" size={12} color="#9ca3af" />
              <Text style={[styles.validityText, { color: colors.textSecondary }]}>
                Min. order: ₦{promo.min_order.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.promoRight}>
          {isValidityExpired || promo.is_active === false ? (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>Inactive</Text>
            </View>
          ) : (
            <Host matchContents>
              <Switch
                value={promo.is_active}
                onValueChange={() => toggleDiscountMutation(promo.id)}
              />
            </Host>
          )}
        </View>
      </Pressable>
    );
  };

  const renderCouponCard = (coupon: Coupon) => {
    const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
    const isMaxed = coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses;

    return (
      <Pressable
        key={coupon.id}
        style={[
          styles.promoCard,
          { backgroundColor: colors.card },
          (!coupon.is_active || isExpired || isMaxed) && styles.expiredCard,
        ]}
        onPress={() => {
          setSelectedCoupon(coupon);
          setShowCouponSheet(true);
        }}
      >
        <View style={[styles.iconBadge, { backgroundColor: "#f9731615" }]}>
          <Lucide name="ticket" size={20} color="#f97316" />
        </View>
        <View style={styles.promoInfo}>
          <Text
            style={[
              styles.promoName,
              { color: colors.text },
              (!coupon.is_active || isExpired || isMaxed) && styles.expiredText,
            ]}
          >
            {coupon.code}
          </Text>
          <Text style={[styles.promoDiscount, { color: "#f97316" }]}>
            {coupon.discount_type === "percentage"
              ? `${coupon.value}% OFF`
              : `₦${coupon.value} OFF`}
          </Text>
          <View style={styles.validityRow}>
            <Lucide name="repeat" size={12} color="#9ca3af" />
            <Text style={[styles.validityText, { color: colors.textSecondary }]}>
              {coupon.used_count}/{coupon.max_uses > 0 ? coupon.max_uses : "∞"} used
            </Text>
            {coupon.min_order > 0 && (
              <Text style={[styles.validityText, { color: colors.textSecondary }]}>
                {" · "}Min: ₦{coupon.min_order.toLocaleString()}
              </Text>
            )}
          </View>
          {coupon.expires_at && (
            <View style={styles.validityRow}>
              <Lucide name="calendar" size={12} color="#9ca3af" />
              <Text style={[styles.validityText, { color: isExpired ? "#ef4444" : colors.textSecondary }]}>
                {isExpired ? "Expired" : `Expires ${formatDate(coupon.expires_at)}`}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.promoRight}>
          {!coupon.is_active || isExpired || isMaxed ? (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>Inactive</Text>
            </View>
          ) : (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderContent = () => {
    if (activeTab === "promotions") {
      if (discountsLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        );
      }
      return (
        <View style={{ gap: 20 }}>
          {activeDiscounts.length > 0 && (
            <View>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                ACTIVE PROMOTIONS ({activeDiscounts.length})
              </Text>
              <View style={styles.promoList}>
                {activeDiscounts.map(renderPromoCard)}
              </View>
            </View>
          )}
          {inactiveDiscounts.length > 0 && (
            <View>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                INACTIVE ({inactiveDiscounts.length})
              </Text>
              <View style={styles.promoList}>
                {inactiveDiscounts.map(renderPromoCard)}
              </View>
            </View>
          )}
          {discounts.length === 0 && (
            <View style={styles.emptyContainer}>
              <Lucide name="tag" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No promotions yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Create your first promotion to offer discounts
              </Text>
            </View>
          )}
        </View>
      );
    }

    // Coupons tab
    if (couponsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      );
    }
    return (
      <View style={{ gap: 20 }}>
        {coupons.length > 0 && (
          <View>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              ALL COUPONS ({coupons.length})
            </Text>
            <View style={styles.promoList}>
              {coupons.map(renderCouponCard)}
            </View>
          </View>
        )}
        {coupons.length === 0 && (
          <View style={styles.emptyContainer}>
            <Lucide name="ticket" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No coupons yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Create coupon codes customers can apply at checkout
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Discounts & Coupons
        </Text>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            if (activeTab === "promotions") {
              setSelectedDiscount(null);
              setShowDiscountSheet(true);
            } else {
              setSelectedCoupon(null);
              setShowCouponSheet(true);
            }
          }}
        >
          <Lucide name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["promotions", "coupons"] as TabType[]).map((tab) => {
          const isActive = tab === activeTab;
          return (
            <Pressable
              key={tab}
              style={[
                styles.tab,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? "#3b82f6" : colors.textSecondary },
                ]}
              >
                {tab === "promotions" ? "Promotions" : "Coupons"}
              </Text>
              {isActive && (
                <Animated.View
                  layout={LinearTransition.springify().damping(20).stiffness(200)}
                  style={styles.activeTabIndicator}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          padding: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
      >
        {activeTab === "promotions" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabs}
            style={{ marginHorizontal: -20, marginBottom: 16 }}
          >
            {filters.map((f) => {
              const isActive = f === activeFilter;
              return (
                <Pressable
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isActive ? "#3b82f6" : "transparent",
                      borderColor: isActive ? "#3b82f6" : colors.backgroundElement,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: isActive ? "#fff" : colors.textSecondary },
                    ]}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <Animated.View
          key={activeTab}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition.springify().damping(20).stiffness(200)}
        >
          {renderContent()}
        </Animated.View>
      </ScrollView>

      <DiscountSheet
        visible={showDiscountSheet}
        onVisibleChange={setShowDiscountSheet}
        discount={selectedDiscount}
      />
      <CouponSheet
        visible={showCouponSheet}
        onVisibleChange={setShowCouponSheet}
        coupon={selectedCoupon}
      />
    </View>
  );
};

export default Discounts;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -1,
    left: "20%",
    right: "20%",
    height: 2,
    backgroundColor: "#3b82f6",
    borderRadius: 1,
  },
  tabText: { fontSize: 15, fontWeight: "600" },
  filterTabs: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  promoList: { gap: 10 },
  promoCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  expiredCard: { opacity: 0.6 },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  promoInfo: { flex: 1, gap: 4 },
  promoName: { fontSize: 15, fontWeight: "700" },
  promoDiscount: { fontSize: 14, fontWeight: "700", color: "#3b82f6" },
  promoDescription: { fontSize: 13, fontWeight: "400" },
  validityRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  validityText: { fontSize: 11, fontWeight: "500" },
  promoRight: { alignItems: "flex-end" },
  expiredBadge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  expiredBadgeText: { fontSize: 11, fontWeight: "600", color: "#6b7280" },
  activeBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: { fontSize: 11, fontWeight: "600", color: "#16a34a" },
  expiredText: { opacity: 0.6 },
  loadingContainer: { paddingVertical: 60, alignItems: "center" },
  emptyContainer: { paddingVertical: 60, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptySubtext: { fontSize: 13, textAlign: "center" },
});
