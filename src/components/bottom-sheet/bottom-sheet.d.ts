import type { ComponentType, ReactNode } from "react";

export type AppBottomSheetProps = {
  children: ReactNode;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
};

declare const AppBottomSheet: ComponentType<AppBottomSheetProps>;
export default AppBottomSheet;
