import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const dark = useColorScheme() === "dark";
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
