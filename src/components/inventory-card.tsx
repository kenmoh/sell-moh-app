import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";

export type StatusType = "In Stock" | "Low" | "Out";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: StatusType;
  category: string;
  image?: string;
}

export interface InventoryCardProps {
  item: InventoryItem;
  onPress?: (item: InventoryItem) => void;
  onQuickAdjust?: (item: InventoryItem) => void;
  style?: ViewStyle;
}

const statusConfig: Record<
  StatusType,
  { color: string; bg: string; dot: string; label: string }
> = {
  "In Stock": {
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    dot: "#10b981",
    label: "In Stock",
  },
  Low: {
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    dot: "#f59e0b",
    label: "Low Stock",
  },
  Out: {
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    dot: "#ef4444",
    label: "Out of Stock",
  },
};

const categoryIconMap: Record<string, string> = {
  Beverages: "cup-soda",
  Food: "utensils",
  Electronics: "smartphone",
  Household: "home",
};

export const InventoryCard: React.FC<InventoryCardProps> = ({
  item,
  onPress,
  onQuickAdjust,
  style,
}) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const status = statusConfig[item.status] || statusConfig["In Stock"];
  const iconName = categoryIconMap[item.category] || "package";

  // Calculate stock progress width (assuming 50 units as comfortable stock benchmark)
  const maxBenchmark = 50;
  const stockRatio = Math.min(Math.max(item.stock / maxBenchmark, 0), 1);

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: scheme === "dark" ? "#2a2d34" : "#eef0f4",
          opacity: pressed ? 0.94 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {/* Top Header Row: Category Badge + Status Badge */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.categoryTag,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <Lucide
            name={iconName as any}
            size={12}
            color={colors.textSecondary}
          />
          <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
            {item.category}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
          <Text style={[styles.statusText, { color: status.color }]}>
            {item.stock} {status.label}
          </Text>
        </View>
      </View>

      {/* Main Product Info Section */}
      <View style={styles.mainSection}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor:
                scheme === "dark"
                  ? "rgba(59, 130, 246, 0.15)"
                  : "rgba(59, 130, 246, 0.08)",
            },
          ]}
        >
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>

        <View style={styles.infoCol}>
          <Text
            style={[styles.itemName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View style={styles.skuRow}>
            <Text style={[styles.skuText, { color: colors.textSecondary }]}>
              {item.sku.slice(0, 16)}
            </Text>
          </View>
        </View>

        <View style={styles.priceCol}>
          <Text style={styles.priceValue}>₦{item.price.toLocaleString()}</Text>
        </View>
      </View>

      {/* Bottom Progress Bar & Quick Adjust Row */}
      <View style={styles.bottomRow}>
        <View style={styles.stockProgressContainer}>
          <View
            style={[
              styles.stockTrack,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <View
              style={[
                styles.stockFill,
                {
                  width: `${stockRatio * 100}%`,
                  backgroundColor: status.color,
                },
              ]}
            />
          </View>
        </View>

        {onQuickAdjust && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onQuickAdjust(item);
            }}
            hitSlop={8}
            style={[
              styles.adjustButton,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <Lucide name="sliders-horizontal" size={13} color={colors.text} />
            <Text style={[styles.adjustButtonText, { color: colors.text }]}>
              Adjust
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

export default InventoryCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0.1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  mainSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3b82f6",
  },
  infoCol: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  skuRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  skuText: {
    fontSize: 12,
    fontWeight: "500",
  },
  priceCol: {
    alignItems: "flex-end",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2563eb",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },
  stockProgressContainer: {
    flex: 1,
  },
  stockTrack: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  stockFill: {
    height: "100%",
    borderRadius: 3,
  },
  adjustButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  adjustButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
