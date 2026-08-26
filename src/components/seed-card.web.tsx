import { View, Text, StyleSheet } from "react-native";

export function SeedCard() {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.title}>Card Title</Text>
        <Text style={styles.body}>Card content inherits seedColor</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  content: {
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  body: {
    fontSize: 14,
    opacity: 0.7,
  },
});
