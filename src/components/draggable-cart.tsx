import CartSheet from "@/components/cart-sheet";
import useCartStore from "@/hooks/use-cart-store";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Dimensions, Pressable, StyleSheet, Text, useColorScheme } from "react-native";
import { useState } from "react";

const SCREEN_WIDTH = Dimensions.get("window").width;
const FAB_SIZE = 56;
const MARGIN = 16;

const DraggableCart = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const [sheetVisible, setSheetVisible] = useState(false);

  const totalItems = useCartStore((s) => s.totalItems());
  const translateX = useSharedValue(SCREEN_WIDTH - FAB_SIZE - MARGIN);
  const translateY = useSharedValue(0);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = contextX.value + e.translationX;
      translateY.value = contextY.value + e.translationY;
    })
    .onEnd(() => {
      const screenCenter = SCREEN_WIDTH / 2;
      const snapX =
        translateX.value + FAB_SIZE / 2 < screenCenter
          ? MARGIN
          : SCREEN_WIDTH - FAB_SIZE - MARGIN;
      translateX.value = withSpring(snapX, { damping: 20, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  if (totalItems === 0) return null;

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.fab, animatedStyle]}>
          <Pressable
            onPress={() => setSheetVisible(true)}
            style={[
              styles.fabButton,
              { backgroundColor: colors.text, shadowColor: colors.text },
            ]}
          >
            <Lucide name="shopping-cart" size={24} color={colors.background} />
            <Text style={[styles.badge, { backgroundColor: "#2f7df6" }]}>
              {totalItems}
            </Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>
      <CartSheet visible={sheetVisible} onVisibleChange={setSheetVisible} />
    </>
  );
};

export default DraggableCart;

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 100,
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 100,
  },
  fabButton: {
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
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
});
