import { Colors } from "@/constants/theme";
import { Lucide, LucideIconName } from "@react-native-vector-icons/lucide";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export interface PillProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: LucideIconName;
  badge?: number;
  color?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

const AnimatedPressable = ({
  children,
  onPress,
  style,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  disabled?: boolean;
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.93, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        onPress={onPress}
        disabled={disabled}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

const Pill = ({
  label,
  active = false,
  onPress,
  icon,
  badge,
  color,
  size = "md",
  disabled = false,
}: PillProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const activeColor = color ?? colors.buttonPrimary;

  const isSmall = size === "sm";

  return (
    <AnimatedPressable onPress={onPress} disabled={disabled}>
      <View
        style={[
          styles.pill,
          isSmall && styles.pillSm,
          {
            backgroundColor: active ? "transparent" : colors.backgroundElement,
            borderColor: active ? activeColor : "transparent",
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {icon && (
          <Lucide
            name={icon}
            size={isSmall ? 12 : 14}
            color={active ? activeColor : colors.textSecondary}
          />
        )}
        <Text
          style={[
            styles.label,
            isSmall && styles.labelSm,
            {
              color: active ? activeColor : colors.textSecondary,
              fontWeight: active ? "700" : "500",
            },
          ]}
        >
          {label}
        </Text>
        {typeof badge === "number" && (
          <View
            style={[
              styles.badge,
              isSmall && styles.badgeSm,
              {
                backgroundColor: active
                  ? `${activeColor}20`
                  : colors.backgroundSelected,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isSmall && styles.badgeTextSm,
                {
                  color: active ? activeColor : colors.textSecondary,
                },
              ]}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
};

export default Pill;

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  pillSm: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  label: {
    fontSize: 13,
  },
  labelSm: {
    fontSize: 12,
  },
  badge: {
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 2,
  },
  badgeSm: {
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  badgeTextSm: {
    fontSize: 10,
  },
});
