import type { StoreData } from "@/api/store";
import type { ColorPalette } from "@/constants/theme";
import type { ColorSchemeName } from "react-native";

export type StorePickerProps = {
  stores: StoreData[];
  selectedStoreId: string;
  colors: ColorPalette;
  colorScheme: ColorSchemeName | null;
  onSelect: (storeId: string) => void;
};
