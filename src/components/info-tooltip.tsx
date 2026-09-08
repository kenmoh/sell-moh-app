import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Colors } from "@/constants/theme";

interface InfoTooltipProps {
  title: string;
  message: string;
}

export default function InfoTooltip({ title, message }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={styles.trigger}
      >
        <Lucide name="info" size={18} color={colors.textSecondary} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setVisible(false)}
        >
          <Pressable
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#1c1c1e" : "#fff",
                borderColor: isDark ? "#2c2c2e" : "#e5e7eb",
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: "rgba(59,130,246,0.12)" },
                ]}
              >
                <Lucide name="info" size={20} color="#3b82f6" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                {title}
              </Text>
              <Pressable
                onPress={() => setVisible(false)}
                style={styles.closeBtn}
              >
                <Lucide name="x" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
  },
});
