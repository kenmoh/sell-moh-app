import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";
import { StyleSheet, useColorScheme } from "react-native";
// import Transition from "react-native-screen-transitions";
// import { createBlankStackNavigator } from "react-native-screen-transitions/react-navigation";

// const Stack = withLayoutContext(createBlankStackNavigator());

const AuthLayout = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: "" }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ title: "" }} />
    </Stack>
  );
};

export default AuthLayout;

const styles = StyleSheet.create({});
