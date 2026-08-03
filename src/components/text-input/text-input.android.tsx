import { Colors } from "@/constants/theme";
import { BasicTextField, Box, Text, useNativeState } from "@expo/ui/jetpack-compose";
import {
  background,
  clip,
  fillMaxWidth,
  padding,
  Shapes,
} from "@expo/ui/jetpack-compose/modifiers";
import { useColorScheme } from "react-native";

const TextInput = ({
  placeholder = "",
}: {
  placeholder?: string;
}) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const value = useNativeState("");
  return (
    <BasicTextField
      cursorColor="#7c3aed"
      value={value}
      modifiers={[
        fillMaxWidth(),
        clip(Shapes.RoundedCorner(25)),
        background(colors.textInput),
        padding(15, 17, 17, 15),
      ]}
    >
      <BasicTextField.DecorationBox>
        <Box>
          <BasicTextField.Placeholder>
            <Text color={colors.textSecondary}>{placeholder}</Text>
          </BasicTextField.Placeholder>
          <BasicTextField.InnerTextField />
        </Box>
      </BasicTextField.DecorationBox>
    </BasicTextField>
  );
};

export default TextInput;
