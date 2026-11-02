import { Host, Picker } from "@expo/ui";
import type { StorePickerProps } from "./store-picker.types";

export default function StorePicker({
  stores,
  selectedStoreId,
  colors,
  colorScheme,
  onSelect,
}: StorePickerProps) {
  return (
    <Host
      style={{ width: "100%", alignItems: "stretch" }}
      colorScheme={colorScheme ?? "light"}
      seedColor={colors.buttonPrimary}
    >
      <Picker
        selectedValue={selectedStoreId}
        onValueChange={(storeId) => onSelect(storeId)}
      >
        {stores.map((store) => (
          <Picker.Item key={store.id} label={store.name} value={store.id} />
        ))}
      </Picker>
    </Host>
  );
}
