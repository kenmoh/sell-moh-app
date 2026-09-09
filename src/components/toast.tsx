import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, useColorScheme } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { PanGestureHandler } from "react-native-gesture-handler";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Colors, ColorPalette } from "@/constants/theme";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastAction {
  label: string;
  onPress: () => void;
  variant?: "ghost" | "solid";
}

interface ToastProps {
  id: string;
  title: string;
  message?: string;
  type?: ToastType;
  timeout?: number;
  actions?: ToastAction[];
  index: number;
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, string> = {
  success: "check-circle-2",
  error: "x-circle",
  info: "info",
  warning: "alert-triangle",
};

const BG_COLORS: Record<ToastType, { light: string; dark: string }> = {
  success: { light: "rgba(16, 185, 129, 0.12)", dark: "rgba(16, 185, 129, 0.18)" },
  error: { light: "rgba(239, 68, 68, 0.12)", dark: "rgba(239, 68, 68, 0.18)" },
  info: { light: "rgba(59, 130, 246, 0.12)", dark: "rgba(59, 130, 246, 0.18)" },
  warning: { light: "rgba(245, 158, 11, 0.12)", dark: "rgba(245, 158, 11, 0.18)" },
};

const TEXT_COLORS: Record<ToastType, string> = {
  success: "#10b981",
  error: "#ef4444",
  info: "#3b82f6",
  warning: "#f59e0b",
};

const ToastItem = ({
  id,
  title,
  message,
  type = "info",
  timeout,
  actions,
  index,
  onDismiss,
}: ToastProps) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const swipeX = useSharedValue(0);
  const isDismissing = useSharedValue(false);

  const bgColor = isDark ? BG_COLORS[type].dark : BG_COLORS[type].light;
  const textColor = TEXT_COLORS[type];

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    opacity.value = withSpring(1, { damping: 20, stiffness: 200 });
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
  }, []);

  if (timeout && timeout > 0) {
    useEffect(() => {
      const timer = setTimeout(() => {
        dismiss();
      }, timeout);
      return () => clearTimeout(timer);
    }, [timeout]);
  }

  const dismiss = () => {
    if (isDismissing.value) return;
    isDismissing.value = true;
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-100, { duration: 250 });
    scale.value = withTiming(0.95, { duration: 200 });
    setTimeout(() => runOnJS(onDismiss)(id), 250);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationX > 0) {
        swipeX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (e.translationX > 80 || e.velocityX > 500) {
        dismiss();
      } else {
        swipeX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: swipeX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const offsetY = index * 8;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, { marginTop: offsetY }, animatedStyle]}>
        <View
          style={[
            styles.toastCard,
            { backgroundColor: colors.card, borderColor: colors.backgroundElement },
          ]}
        >
          <View style={styles.contentRow}>
            <View style={[styles.iconWrapper, { backgroundColor: bgColor }]}>
              <Lucide name={ICONS[type] as any} size={18} color={textColor} />
            </View>
            <View style={styles.textColumn}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              {message && (
                <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
              )}
            </View>
            <Pressable
              onPress={dismiss}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Lucide name="x" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          {actions && actions.length > 0 && (
            <View style={styles.actionsRow}>
              {actions.slice(0, 2).map((action, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    action.onPress();
                    if (action.variant !== "solid") dismiss();
                  }}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor:
                        action.variant === "solid" ? colors.buttonPrimary : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.actionText,
                      {
                        color:
                          action.variant === "solid"
                            ? "#fff"
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
  },
  toastCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 10,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 2,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default React.memo(ToastItem);