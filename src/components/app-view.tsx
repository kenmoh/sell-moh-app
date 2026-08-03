import { Colors } from "@/constants/theme";
import { Host } from "@expo/ui";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "../hooks/use-color-scheme.web";

const AppView = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingLeft: insets.left + 10,
        paddingRight: insets.right + 10,
      }}
    >
      <Host
        useViewportSizeMeasurement
        seedColor={"#1c1d22"}
        style={{ flex: 1 }}
      >
        {children}
      </Host>
    </View>
  );
};

export default AppView;

const styles = StyleSheet.create({});
