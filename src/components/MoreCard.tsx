import { Colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

const MoreCard = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <>
      <Text
        style={{
          marginVertical: 5,
          color: colors.textSecondary,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          paddingHorizontal: 18,
          paddingVertical: 20,
          gap: 25,
        }}
      >
        {children}
      </View>
    </>
  );
};

export default MoreCard;

const styles = StyleSheet.create({});
