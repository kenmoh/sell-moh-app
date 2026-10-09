import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedToggleProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Two (or more) pill choices in a row, for picking what a chart shows. */
export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.pill,
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
                styles.text,
                { color: selected ? "#fff" : colors.textSecondary },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
