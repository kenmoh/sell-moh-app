import { Colors } from "@/constants/theme";
import { Lucide, LucideIconName } from "@react-native-vector-icons/lucide";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  useColorScheme,
  View,
} from "react-native";

export interface AppTextInputProps extends RNTextInputProps {
  label?: string;
  leftIcon?: LucideIconName;
  rightIcon?: LucideIconName;
  onRightIconPress?: () => void;
  error?: string;
}

const AppTextInput = React.forwardRef<RNTextInput, AppTextInputProps>(
  (
    {
      label,
      leftIcon,
      rightIcon,
      onRightIconPress,
      placeholder,
      value,
      onChangeText,
      error,
      multiline,
      style,
      ...restProps
    },
    ref,
  ) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme === "dark" ? "dark" : "light"];

    return (
      <View style={styles.wrapper}>
        {label && (
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {label}
          </Text>
        )}
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: error ? "#dc2626" : "transparent",
            },
            multiline && styles.multilineContainer,
          ]}
        >
          {leftIcon && (
            <Lucide
              name={leftIcon}
              size={18}
              color={colors.textSecondary}
              style={styles.leftIcon}
            />
          )}
          <RNTextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            multiline={multiline}
            style={[
              styles.input,
              { color: colors.text },
              leftIcon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              multiline && styles.multilineInput,
              style,
            ]}
            {...restProps}
          />
          {rightIcon && (
            <View style={styles.rightIconWrapper}>
              <Lucide
                name={rightIcon}
                size={18}
                color={onRightIconPress ? "#3b82f6" : colors.textSecondary}
                onPress={onRightIconPress}
              />
            </View>
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
);

AppTextInput.displayName = "AppTextInput";

export default AppTextInput;

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 4,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    borderWidth: 1,
  },
  multilineContainer: {
    alignItems: "flex-start",
    minHeight: 100,
    paddingVertical: 12,
  },
  leftIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    ...Platform.select({
      ios: { paddingVertical: 12 },
      android: { paddingVertical: 14 },
    }),
  },
  inputWithLeftIcon: { marginLeft: 0 },
  inputWithRightIcon: { marginRight: 4 },
  multilineInput: {
    textAlignVertical: "top",
  },
  rightIconWrapper: {
    paddingLeft: 8,
    justifyContent: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    paddingHorizontal: 4,
  },
});
