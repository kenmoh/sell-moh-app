import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";
import { useColorScheme, View } from "react-native";

const OrderLayout = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ title: "Orders" }} />
        <Stack.Screen name="[id]" options={{ title: "Order Details" }} />
      </Stack>
    </View>
  );
};

export default OrderLayout;
