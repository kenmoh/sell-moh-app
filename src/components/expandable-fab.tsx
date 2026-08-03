import CartPickerSheet from "@/components/cart-picker-sheet";
import CartSheet from "@/components/cart-sheet";
import { Colors } from "@/constants/theme";
import useCartStore from "@/hooks/use-cart-store";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;
const FAB_SIZE = 56;
const MARGIN = 16;
const SUB_FAB_SIZE = 48;

const ExpandableFAB = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const [expanded, setExpanded] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [cartSheetVisible, setCartSheetVisible] = useState(false);

  const totalItems = useCartStore((s) => s.totalItems());
  const carts = useCartStore((s) => s.carts);

  const rotation = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const subFab1Y = useSharedValue(0);
  const subFab1Opacity = useSharedValue(0);
  const subFab2Y = useSharedValue(0);
  const subFab2Opacity = useSharedValue(0);

  const toggle = () => {
    const to = expanded ? 0 : 1;
    expanded ? setExpanded(false) : setExpanded(true);

    rotation.value = withTiming(to * 45, {
      duration: 250,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    overlayOpacity.value = withTiming(to, {
      duration: 200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    subFab1Y.value = withSpring(to ? -72 : 0, {
      damping: 20,
      stiffness: 150,
    });
    subFab1Opacity.value = withDelay(
      50,
      withTiming(to, {
        duration: 200,
      }),
    );
    subFab2Y.value = withSpring(to ? -136 : 0, {
      damping: 20,
      stiffness: 150,
    });
    subFab2Opacity.value = withDelay(
      100,
      withTiming(to, {
        duration: 200,
      }),
    );
  };

  const mainStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: expanded ? "auto" : "none",
  }));

  const subFab1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: subFab1Y.value }],
    opacity: subFab1Opacity.value,
  }));

  const subFab2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: subFab2Y.value }],
    opacity: subFab2Opacity.value,
  }));

  const handleCreateCart = () => {
    toggle();
    useCartStore.getState().createCart();
  };

  const handleViewCarts = () => {
    toggle();
    setPickerVisible(true);
  };

  return (
    <>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={toggle} />
      </Animated.View>

      <View style={styles.container}>
        <Animated.View style={[styles.subFab, subFab2Style]}>
          <Pressable
            onPress={handleViewCarts}
            style={[
              styles.subFabButton,
              { backgroundColor: colors.card, shadowColor: colors.text },
            ]}
          >
            <Lucide name="list" size={20} color={colors.text} />
          </Pressable>
          <View style={[styles.label, { backgroundColor: colors.card }]}>
            <Text style={[styles.labelText, { color: colors.text }]}>
              {carts.length === 1
                ? "Cart"
                : `Carts (${carts.length})`}
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.subFab, subFab1Style]}>
          <Pressable
            onPress={handleCreateCart}
            style={[
              styles.subFabButton,
              { backgroundColor: colors.card, shadowColor: colors.text },
            ]}
          >
            <Lucide name="plus" size={20} color={colors.text} />
          </Pressable>
          <View style={[styles.label, { backgroundColor: colors.card }]}>
            <Text style={[styles.labelText, { color: colors.text }]}>
              New Cart
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={mainStyle}>
          <Pressable
            onPress={toggle}
            style={[
              styles.mainFab,
              {
                backgroundColor: colors.text,
                shadowColor: colors.text,
              },
            ]}
          >
            <Lucide name="plus" size={26} color={colors.background} />
          </Pressable>
        </Animated.View>
      </View>

      <CartPickerSheet
        visible={pickerVisible}
        onVisibleChange={setPickerVisible}
        onCartSelected={(cartId) => {
          useCartStore.getState().setActiveCart(cartId);
          setCartSheetVisible(true);
        }}
      />
      <CartSheet
        visible={cartSheetVisible}
        onVisibleChange={setCartSheetVisible}
      />
    </>
  );
};

export default ExpandableFAB;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 50,
  },
  container: {
    position: "absolute",
    bottom: 30,
    right: MARGIN,
    zIndex: 100,
    alignItems: "flex-end",
  },
  mainFab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  subFab: {
    position: "absolute",
    bottom: 0,
    right: 0,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  subFabButton: {
    width: SUB_FAB_SIZE,
    height: SUB_FAB_SIZE,
    borderRadius: SUB_FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  labelText: { fontSize: 12, fontWeight: "600" },
});
