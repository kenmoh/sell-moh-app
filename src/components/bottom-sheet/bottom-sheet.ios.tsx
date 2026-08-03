import { Colors } from "@/constants/theme";
import { BottomSheet, Group, VStack } from "@expo/ui/swift-ui";
import { padding, presentationBackground } from "@expo/ui/swift-ui/modifiers";
import React from "react";
import { useColorScheme } from "react-native";

const AppBottomSheet = ({
  children,
  visible,
  onVisibleChange,
}: {
  children: React.ReactNode;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <VStack>
      <BottomSheet
        isPresented={visible}
        onIsPresentedChange={onVisibleChange}
        fitToContents
      >
        <Group modifiers={[presentationBackground(colors.sheet)]}>
          <VStack modifiers={[padding({ all: 20 })]}>{children}</VStack>
        </Group>
      </BottomSheet>
    </VStack>
  );
};

export default AppBottomSheet;
