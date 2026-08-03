import { ComponentType } from "react";
import { TextInputProps as RNTextInputProps } from "react-native";

export type TextInputProps = RNTextInputProps & {
  placeholder?: string;
};

declare const TextInput: ComponentType<TextInputProps>;
export default TextInput;
