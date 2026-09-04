// import { Colors } from "@/constants/theme";
// import { BottomSheet, Host, RNHostView } from "@expo/ui";
// import React from "react";
// import { Dimensions, Platform, ScrollView, useColorScheme } from "react-native";

// const SHEET_WIDTH = Dimensions.get("window").width;

// const AppBottomSheet = ({
//   children,
//   visible,
//   onVisibleChange,
// }: {
//   children: React.ReactNode;
//   visible: boolean;
//   onVisibleChange: (visible: boolean) => void;
// }) => {
//   const scheme = useColorScheme();
//   const colors = Colors[scheme === "dark" ? "dark" : "light"];

//   const content = (
//     <ScrollView
//       style={{ width: SHEET_WIDTH }}
//       contentContainerStyle={{
//         alignItems: "center",
//         backgroundColor: colors.background,
//       }}
//       keyboardShouldPersistTaps="handled"
//       showsVerticalScrollIndicator={false}
//     >
//       {children}
//     </ScrollView>
//   );

//   return (
//     <Host matchContents>
//       <BottomSheet
//         isPresented={visible}
//         onDismiss={() => onVisibleChange(false)}
//         showDragIndicator
//         snapPoints={["half", "full"]}
//       >
//         {Platform.OS === "android" ? (
//           <RNHostView matchContents>{content}</RNHostView>
//         ) : (
//           content
//         )}
//       </BottomSheet>
//     </Host>
//   );
// };

// export default AppBottomSheet;

import { Colors } from "@/constants/theme";
import BottomSheet, {
  BottomSheetMethods,
  BottomSheetScrollView,
} from "@expo/ui/community/bottom-sheet";
import React, { Ref, useCallback, useEffect, useRef } from "react";
import { useColorScheme } from "react-native";

export default function AppBottomSheet({
  children,
  visible,
  onVisibleChange,
  sheetRef: externalRef,
  snapPoints,
  enableDynamicSizing = false,
}: {
  children: React.ReactNode;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  sheetRef?: Ref<BottomSheetMethods>;
  snapPoints?: (string | number)[];
  enableDynamicSizing?: boolean;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const internalRef = useRef<BottomSheet>(null);
  const programmaticRef = useRef(false);

  useEffect(() => {
    if (visible === true) {
      programmaticRef.current = true;
      internalRef.current?.present?.() ?? internalRef.current?.snapToIndex?.(0);
    } else if (visible === false) {
      programmaticRef.current = true;
      internalRef.current?.dismiss?.() ?? internalRef.current?.close?.();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    if (programmaticRef.current) {
      programmaticRef.current = false;
      return;
    }
    onVisibleChange?.(false);
  }, [onVisibleChange]);

  const handleDismiss = useCallback(() => {
    if (programmaticRef.current) {
      programmaticRef.current = false;
      return;
    }
    onVisibleChange?.(false);
  }, [onVisibleChange]);

  return (
    <BottomSheet
      ref={(node) => {
        (internalRef as any).current = node;
        if (typeof externalRef === "function") {
          externalRef(node);
        } else if (externalRef && "current" in externalRef) {
          (externalRef as any).current = node;
        }
      }}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose
      onClose={handleClose}
      onDismiss={handleDismiss}
      backgroundStyle={{ backgroundColor: colors.card }}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={{
          width: "100%",
          paddingHorizontal: 12,
          paddingBottom: 24,
        }}
        style={{
          width: "100%",
          flex: 1,
        }}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheet>
    // </View>
  );
}
