import { fetchCoupons, fetchDiscounts, toggleDiscount } from "@/api/discount";
import CouponSheet from "@/components/coupon-sheet";
import DiscountSheet from "@/components/discount-sheet";
import { Colors } from "@/constants/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Host, Switch } from "@expo/ui";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
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

const AnimatedPressable = ({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        onPress={onPress}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

const filters: FilterType[] = ["All", "Percentage", "Fixed Amount", "Buy X Get Y"];

const TABS: TabType[] = ["promotions", "coupons"];

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

  const contentOpacity = useSharedValue(1);
  const contentTranslateY = useSharedValue(0);

  const prevTab = useSharedValue(activeTab);

  const onTabChange = useCallback((tab: TabType) => {
    if (tab === prevTab.value) return;
    contentOpacity.value = 0;
    contentTranslateY.value = 8;
    prevTab.value = tab;
    requestAnimationFrame(() => {
      contentOpacity.value = withTiming(1, { duration: 200 });
      contentTranslateY.value = withTiming(0, { duration: 200 });
    });
    setActiveTab(tab);
  }, []);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const toggleDiscountMutation = useMutation({
    mutationFn: (id: string) => toggleDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
  });

  const discounts = discountsData?.items ?? [];
  const coupons = couponsData?.items ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchDiscounts(), refetchCoupons()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchDiscounts, refetchCoupons]);

  const getDiscountColor = (type: string) => {
    switch (type) {
      case "percentage":
        return "#3b82f6";
      case "fixed_amount":
        return "#10b981";
      case "buy_x_get_y":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return "percent";
      case "fixed_amount":
        return "banknote";
      case "buy_x_get_y":
        return "gift";
      default:
        return "tag";
    }
  };

  const getDiscountLabel = (promo: Discount) => {
    switch (promo.discount_type) {
      case "percentage":
        return `${promo.value}% OFF`;
      case "fixed_amount":
        return `$${promo.value} OFF`;
      case "buy_x_get_y":
        return `Buy ${promo.buy_x_get_y_free_qty} Get ${promo.buy_x_get_y_free_qty}`;
      default:
        return `${promo.value} OFF`;
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
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
      <AnimatedPressable
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
        </View>
        <View style={styles.promoRight}>
          {!promo.is_active ? (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>Inactive</Text>
            </View>
          ) : isValidityExpired ? (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>Expired</Text>
            </View>
          ) : (
            <Host matchContents>
              <Switch
                value={promo.is_active}
                onValueChange={() => toggleDiscountMutation.mutate(promo.id)}
              />
            </Host>
          )}
        </View>
      </AnimatedPressable>
    );
  };

  const renderCouponCard = (coupon: Coupon) => {
    const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
    const isMaxed = coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses;

    return (
      <AnimatedPressable
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
              : `$${coupon.value} OFF`}
            {coupon.min_order > 0 && (
              <Text style={[styles.promoDescription, { color: colors.textSecondary }]}>
                {" "}
                · Min. ${coupon.min_order}
              </Text>
            )}
          </Text>
          <View style={styles.validityRow}>
            {coupon.expires_at && (
              <>
                <Lucide name="calendar" size={12} color="#9ca3af" />
                <Text style={[styles.validityText, { color: colors.textSecondary }]}>
                  Expires {formatDate(coupon.expires_at)}
                </Text>
              </>
            )}
            {coupon.max_uses > 0 && (
              <Text style={[styles.validityText, { color: colors.textSecondary }]}>
                {" · "}{coupon.used_count}/{coupon.max_uses} used
              </Text>
            )}
          </View>
        </View>
        <View style={styles.promoRight}>
          {!coupon.is_active ? (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>Inactive</Text>
            </View>
          ) : isExpired ? (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>Expired</Text>
            </View>
          ) : isMaxed ? (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>Maxed</Text>
            </View>
          ) : (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
        </View>
      </AnimatedPressable>
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

      const filteredDiscounts = discounts.filter((d) => {
        if (activeFilter === "All") return true;
        if (activeFilter === "Percentage") return d.discount_type === "percentage";
        if (activeFilter === "Fixed Amount") return d.discount_type === "fixed_amount";
        if (activeFilter === "Buy X Get Y") return d.discount_type === "buy_x_get_y";
        return true;
      });

      if (filteredDiscounts.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Lucide name="tag" size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No promotions yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Create your first promotion to get started
            </Text>
          </View>
        );
      }

      return (
        <View style={styles.promoList}>
          {filteredDiscounts.map(renderPromoCard)}
        </View>
      );
    }

    if (couponsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      );
    }

    if (coupons.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Lucide name="ticket" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No coupons yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Create coupon codes for your customers
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.promoList}>
        {coupons.map(renderCouponCard)}
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
        <AnimatedPressable
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
        </AnimatedPressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <Pressable
              key={tab}
              style={styles.tab}
              onPress={() => onTabChange(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? "#3b82f6" : colors.textSecondary,
                    fontSize: isActive ? 17 : 15,
                    fontWeight: isActive ? "700" : "500",
                  },
                ]}
              >
                {tab === "promotions" ? "Promotions" : "Coupons"}
              </Text>
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
                <AnimatedPressable
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  style={{
                    backgroundColor: isActive ? "#3b82f6" : "transparent",
                    borderColor: isActive ? "#3b82f6" : colors.backgroundElement,
                    borderRadius: 100,
                    borderWidth: 1,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: isActive ? "#fff" : colors.textSecondary },
                    ]}
                  >
                    {f}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        )}

        <Animated.View style={contentAnimatedStyle}>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerLeft: {
    width: 24,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
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
