import { useEffect } from "react";
import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Colors } from "@/constants/theme";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export interface PillButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Tighter padding for the range chips in a card header. */
  compact?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** One pill choice: the selection slides its colors over, the press squishes it. */
export default function PillButton({
  label,
  selected,
  onPress,
  compact,
}: PillButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const reduce = useReducedMotion();

  const pressed = useSharedValue(0);
  const picked = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    picked.value = withTiming(selected ? 1 : 0, {
      duration: 180,
      easing: EASE_OUT,
    });
  }, [selected, picked]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      picked.value,
      [0, 1],
      [colors.backgroundElement, colors.buttonPrimary],
    ),
  }));

  const pressStyle = useAnimatedStyle(() => {
    if (reduce) {
      return { opacity: 1 - pressed.value * 0.4 };
    }
    return {
      opacity: 1 - pressed.value * 0.15,
      transform: [{ scale: 1 - pressed.value * 0.03 }],
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      picked.value,
      [0, 1],
      [colors.textSecondary, "#ffffff"],
    ),
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 100 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 160, easing: EASE_OUT });
      }}
      style={[
        styles.pill,
        compact && styles.compact,
        containerStyle,
        pressStyle,
      ]}
    >
      <Animated.Text style={[styles.text, textStyle]}>{label}</Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  compact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
