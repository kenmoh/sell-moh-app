import { listCarts } from "@/api/cart";
import AppView from "@/components/app-view";
import { Colors } from "@/constants/theme";
import { CartListItem } from "@/types/cart";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const OpenCarts = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const {
    data: carts,
    isPending,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["carts"],
    queryFn: listCarts,
  });

  const formatTime = (iso: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const renderCart = ({ item }: { item: CartListItem }) => (
    <Pressable
      onPress={() => router.push(`/(tabs)/(more)/open-carts/${item.id}`)}
      style={[
        styles.cartCard,
        { backgroundColor: colors.card, borderColor: colors.backgroundElement },
      ]}
    >
      <View style={styles.cartLeft}>
        <View style={[styles.cartIcon, { backgroundColor: colors.buttonPrimary + "20" }]}>
          <Lucide name="shopping-cart" size={20} color={colors.buttonPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cartName, { color: colors.text }]}>
            {item.session_id?.toUpperCase() || "Cart"}
          </Text>
          {item.customer_name && (
            <Text style={[styles.cartCustomer, { color: colors.textSecondary }]}>
              {item.customer_name}
            </Text>
          )}
          <Text style={[styles.cartTime, { color: colors.textSecondary }]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>

      <View style={styles.cartRight}>
        <Text style={[styles.cartTotal, { color: colors.text }]}>
          ₦{item.total.toLocaleString()}
        </Text>
        <Text style={[styles.cartCount, { color: colors.textSecondary }]}>
          {item.item_count} {item.item_count === 1 ? "item" : "items"}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <AppView>
      {isPending ? (
        <ActivityIndicator
          color={colors.buttonPrimary}
          style={{ paddingVertical: 48 }}
        />
      ) : !carts || carts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Lucide name="shopping-cart" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No open carts
          </Text>
        </View>
      ) : (
        <FlatList
          data={carts}
          keyExtractor={(item) => item.id}
          renderItem={renderCart}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onRefresh={() => refetch()}
          refreshing={isRefetching}
        />
      )}
    </AppView>
  );
};

export default OpenCarts;

const styles = StyleSheet.create({
  cartCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  cartLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  cartIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cartName: { fontSize: 15, fontWeight: "600" },
  cartCustomer: { fontSize: 12, marginTop: 2 },
  cartTime: { fontSize: 11, marginTop: 2 },
  cartRight: { alignItems: "flex-end", gap: 2 },
  cartTotal: { fontSize: 15, fontWeight: "700" },
  cartCount: { fontSize: 12 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: { fontSize: 15 },
});
