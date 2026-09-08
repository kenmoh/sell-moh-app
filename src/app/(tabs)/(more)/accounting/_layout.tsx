import AView from "@/components/view";
import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

const AccountingLayout = () => {
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
        <Stack.Screen name="chart-of-accounts" options={{ headerShown: false }} />
        <Stack.Screen name="journals" options={{ headerShown: false }} />
        <Stack.Screen name="trial-balance" options={{ headerShown: false }} />
        <Stack.Screen name="profit-and-loss" options={{ headerShown: false }} />
        <Stack.Screen name="balance-sheet" options={{ headerShown: false }} />
        <Stack.Screen name="cash-flow" options={{ headerShown: false }} />
      </Stack>
    </AView>
  );
};

export default AccountingLayout;
