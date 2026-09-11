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
        <Stack.Screen name="store" options={{ title: "Stores" }} />
        <Stack.Screen name="[storeId]" options={{ headerShown: false }} />
        <Stack.Screen name="store-profile" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
        <Stack.Screen name="tax-settings" options={{ headerShown: false }} />
        <Stack.Screen name="accounting" options={{ headerShown: false }} />
        <Stack.Screen name="inventory" options={{ headerShown: false }} />
        <Stack.Screen name="customers" options={{ headerShown: false }} />
        <Stack.Screen name="staff-roles" options={{ headerShown: false }} />
        <Stack.Screen name="report" options={{ headerShown: false }} />
        <Stack.Screen
          name="notifications"
          options={{ title: "Notifications" }}
        />
        <Stack.Screen
          name="discounts"
          options={{ title: "Discounts & Coupons" }}
        />
        <Stack.Screen name="open-carts" options={{ headerShown: false }} />
        <Stack.Screen
          name="tenant-activity-logs"
          options={{ title: "Activity Logs" }}
        />
        <Stack.Screen
          name="settlement"
          options={{ title: "Settlements" }}
        />
      </Stack>
    </AView>
  );
};

export default MoreLayout;
