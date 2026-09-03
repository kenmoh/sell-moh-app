import { listCarts } from "@/api/cart";
import AppBottomSheet from "@/components/bottom-sheet";
import { Colors } from "@/constants/theme";
import useCartStore from "@/hooks/use-cart-store";
import { CartListItem } from "@/types/cart";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

interface CartPickerSheetProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onCartSelected: (cartId: string) => void;
}

const CartPickerSheet = ({
  visible,
  onVisibleChange,
  onCartSelected,
}: CartPickerSheetProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const activeCartId = useCartStore((s) => s.activeCartId);
  const setActiveCart = useCartStore((s) => s.setActiveCart);

  const { data: apiCarts, isPending } = useQuery({
    queryKey: ["carts"],
    queryFn: listCarts,
    enabled: visible,
  });

  const carts = apiCarts ?? [];

  const handleSelect = (cart: CartListItem) => {
    setActiveCart(cart.id);
    onVisibleChange(false);
    onCartSelected(cart.id);
  };

  const formatTime = (iso: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <AppBottomSheet visible={visible} onVisibleChange={onVisibleChange}>
      <Text style={[styles.title, { color: colors.text }]}>Your Carts</Text>

      {isPending ? (
        <ActivityIndicator color={colors.buttonPrimary} style={{ paddingVertical: 24 }} />
      ) : carts.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No active carts
        </Text>
      ) : (
        carts.map((cart) => {
          const isActive = cart.id === activeCartId;
          return (
            <Pressable
              key={cart.id}
              onPress={() => handleSelect(cart)}
              style={[
                styles.cartRow,
                {
                  backgroundColor: isActive
                    ? colors.backgroundElement
                    : "transparent",
                  borderColor: isActive
                    ? colors.textSecondary
                    : colors.backgroundElement,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.cartName, { color: colors.text }]}>
                  {cart.session_id || "Untitled Cart"}
                </Text>
                {cart.customer_name && (
                  <Text style={[styles.cartPhone, { color: colors.textSecondary }]}>
                    {cart.customer_name}
                  </Text>
                )}
                {cart.customer_phone && (
                  <Text style={[styles.cartPhone, { color: colors.textSecondary }]}>
                    {cart.customer_phone}
                  </Text>
                )}
              </View>
              <View style={styles.cartMeta}>
                <Text style={[styles.cartCount, { color: colors.textSecondary }]}>
                  {cart.item_count} {cart.item_count === 1 ? "item" : "items"}
                </Text>
                <Text style={[styles.cartTotal, { color: colors.text }]}>
                  ₦{cart.total.toLocaleString()}
                </Text>
                {cart.created_at && (
                  <Text style={[styles.cartTime, { color: colors.textSecondary }]}>
                    {formatTime(cart.created_at)}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })
      )}
    </AppBottomSheet>
  );
};

export default CartPickerSheet;

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", paddingVertical: 24 },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
  },
  cartName: { fontSize: 15, fontWeight: "600" },
  cartPhone: { fontSize: 12, marginTop: 2 },
  cartMeta: { alignItems: "flex-end", gap: 2 },
  cartCount: { fontSize: 12 },
  cartTotal: { fontSize: 13, fontWeight: "700" },
  cartTime: { fontSize: 11 },
});
