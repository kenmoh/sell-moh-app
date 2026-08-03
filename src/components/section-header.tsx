import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme.web";
import { Row } from "@expo/ui";
import { Text } from "react-native";

export default function SectionHeader({ title }: { title: string }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <Row style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 4 }}>
      <Text
        style={{
          color: "#aaa",
          fontSize: 13,
          fontWeight: "500",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
    </Row>
  );
}
