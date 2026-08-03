import { Colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, useColorScheme, View, ViewProps } from "react-native";

interface AppViewProps extends ViewProps {
  children: React.ReactNode;
}

const AView = ({ children }: AppViewProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {children}
    </View>
  );
};

export default AView;

const styles = StyleSheet.create({});
