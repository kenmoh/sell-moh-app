import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { SessionProvider, useSession } from "@/lib/ctx";
import { SplashScreenController } from "@/lib/splash";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationBar } from "expo-navigation-bar";
import { useEffect } from "react";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <SplashScreenController />
          <RootNavigator />
        </SessionProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const dark = useColorScheme() === "dark";
  const { session } = useSession();

  // if (Platform.OS === "android") {
  //   SystemUI.setBackgroundColorAsync(dark ? "#111111" : "FAFAFA");
  // }

  useEffect(() => {
    if (dark) {
      <NavigationBar style="dark" />;
    } else if (dark === false) {
      <NavigationBar style="light" />;
    }
  }, [dark]);

  return (
    <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <View style={{ flex: 1, backgroundColor: dark ? "#1c1d22" : "#fff" }}>
        <Stack
          screenOptions={{
            headerBackButtonDisplayMode: "minimal",
            headerShadowVisible: false,
            headerTintColor: dark ? "#fff" : "#17181c",
            contentStyle: { backgroundColor: dark ? "#1c1d22" : "#fff" },
          }}
        >
          <Stack.Protected guard={!!session}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={!session}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </View>
    </ThemeProvider>
  );
}
