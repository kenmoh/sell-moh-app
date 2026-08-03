import { Colors } from "@/constants/theme";
import { Host, Switch } from "@expo/ui";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterType = "All" | "Percentage" | "Fixed Amount" | "Buy X Get Y";

interface Promotion {
  id: string;
  name: string;
  discount: string;
  description: string;
  validRange: string;
  iconColor: string;
  iconName: string;
  active: boolean;
  expired?: boolean;
}

const promotions: Promotion[] = [
  {
    id: "1",
    name: "Weekend Special",
    discount: "10% OFF",
    description: "all beverages",
    validRange: "Valid Dec 14 – Dec 15, 2024",
    iconColor: "#3b82f6",
    iconName: "tag",
    active: true,
  },
  {
    id: "2",
    name: "Bulk Buy Discount",
    discount: "₦500 OFF",
    description: "orders above ₦10,000",
    validRange: "Valid Dec 1 – Dec 31, 2024",
    iconColor: "#16a34a",
    iconName: "circle-slash",
    active: true,
  },
  {
    id: "3",
    name: "New Customer",
    discount: "15% OFF",
    description: "first purchase",
    validRange: "Valid ongoing",
    iconColor: "#a855f7",
    iconName: "gift",
    active: false,
  },
];

const expiredPromotions: Promotion[] = [
  {
    id: "4",
    name: "Black Friday",
    discount: "20% OFF",
    description: "everything",
    validRange: "Expired Nov 29, 2024",
    iconColor: "#9ca3af",
    iconName: "tag",
    active: false,
    expired: true,
  },
];

const filters: FilterType[] = ["All", "Percentage", "Fixed Amount", "Buy X Get Y"];

const Discounts = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    "1": true,
    "2": true,
    "3": false,
  });

  const togglePromo = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderPromoCard = (promo: Promotion) => {
    const isExpired = promo.expired;
    const isEnabled = toggles[promo.id] ?? false;

    return (
      <View
        key={promo.id}
        style={[
          styles.promoCard,
          { backgroundColor: colors.card },
          isExpired && styles.expiredCard,
        ]}
      >
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: `${promo.iconColor}15` },
          ]}
        >
          <Lucide
            name={promo.iconName as any}
            size={20}
            color={promo.iconColor}
          />
        </View>
        <View style={styles.promoInfo}>
          <Text
            style={[
              styles.promoName,
              { color: colors.text },
              isExpired && styles.expiredText,
            ]}
          >
            {promo.name}
          </Text>
          <Text style={styles.promoDiscount}>
            {promo.discount}{" "}
            <Text
              style={[
                styles.promoDescription,
                { color: colors.textSecondary },
                isExpired && styles.expiredText,
              ]}
            >
              {promo.description}
            </Text>
          </Text>
          <View style={styles.validityRow}>
            <Lucide name="calendar" size={12} color="#9ca3af" />
            <Text
              style={[
                styles.validityText,
                { color: colors.textSecondary },
                isExpired && styles.expiredText,
              ]}
            >
              {promo.validRange}
            </Text>
          </View>
        </View>
        <View style={styles.promoRight}>
          {isExpired ? (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>Expired</Text>
            </View>
          ) : (
            <Host matchContents>
              <Switch
                value={isEnabled}
                onValueChange={() => togglePromo(promo.id)}
              />
            </Host>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Lucide name="chevron-left" size={24} color={colors.text} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Discounts & Promotions
        </Text>
        <Pressable style={styles.addButton}>
          <Lucide name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          gap: 20,
        }}
      >
        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
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

        <View style={{ paddingHorizontal: 20, gap: 20 }}>
          {/* Active Promotions */}
          <View>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              ACTIVE PROMOTIONS
            </Text>
            <View style={styles.promoList}>
              {promotions.map(renderPromoCard)}
            </View>
          </View>

          {/* Expired */}
          <View>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              EXPIRED
            </Text>
            <View style={styles.promoList}>
              {expiredPromotions.map(renderPromoCard)}
            </View>
          </View>

          {/* Create CTA */}
          <Pressable style={styles.createButton}>
            <Lucide name="plus" size={18} color="#fff" />
            <Text style={styles.createButtonText}>Create Promotion</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  headerLeft: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
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
  expiredText: { opacity: 0.6 },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  createButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
