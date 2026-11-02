import type { ColorPalette } from "@/constants/theme";
import type { ProductResponse } from "@/types/product";
import type { ColorSchemeName } from "react-native";

export type DocumentItemPickerProps = {
  selectedProductId?: string;
  selectedLabel: string;
  products: ProductResponse[];
  colors: ColorPalette;
  colorScheme: ColorSchemeName | null;
  onSelect: (productId: string) => void;
};

export const getDocumentItemPickerOptions = ({
  selectedProductId,
  selectedLabel,
  products,
}: Pick<
  DocumentItemPickerProps,
  "selectedProductId" | "selectedLabel" | "products"
>) => [
  { label: selectedLabel, value: selectedProductId ?? "" },
  ...products
    .filter((product) => product.id !== selectedProductId)
    .map((product) => ({ label: product.name, value: product.id })),
];
