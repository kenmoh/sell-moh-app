import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

import PillButton from "./PillButton";

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
          {RANGES.map((days) => (
            <PillButton
              key={days}
              compact
              label={`${days}d`}
              selected={days === rangeDays}
              onPress={() => onRangeChange(days)}
            />
          ))}
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
  right: {
    alignItems: "flex-start",
  },
  caption: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
