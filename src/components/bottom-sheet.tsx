import { Colors } from "@/constants/theme";
import SheetErrorBanner from "@/components/sheet-error-banner";
import BottomSheet, {
  BottomSheetMethods,
  BottomSheetScrollView,
} from "@expo/ui/community/bottom-sheet";
import React, { Ref, useCallback, useRef } from "react";
import { useColorScheme } from "react-native";

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

  const handleClosed = useCallback(() => {
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
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
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
      {visible && <SheetErrorBanner />}
    </BottomSheet>
  );
}
