import { Colors } from "@/constants/theme";
import type { ModalBottomSheetRef } from "@expo/ui/jetpack-compose";
import { Column, Host, ModalBottomSheet } from "@expo/ui/jetpack-compose";
import { paddingAll } from "@expo/ui/jetpack-compose/modifiers";
import { useRef } from "react";
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
  const sheetRef = useRef<ModalBottomSheetRef>(null);

  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <Host matchContents>
      {visible && (
        <ModalBottomSheet
          ref={sheetRef}
          onDismissRequest={() => {
            onVisibleChange(false);
          }}
          containerColor={colors.sheet}
          contentColor={colors.sheetContent}
        >
          <Column
            verticalArrangement={{ spacedBy: 12 }}
            modifiers={[paddingAll(24)]}
          >
            {children}
          </Column>
        </ModalBottomSheet>
      )}
    </Host>
  );
};

export default AppBottomSheet;
