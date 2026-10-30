import { useTheme } from "@/hooks/use-theme";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonIcon = ReactNode | ((color: string) => ReactNode);

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingTitle?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: ButtonIcon;
  rightIcon?: ButtonIcon;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

function renderIcon(icon: ButtonIcon | undefined, color: string) {
  return typeof icon === "function" ? icon(color) : icon;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  loadingTitle,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const colors = useTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: {
      backgroundColor: colors.buttonPrimary,
      borderColor: colors.buttonPrimary,
      color: "#ffffff",
    },
    secondary: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.backgroundElement,
      color: colors.text,
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: colors.backgroundSelected,
      color: colors.text,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      color: colors.buttonPrimary,
    },
    danger: {
      backgroundColor: "#ef4444",
      borderColor: "#ef4444",
      color: "#ffffff",
    },
  }[variant];

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      android_ripple={{ color: "rgba(255,255,255,0.16)" }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizes[size],
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={palette.color} size="small" />
      ) : (
        renderIcon(leftIcon, palette.color)
      )}
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          textSizes[size],
          { color: palette.color },
          textStyle,
        ]}
      >
        {loading && loadingTitle ? loadingTitle : title}
      </Text>
      {!loading && renderIcon(rightIcon, palette.color)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.82,
  },
  text: {
    flexShrink: 1,
    fontWeight: "700",
    textAlign: "center",
  },
});

const sizes = StyleSheet.create({
  sm: {
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
  },
  md: {
    gap: 8,
    minHeight: 50,
  },
  lg: {
    gap: 8,
    minHeight: 56,
    paddingHorizontal: 22,
  },
});

const textSizes = StyleSheet.create({
  sm: {
    fontSize: 13,
  },
  md: {
    fontSize: 15,
  },
  lg: {
    fontSize: 16,
  },
});
