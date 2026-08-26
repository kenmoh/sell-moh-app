import AppBottomSheet from "@/components/bottom-sheet";
import { Colors } from "@/constants/theme";
import useCartStore from "@/hooks/use-cart-store";
import {
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

  const carts = useCartStore((s) => s.carts);
  const activeCartId = useCartStore((s) => s.activeCartId);
  const setActiveCart = useCartStore((s) => s.setActiveCart);
  const createCart = useCartStore((s) => s.createCart);
  const deleteCart = useCartStore((s) => s.deleteCart);

  const handleSelect = (cartId: string) => {
    setActiveCart(cartId);
    onVisibleChange(false);
    onCartSelected(cartId);
  };

  const handleCreate = () => {
    const newId = createCart();
    onVisibleChange(false);
    onCartSelected(newId);
  };

  const getCartTotal = (cart: {
    items: { product: { price: number }; quantity: number }[];
  }) => cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const getCartCount = (cart: { items: { quantity: number }[] }) =>
    cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AppBottomSheet visible={visible} onVisibleChange={onVisibleChange}>
      <Text style={[styles.title, { color: colors.text }]}>Your Carts</Text>

      {carts.map((cart) => {
        const isActive = cart.id === activeCartId;
        const count = getCartCount(cart);
        const total = getCartTotal(cart);
        return (
          <Pressable
            key={cart.id}
            onPress={() => handleSelect(cart.id)}
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
            <Text style={[styles.cartName, { color: colors.text }]}>
              {cart.name}
            </Text>
            <View style={styles.cartMeta}>
              <Text
                style={[styles.cartCount, { color: colors.textSecondary }]}
              >
                {count} {count === 1 ? "item" : "items"}
              </Text>
              <Text style={[styles.cartTotal, { color: colors.text }]}>
                NGN {total.toLocaleString()}
              </Text>
            </View>
            {carts.length > 1 && (
              <Pressable
                hitSlop={8}
                onPress={() => deleteCart(cart.id)}
                style={styles.deleteButton}
              >
                <Text style={[styles.deleteButtonText, { color: "#cf222e" }]}>
                  ✕
                </Text>
              </Pressable>
            )}
          </Pressable>
        );
      })}

      <View
        style={[
          styles.createButton,
          { backgroundColor: colors.backgroundElement },
        ]}
      >
        <Text
          style={[styles.createButtonText, { color: colors.text }]}
          onPress={handleCreate}
        >
          + Create New Cart
        </Text>
      </View>
    </AppBottomSheet>
  );
};

export default CartPickerSheet;

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700" },
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
  cartMeta: { alignItems: "flex-end", gap: 2 },
  cartCount: { fontSize: 12 },
  cartTotal: { fontSize: 13, fontWeight: "700" },
  deleteButton: { padding: 4 },
  deleteButtonText: { fontSize: 16 },
  createButton: {
    borderRadius: 100,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  createButtonText: { fontSize: 14, fontWeight: "600" },
});
