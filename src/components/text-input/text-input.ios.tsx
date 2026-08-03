import { Colors } from "@/constants/theme";
import { TextField, useNativeState } from "@expo/ui/swift-ui";
import { background, cornerRadius, padding } from "@expo/ui/swift-ui/modifiers";
import { useColorScheme } from "react-native";
import { TextInputProps } from "./text-input.d";

const TextInput = ({ placeholder }: TextInputProps) => {
  const scheme = useColorScheme();
  const value = useNativeState("");
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  return (
    <TextField
      text={value}
      placeholder={placeholder}
      modifiers={[
        padding({ all: 10 }),
        background(colors.textInput),
        cornerRadius(25),
      ]}
    />
  );
};

export default TextInput;
