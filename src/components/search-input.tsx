import { Colors } from "@/constants/theme";
import { SymbolView } from "expo-symbols";
import React from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";

export interface SearchInputProps extends TextInputProps {
  /** Optional custom style for the outer input container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional callback triggered when the clear button is pressed */
  onClear?: () => void;
  /** Whether to hide the leading search icon */
  hideSearchIcon?: boolean;
}

export const SearchInput = React.forwardRef<TextInput, SearchInputProps>(
  (
    {
      value,
      onChangeText,
      placeholder = "Search products...",
      containerStyle,
      style,
      onClear,
      hideSearchIcon = false,
      returnKeyType = "search",
      ...restProps
    },
    ref
  ) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme === "unspecified" ? "light" : scheme];

    const handleClear = () => {
      onChangeText?.("");
      onClear?.();
    };

    const showClearButton = Boolean(value && value.length > 0);

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.textInput,
          },
          containerStyle,
        ]}
      >
        {!hideSearchIcon && (
          <SymbolView
            name="magnifyingglass"
            size={18}
            tintColor={colors.textSecondary}
            style={styles.searchIcon}
          />
        )}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          selectionColor="#7c3aed"
          cursorColor="#7c3aed"
          returnKeyType={returnKeyType}
          style={[
            styles.input,
            {
              color: colors.text,
            },
            style,
          ]}
          {...restProps}
        />

        {showClearButton && (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            style={styles.clearButton}
          >
            <SymbolView
              name="xmark.circle.fill"
              size={18}
              tintColor={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
    );
  }
);

SearchInput.displayName = "SearchInput";

export default SearchInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 12 : 6,
    minHeight: 48,
    width: "100%",
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
});
