import { getCart } from "@/api/cart";
import AppView from "@/components/app-view";
import { Colors } from "@/constants/theme";
import { CartDetailResponse } from "@/types/cart";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const CartDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const {
    data: cart,
    isPending,
    error,
  } = useQuery({
    queryKey: ["cart", id],
    queryFn: () => getCart(id!),
    enabled: !!id,
  });

  if (isPending) {
    return (
      <AppView>
        <ActivityIndicator
          color={colors.buttonPrimary}
          style={{ paddingVertical: 48 }}
        />
      </AppView>
    );
  }

  if (error || !cart) {
    return (
      <AppView>
        <View style={styles.emptyContainer}>
          <Lucide name="alert-circle" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Cart not found
          </Text>
        </View>
      </AppView>
    );
  }

  const total = cart.items.reduce((sum, i) => sum + i.unit_price * i.qty, 0);

  const renderItem = ({ item }: { item: CartDetailResponse["items"][number] }) => (
    <View
      style={[
        styles.itemCard,
        { backgroundColor: colors.card, borderColor: colors.backgroundElement },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
          ₦{item.unit_price.toLocaleString()} × {Number(item.qty)}
        </Text>
      </View>
      <Text style={[styles.itemTotal, { color: colors.text }]}>
        ₦{(item.unit_price * item.qty).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <AppView>
      {/* Cart Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>
            Session
          </Text>
          <Text style={[styles.headerValue, { color: colors.text }]}>
            {cart.session_id?.toUpperCase() || "—"}
          </Text>
        </View>
        {cart.customer_name && (
          <View style={styles.headerRow}>
            <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>
              Customer
            </Text>
            <Text style={[styles.headerValue, { color: colors.text }]}>
              {cart.customer_name}
              {cart.customer_phone ? ` · ${cart.customer_phone}` : ""}
            </Text>
          </View>
        )}
        <View style={styles.headerRow}>
          <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>
            Status
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: "#10b98120" }]}>
            <Text style={[styles.statusText, { color: "#10b981" }]}>
              {cart.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Items */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        ITEMS ({cart.items.length})
      </Text>

      {cart.items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Lucide name="package-open" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No items in this cart
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />

          {/* Total */}
          <View style={[styles.totalRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              ₦{total.toLocaleString()}
            </Text>
          </View>
        </>
      )}
    </AppView>
  );
};

export default CartDetail;

const styles = StyleSheet.create({
  header: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLabel: { fontSize: 13 },
  headerValue: { fontSize: 13, fontWeight: "600" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  itemName: { fontSize: 14, fontWeight: "600" },
  itemPrice: { fontSize: 12, marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: "700" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: "600" },
  totalValue: { fontSize: 18, fontWeight: "700" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 48,
  },
  emptyText: { fontSize: 15 },
});
