import { useEffect, useState } from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Colors } from "@/constants/theme";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const WIDTH = 150;
const GAP = 8;

export interface ChartTooltipProps {
  visible: boolean;
  /** Chart-pixel x of the point the tooltip explains. */
  anchorX: number;
  /** Chart-pixel y of the point the tooltip explains; the box sits above it. */
  anchorY: number;
  chartWidth: number;
  title: string;
  lines: string[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * The pressed point's detail box. Always mounted so it can fade both ways;
 * it never takes touches, so pressing through it keeps working.
 */
export default function ChartTooltip({
  visible,
  anchorX,
  anchorY,
  chartWidth,
  title,
  lines,
}: ChartTooltipProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const reduce = useReducedMotion();

  const [height, setHeight] = useState(0);

  const shown = useSharedValue(0);
  const left = useSharedValue(0);
  const top = useSharedValue(0);

  const targetLeft = clamp(anchorX - WIDTH / 2, 0, chartWidth - WIDTH);
  const targetTop = Math.max(0, anchorY - (height || 64) - GAP);

  useEffect(() => {
    shown.value = withTiming(visible ? 1 : 0, {
      duration: visible ? 150 : 120,
      easing: EASE_OUT,
    });
  }, [visible, shown]);

  useEffect(() => {
    left.value = withTiming(targetLeft, { duration: 150, easing: EASE_OUT });
    top.value = withTiming(targetTop, { duration: 150, easing: EASE_OUT });
  }, [targetLeft, targetTop, left, top]);

  const boxStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [
      { translateX: left.value },
      { translateY: top.value },
      ...(reduce ? [] : [{ scale: 0.95 + 0.05 * shown.value }]),
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      style={[
        styles.box,
        {
          backgroundColor: colors.background,
          borderColor: colors.backgroundElement,
        },
        boxStyle,
      ]}
    >
      {title ? (
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
      {lines.map((line) => (
        <Text
          key={line}
          style={[styles.line, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {line}
        </Text>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: "absolute",
    left: 0,
    top: 0,
    width: WIDTH,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  title: { fontSize: 11, fontWeight: "700" },
  line: { fontSize: 12 },
});
