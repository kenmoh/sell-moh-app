import { Colors } from "@/constants/theme";
import { Lucide, LucideIconName } from "@react-native-vector-icons/lucide";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

interface LinkProps {
  leadingIcon: LucideIconName;
  label: string;
  onPress?: () => void;
}

const LinkItem = ({ leadingIcon, label, onPress }: LinkProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
        }}
      >
        <Lucide name={leadingIcon} color={"#aaa"} size={18} />

        <Text style={{ color: colors.text }}>{label}</Text>
      </View>
      <Lucide name="chevron-right" color={"#aaa"} size={20} />
    </Pressable>
  );
};

export default LinkItem;

const styles = StyleSheet.create({});
