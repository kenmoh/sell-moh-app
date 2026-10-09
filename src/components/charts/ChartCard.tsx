import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export interface ChartCardProps {
  title: string;
  rangeDays: number;
  onRangeChange: (days: number) => void;
  /** Slot for an extra control above the chart, e.g. a metric toggle. */
  right?: ReactNode;
  caption?: ReactNode;
  children: ReactNode;
}

const RANGES = [7, 30, 90];

/** One chart on the product screen: title, range chips, and the chart body. */
export default function ChartCard({
  title,
  rangeDays,
  onRangeChange,
  right,
  caption,
  children,
}: ChartCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.backgroundElement,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          {title}
        </Text>
        <View style={styles.ranges}>
          {RANGES.map((days) => {
            const selected = days === rangeDays;
            return (
              <Pressable
                key={days}
                onPress={() => onRangeChange(days)}
                style={[
                  styles.rangeChip,
                  {
                    borderColor: selected
                      ? colors.buttonPrimary
                      : colors.backgroundElement,
                    backgroundColor: selected
                      ? colors.buttonPrimary
                      : colors.backgroundElement,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rangeText,
                    { color: selected ? "#fff" : colors.textSecondary },
                  ]}
                >
                  {days}d
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
      {children}
      {caption ? <View style={styles.caption}>{caption}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  ranges: {
    flexDirection: "row",
    gap: 6,
  },
  rangeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  right: {
    alignItems: "flex-start",
  },
  caption: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
