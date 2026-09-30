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
        <Stack.Screen
          name="chart-of-accounts"
          options={{ title: "Chart of Accounts" }}
        />
        <Stack.Screen name="journals" options={{ title: "Journal Entries" }} />
        <Stack.Screen
          name="trial-balance"
          options={{ title: "Trial Balance" }}
        />
        <Stack.Screen
          name="profit-and-loss"
          options={{ title: "Profit & Loss" }}
        />
        <Stack.Screen
          name="balance-sheet"
          options={{ title: "Balance Sheet" }}
        />
        <Stack.Screen name="cash-flow" options={{ title: "Cash Flow" }} />
      </Stack>
    </AView>
  );
};

export default AccountingLayout;
