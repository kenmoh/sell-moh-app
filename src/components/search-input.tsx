import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import React from "react";
import {
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
  containerStyle?: StyleProp<ViewStyle>;
  onClear?: () => void;
  hideSearchIcon?: boolean;
  height?: number;
}

export const SearchInput = React.forwardRef<TextInput, SearchInputProps>(
  (
    {
      value,
      onChangeText,
      placeholder = "Search...",
      containerStyle,
      style,
      onClear,
      hideSearchIcon = false,
      returnKeyType = "search",
      height = 45,
      ...restProps
    },
    ref,
  ) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme === "dark" ? "dark" : "light"];

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
            height,
          },
          containerStyle,
        ]}
      >
        {!hideSearchIcon && (
          <Lucide
            name="search"
            size={16}
            color={colors.placeholder}
            style={styles.searchIcon}
          />
        )}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
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
            <Lucide name="x" size={16} color={colors.placeholder} />
          </Pressable>
        )}
      </View>
    );
  },
);

SearchInput.displayName = "SearchInput";

export default SearchInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    paddingHorizontal: 14,
    width: "100%",
    // marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
});
