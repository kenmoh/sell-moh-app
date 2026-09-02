import { ColorPalette, Colors } from "@/constants/theme";
import { Product } from "@/types/product-types";
import { Lucide } from "@react-native-vector-icons/lucide";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

interface CardProps {
  product: Product;
  onPress?: () => void;
}

const Card = ({ product, onPress }: CardProps) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];

  const stock = product.in_stock ?? 0;
  const reorderPoint = product.reorder_point ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = reorderPoint > 0 && stock > 0 && stock <= reorderPoint;

  const stockBadgeColor = isOutOfStock
    ? "#ef4444"
    : isLowStock
      ? "#f59e0b"
      : "#10b981";

  const stockBadgeBg = isOutOfStock
    ? "rgba(239, 68, 68, 0.12)"
    : isLowStock
      ? "rgba(245, 158, 11, 0.12)"
      : "rgba(16, 185, 129, 0.12)";

  return (
    <Pressable
      onPress={onPress}
      disabled={isOutOfStock}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? "#262930" : "#edf0f5",
          opacity: isOutOfStock ? 0.6 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed && !isOutOfStock ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Top Meta Row: Category Tag + Stock Badge */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.categoryPill,
            { backgroundColor: isDark ? "#212633" : "#eff6ff" },
          ]}
        >
          <Text
            style={[styles.categoryText, { color: "#3b82f6" }]}
            numberOfLines={1}
          >
            {product.category?.name ?? "General"}
          </Text>
        </View>

        <View style={[styles.stockPill, { backgroundColor: stockBadgeBg }]}>
          <View
            style={[styles.stockDot, { backgroundColor: stockBadgeColor }]}
          />
          <Text style={[styles.stockText, { color: stockBadgeColor }]}>
            {isOutOfStock ? "Out" : `${stock}`}
          </Text>
        </View>
      </View>

      {/* Main Title & Description */}
      <View style={styles.contentSection}>
        <Text
          style={[styles.productName, { color: colors.text }]}
          numberOfLines={2}
        >
          {product.name}
        </Text>
        {product.description ? (
          <Text
            style={[styles.productDesc, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {product.description}
          </Text>
        ) : null}
      </View>

      {/* Bottom Price + Quick Add Button */}
      <View style={styles.bottomRow}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceCurrency, { color: colors.textSecondary }]}>
            ₦
          </Text>
          <Text style={[styles.priceAmount, { color: colors.text }]}>
            {product.price.toLocaleString()}
          </Text>
        </View>

        <View
          style={[
            styles.addButton,
            {
              backgroundColor: isOutOfStock
                ? colors.backgroundElement
                : "#3b82f6",
            },
          ]}
        >
          <Lucide
            name="plus"
            size={16}
            color={isOutOfStock ? colors.textSecondary : "#ffffff"}
          />
        </View>
      </View>
    </Pressable>
  );
};

export default Card;

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    maxWidth: "50%",
    borderRadius: 16,
    padding: 12,
    margin: 5,
    borderWidth: 1,
    justifyContent: "space-between",
    minHeight: 145,
    // Subtle elevation/shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 4,
  },
  categoryPill: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: "65%",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
  },
  stockPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 11,
    fontWeight: "700",
  },
  contentSection: {
    flex: 1,
    justifyContent: "center",
    marginVertical: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  productDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  priceCurrency: {
    fontSize: 12,
    fontWeight: "600",
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
