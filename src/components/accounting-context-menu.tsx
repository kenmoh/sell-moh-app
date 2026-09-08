import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  LayoutRectangle,
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
  withSpring,
  withTiming,
} from "react-native-reanimated";

type MenuItem = {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
};

type Props = {
  items: MenuItem[];
};

const MENU_WIDTH = 220;
const MENU_ITEM_HEIGHT = 44;
const TRIGGER_SIZE = 32;

const AccountingContextMenu = ({ items }: Props) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const triggerRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [menuLayout, setMenuLayout] = useState<LayoutRectangle | null>(null);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const menuY = useSharedValue(0);

  const openMenu = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      const screenH = Dimensions.get("window").height;
      const menuH = items.length * MENU_ITEM_HEIGHT + 16;
      const spaceBelow = screenH - y - h;
      const flipUp = spaceBelow < menuH + 20;

      setMenuLayout({ x, y: y + h + 4, width: 0, height: 0 });
      menuY.value = flipUp ? -(menuH + h + 8) : 0;
      setVisible(true);
    });
  }, [items.length, menuY]);

  const closeMenu = useCallback(() => {
    opacity.value = withTiming(0, {
      duration: 150,
      easing: Easing.bezier(0.4, 0, 1, 1),
    });
    scale.value = withSpring(0.8, { damping: 20, stiffness: 300 });
    setTimeout(() => setVisible(false), 150);
  }, [opacity, scale, menuY]);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.bezier(0, 0, 0.2, 1),
      });
      scale.value = withSpring(1, { damping: 18, stiffness: 280 });
    }
  }, [visible, opacity, scale]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: visible ? "auto" : "none",
  }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: menuY.value }],
  }));

  const handleItemPress = useCallback(
    (onPress: () => void) => {
      closeMenu();
      setTimeout(() => onPress(), 100);
    },
    [closeMenu],
  );

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={visible ? closeMenu : openMenu}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.backgroundElement,
          },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Lucide
          name="ellipsis-vertical"
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>

      {visible && menuLayout && (
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
        </Animated.View>
      )}

      {visible && menuLayout && (
        <Animated.View
          style={[
            styles.menu,
            {
              top: menuLayout.y,
              right: 16,
              backgroundColor: colors.card,
              shadowColor: isDark ? "#000" : "#000",
              borderColor: isDark ? "#2d3038" : "#e5e7eb",
            },
            menuStyle,
          ]}
        >
          {items.map((item, index) => (
            <Pressable
              key={item.key}
              style={[
                styles.menuItem,
                index < items.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: isDark ? "#2d3038" : "#e5e7eb",
                },
              ]}
              onPress={() => handleItemPress(item.onPress)}
            >
              <View style={styles.menuItemContent}>
                <View
                  style={[
                    styles.menuItemIcon,
                    { backgroundColor: colors.backgroundElement },
                  ]}
                >
                  <Lucide
                    name={item.icon as any}
                    size={16}
                    color={colors.text}
                  />
                </View>
                <Text style={[styles.menuItemLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
              </View>
              <Lucide
                name="chevron-right"
                size={14}
                color={colors.textSecondary}
              />
            </Pressable>
          ))}
        </Animated.View>
      )}
    </>
  );
};

export default AccountingContextMenu;

const styles = StyleSheet.create({
  trigger: {
    width: TRIGGER_SIZE,
    height: TRIGGER_SIZE,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 99,
  },
  menu: {
    position: "absolute",
    width: MENU_WIDTH,
    borderRadius: 14,
    padding: 6,
    zIndex: 100,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: MENU_ITEM_HEIGHT,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
});
