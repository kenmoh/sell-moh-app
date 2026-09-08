import { Colors } from "@/constants/theme";
import { getNotificationTypeConfig, type InAppNotification } from "@/types/notifications";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  notification: InAppNotification | null;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const yr = d.getFullYear();
  return `${day}/${mon}/${yr}`;
}

export default function NotificationDetailCard({
  visible,
  notification,
  onClose,
  onMarkRead,
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.85);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 200,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (notification && !notification.is_read) {
        onMarkRead(notification.id);
      }
    } else {
      scale.setValue(0.85);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!notification) return null;

  const config = getNotificationTypeConfig(notification.type);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              opacity,
              transform: [{ scale }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: config.bg }]}>
              <Lucide name={config.icon as any} size={22} color={config.color} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.type, { color: config.color }]}>
                {config.label}
              </Text>
              <Text style={[styles.time, { color: colors.textSecondary }]}>
                {formatTime(notification.created_at)}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Lucide name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {notification.title}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {notification.body}
          </Text>

          <Pressable style={[styles.closeButton, { backgroundColor: colors.backgroundElement }]} onPress={onClose}>
            <Text style={[styles.closeText, { color: colors.text }]}>Close</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  type: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  closeText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
