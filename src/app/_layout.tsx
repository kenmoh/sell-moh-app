import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { ToastContainer } from "@/components/toast-container";
import { SessionProvider, useSession } from "@/lib/ctx";
import { OnboardingProvider, useOnboarding } from "@/lib/onboarding-context";
import { registerForPushNotifications } from "@/lib/push-notifications";
import { SplashScreenController } from "@/lib/splash";
import { ActiveStoreProvider } from "@/lib/store-context";
import { ToastProvider } from "@/lib/toast-context";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <SessionProvider>
              <ActiveStoreProvider>
                <OnboardingProvider>
                  <SplashScreenController />
                  <RootNavigator />
                </OnboardingProvider>
              </ActiveStoreProvider>
            </SessionProvider>
          </ToastProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const dark = useColorScheme() === "dark";
  const { session } = useSession();
  const { seen } = useOnboarding();

  // useEffect(() => {
  //   void NavigationBar.setButtonStyleAsync(dark ? "light" : "dark");
  // }, [dark]);

  useEffect(() => {
    if (session) {
      registerForPushNotifications();
    }
  }, [session]);

  return (
    <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <ToastContainer />
      {/* <View style={{ flex: 1, backgroundColor: dark ? "#1c1d22" : "#fff" }}> */}
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
          headerTintColor: dark ? "#fff" : "#17181c",
          contentStyle: { backgroundColor: dark ? "#1c1d22" : "#fff" },
        }}
      >
        <Stack.Protected
          guard={!session && !seen}
          redirectTo={session ? "/(tabs)/(pos)" : "/(auth)/sign-in"}
        >
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!session} redirectTo="/(tabs)/(pos)">
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected
          guard={!!session}
          redirectTo={seen ? "/(auth)/sign-in" : "/(onboarding)"}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      {/* </View> */}
    </ThemeProvider>
  );
}
