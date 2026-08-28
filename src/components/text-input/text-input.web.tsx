import { Colors } from "@/constants/theme";
import { useState } from "react";
import {
  TextInput as RNTextInput,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { TextInputProps } from "./text-input.d";

const TextInput = ({
  placeholder,
  value,
  onChangeText,
  ...rest
}: TextInputProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  return (
    <RNTextInput
      placeholder={placeholder}
      placeholderTextColor={colors.placeholder}
      value={value}
      onChangeText={onChangeText}
      style={[
        styles.input,
        {
          backgroundColor: colors.textInput,
          color: colors.text,
        },
      ]}
      {...rest}
    />
  );
};

export default TextInput;

const styles = StyleSheet.create({
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
});
