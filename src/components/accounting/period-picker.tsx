import Pill from "@/components/pill";
import { View, StyleSheet } from "react-native";

type Period = "week" | "month" | "quarter" | "year";

type Props = {
  value: Period;
  onChange: (period: Period) => void;
};

const periods: { key: Period; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "quarter", label: "Quarter" },
  { key: "year", label: "Year" },
];

const PeriodPicker = ({ value, onChange }: Props) => {
  return (
    <View style={styles.container}>
      {periods.map((period) => (
        <Pill
          key={period.key}
          label={period.label}
          active={value === period.key}
          onPress={() => onChange(period.key)}
        />
      ))}
    </View>
  );
};

export default PeriodPicker;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
  },
});
