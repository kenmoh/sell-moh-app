import SheetErrorBanner from "@/components/sheet-error-banner";
import { Colors } from "@/constants/theme";
import {
  BottomSheet,
  BottomSheetMethods,
  BottomSheetScrollView,
} from "@expo/ui/community/bottom-sheet";
import React, { useCallback, useRef } from "react";
import { Dimensions, useColorScheme } from "react-native";

/**
 * Visibility is driven purely by the `index` prop (-1 = closed, 0 = open),
 * the declarative API of @expo/ui's BottomSheet on both platforms.
 *
 * Never call the imperative present()/dismiss()/close() from here: on Android
 * those resolve to ModalBottomSheetView.hide(), whose promise rejects whenever
 * the sheet is not currently shown (double close, close racing presentation,
 * unmount during animation). The library does not catch that rejection, so it
 * surfaces as "Uncaught (in promise) Error: Call to function
 * 'ModalBottomSheetView.hide' has been rejected." — and the chained callbacks
 * can then update React state on an unmounted parent.
 *
 * User-initiated closes (swipe, back button, scrim) flow back through
 * onClose/onDismiss and are forwarded to onVisibleChange(false).
 */
export default function AppBottomSheet({
  children,
  visible,
  onVisibleChange,
  snapPoints = ["80%", "95%"],
  enableDynamicSizing = true,
}: {
  children: React.ReactNode;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  snapPoints?: (string | number)[];
  enableDynamicSizing?: boolean;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const internalRef = useRef<BottomSheetMethods>(null);

  const windowHeight = Dimensions.get("window").height;
  const snapPointsInPixels = snapPoints.map((point) => {
    if (typeof point === "string" && point.endsWith("%")) {
      const percentage = parseFloat(point) / 100;
      return percentage * windowHeight;
    }
    return point;
  });

  const handleClosed = useCallback(() => {
    onVisibleChange?.(false);
  }, [onVisibleChange]);

  return (
    <BottomSheet
      ref={internalRef}
      index={visible ? 0 : -1}
      snapPoints={snapPointsInPixels}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose
      onClose={handleClosed}
      onDismiss={handleClosed}
      backgroundStyle={{ backgroundColor: colors.card }}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={{
          width: "100%",
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
        style={{
          width: "100%",
          flex: 1,
        }}
      >
        {children}
      </BottomSheetScrollView>
      {visible && <SheetErrorBanner />}
    </BottomSheet>
  );
}

// import SheetErrorBanner from "@/components/sheet-error-banner";
// import { Colors } from "@/constants/theme";
// import { BottomSheet, Host, RNHostView, ScrollView, SnapPoint } from "@expo/ui";
// import React, { useCallback } from "react";
// import { useColorScheme } from "react-native";

// /**
//  * Visibility is driven purely by the `isPresented` prop in the native SDK 58
//  * BottomSheet. The imperative API and `index` prop from the community version
//  * are not used here, as the native implementation is fully declarative.
//  *
//  * User-initiated closes (swipe, back button, scrim) flow back through
//  * onDismiss and are forwarded to onVisibleChange(false).
//  */
// export default function AppBottomSheet({
//   children,
//   visible,
//   onVisibleChange,
//   snapPoints = ["full"],
// }: {
//   children: React.ReactNode;
//   visible?: boolean;
//   onVisibleChange?: (visible: boolean) => void;
//   snapPoints?: SnapPoint[];
// }) {
//   const scheme = useColorScheme();
//   const colors = Colors[scheme === "dark" ? "dark" : "light"];

//   const handleDismiss = useCallback(() => {
//     onVisibleChange?.(false);
//   }, [onVisibleChange]);

//   return (
//     <BottomSheet
//       isPresented={!!visible}
//       onDismiss={handleDismiss}
//       snapPoints={snapPoints}
//       contentPadding={16}
//       containerColor={colors.background}
//       contentColor={colors.background}
//       shouldDismissOnBackPress
//       shouldDismissOnClickOutside
//       showDragIndicator
//     >
//       <RNHostView style={{ paddingBottom: 120 }}>
//         <Host>
//           <ScrollView>{children}</ScrollView>
//           {visible && <SheetErrorBanner />}
//         </Host>
//       </RNHostView>
//     </BottomSheet>
//   );
// }
