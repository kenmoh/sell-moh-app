import AView from "@/components/view";
import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

const MoreLayout = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <AView>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="store-profile" options={{ headerShown: false }} />
        <Stack.Screen name="products" options={{ headerShown: false }} />
        <Stack.Screen name="add-product" options={{ headerShown: false }} />
        <Stack.Screen name="product-details" options={{ headerShown: false }} />
        <Stack.Screen name="discounts" options={{ headerShown: false }} />
        <Stack.Screen name="staff-roles" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
      </Stack>
    </AView>
  );
};

export default MoreLayout;
