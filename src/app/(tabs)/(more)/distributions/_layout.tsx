import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

const DistributionLayout = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="new-distribution"
        options={{ headerShown: true, title: "New Distribution" }}
      />
    </Stack>
  );
};

export default DistributionLayout;
