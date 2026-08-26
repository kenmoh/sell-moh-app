import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme.web";
import { Host } from "@expo/ui";
import { LazyColumn } from "@expo/ui/jetpack-compose";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AppScrollView = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();

  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingHorizontal: 10,
      }}
    >
      <Host
        useViewportSizeMeasurement
        seedColor={colors.background}
        style={{ flex: 1 }}
      >
        <LazyColumn
          contentPadding={{
            top: insets.top + 8,
            bottom: insets.bottom + 24,
          }}
        >
          {children}
        </LazyColumn>
      </Host>
    </View>
  );
};

export default AppScrollView;

const styles = StyleSheet.create({});
