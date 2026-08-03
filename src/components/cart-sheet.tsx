import { AppBottomSheet } from "@/components/bottom-sheet";
import useCartStore from "@/hooks/use-cart-store";
import { Colors } from "@/constants/theme";
import { Host } from "@expo/ui";
import { ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";

interface CartSheetProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}

const CartSheet = ({ visible, onVisibleChange }: CartSheetProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const carts = useCartStore((s) => s.carts);
  const activeCartId = useCartStore((s) => s.activeCartId);
  const updateQuantityInCart = useCartStore((s) => s.updateQuantityInCart);
  const removeItemFromCart = useCartStore((s) => s.removeItemFromCart);
  const clearCartById = useCartStore((s) => s.clearCartById);

  const activeCart = carts.find((c) => c.id === activeCartId);
  const items = activeCart?.items ?? [];
  const cartName = activeCart?.name ?? "Cart";

  const totalPrice = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );

  return (
    <Host style={{ flex: 1 }}>
      <AppBottomSheet visible={visible} onVisibleChange={onVisibleChange}>
        <Text style={[styles.title, { color: colors.text }]}>{cartName}</Text>

        {items.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Cart is empty
          </Text>
        ) : (
          <>
            <ScrollView
              style={styles.scrollArea}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {items.map((item, i) => (
                <View
                  key={item.product.id}
                  style={[
                    styles.itemRow,
                    i < items.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.backgroundElement,
                    },
                  ]}
                >
                  <View style={styles.itemInfo}>
                    <Text
                      style={[styles.itemName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.product.name}
                    </Text>
                    <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
                      NGN {item.product.price.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.quantityControl}>
                    <View
                      style={[styles.qtyButton, { backgroundColor: colors.backgroundElement }]}
                    >
                      <Text
                        style={[styles.qtyButtonText, { color: colors.text }]}
                        onPress={() =>
                          updateQuantityInCart(
                            activeCartId,
                            item.product.id,
                            item.quantity - 1,
                          )
                        }
                      >
                        −
                      </Text>
                    </View>
                    <Text style={[styles.qtyValue, { color: colors.text }]}>
                      {item.quantity}
                    </Text>
                    <View
                      style={[styles.qtyButton, { backgroundColor: colors.backgroundElement }]}
                    >
                      <Text
                        style={[styles.qtyButtonText, { color: colors.text }]}
                        onPress={() =>
                          updateQuantityInCart(
                            activeCartId,
                            item.product.id,
                            item.quantity + 1,
                          )
                        }
                      >
                        +
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.lineTotal, { color: colors.text }]}>
                    NGN {(item.product.price * item.quantity).toLocaleString()}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View
              style={[styles.totalRow, { borderTopColor: colors.backgroundElement }]}
            >
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                NGN {totalPrice.toLocaleString()}
              </Text>
            </View>

            <View style={styles.actions}>
              <View style={[styles.clearButton, { backgroundColor: colors.backgroundElement }]}>
                <Text
                  style={[styles.clearButtonText, { color: colors.text }]}
                  onPress={() => {
                    clearCartById(activeCartId);
                    onVisibleChange(false);
                  }}
                >
                  Clear Cart
                </Text>
              </View>
              <View style={styles.checkoutButton}>
                <Text
                  style={styles.checkoutButtonText}
                  onPress={() => {
                    onVisibleChange(false);
                  }}
                >
                  Checkout
                </Text>
              </View>
            </View>
          </>
        )}
      </AppBottomSheet>
    </Host>
  );
};

export default CartSheet;

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700" },
  empty: { fontSize: 15, textAlign: "center", paddingVertical: 20 },
  scrollArea: { overflow: "hidden" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: "600" },
  itemPrice: { fontSize: 12 },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: { fontSize: 16, fontWeight: "600" },
  qtyValue: {
    fontSize: 14,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  lineTotal: { fontSize: 13, fontWeight: "700", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalValue: { fontSize: 18, fontWeight: "800" },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  clearButton: {
    flex: 1,
    borderRadius: 100,
    paddingVertical: 12,
    alignItems: "center",
  },
  clearButtonText: { fontSize: 14, fontWeight: "600" },
  checkoutButton: {
    flex: 1,
    borderRadius: 100,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#2f7df6",
  },
  checkoutButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
