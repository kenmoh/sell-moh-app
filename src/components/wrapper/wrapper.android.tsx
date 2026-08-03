import { Colors } from "@/constants/theme";
import { Card } from "@expo/ui/jetpack-compose";
import { width } from "@expo/ui/jetpack-compose/modifiers";
import { Dimensions, useColorScheme } from "react-native";
import { WrapperProps } from "./wrapper";

const WIDTH = Dimensions.get("window").width * 0.95;

export default function Wrapper({ children }: WrapperProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  return (
    <Card colors={{ containerColor: colors.card }} modifiers={[width(WIDTH)]}>
      {children}
    </Card>
  );
}
