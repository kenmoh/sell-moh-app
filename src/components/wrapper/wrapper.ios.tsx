import { Colors } from "@/constants/theme";
import { Column } from "@expo/ui";
import { VStack } from "@expo/ui/swift-ui";
import { cornerRadius, padding, shadow } from "@expo/ui/swift-ui/modifiers";
import { useColorScheme } from "react-native";
import { WrapperProps } from "./wrapper";

export default function Wrapper({ children }: WrapperProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  return (
    <Column>
      <VStack
        modifiers={[
          cornerRadius(12),
          padding({ all: 16 }),
          shadow({ radius: 4, x: 0, y: 2, color: "#00000026" }),
        ]}
        spacing={12}
        alignment="leading"
      >
        {children}
      </VStack>
    </Column>
  );
}
