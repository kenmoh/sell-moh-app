import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import React, { useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface Account {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  account_type: string;
  status: string;
}

interface AccountTooltipProps {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
  onEdit: (account: Account) => void;
}

const TYPE_COLORS: Record<string, string> = {
  asset: "#10b981",
  liability: "#ef4444",
  equity: "#8b5cf6",
  revenue: "#3b82f6",
  expense: "#f59e0b",
};

const AccountTooltip = ({ visible, account, onClose, onEdit }: AccountTooltipProps) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 18, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      scale.value = withTiming(0.92, { duration: 140 });
      opacity.value = withTiming(0, { duration: 140 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!account) return null;

  const typeColor = TYPE_COLORS[account.account_type.toLowerCase()] ?? "#6b7280";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#1c1c1e" : "#fff",
              borderColor: isDark ? "#2c2c2e" : "#e5e7eb",
            },
            animatedStyle,
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header row: dot + code + type badge */}
          <View style={styles.headerRow}>
            <View style={[styles.dot, { backgroundColor: typeColor }]} />
            <Text style={[styles.code, { color: colors.text }]}>{account.code}</Text>
            <View style={[styles.typeBadge, { backgroundColor: `${typeColor}18` }]}>
              <Text style={[styles.typeText, { color: typeColor }]}>
                {account.account_type}
              </Text>
            </View>
          </View>

          {/* Full name */}
          <Text style={[styles.name, { color: colors.text }]}>{account.name}</Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: isDark ? "#2c2c2e" : "#f0f0f3" }]} />

          {/* Status row */}
          <View style={styles.statusRow}>
            <Lucide
              name={account.status === "active" ? "check-circle-2" : "x-circle"}
              size={14}
              color={account.status === "active" ? "#10b981" : "#ef4444"}
            />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {account.status}
            </Text>
            <Pressable
              onPress={() => {
                onClose();
                onEdit(account);
              }}
              style={styles.editBtn}
            >
              <Lucide name="pencil" size={14} color={colors.buttonPrimary} />
              <Text style={[styles.editText, { color: colors.buttonPrimary }]}>
                Edit
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default React.memo(AccountTooltip);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 300,
    borderRadius: 18,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  code: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  typeBadge: {
    marginLeft: "auto",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  editText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
