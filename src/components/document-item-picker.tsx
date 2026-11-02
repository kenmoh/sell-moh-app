import { Host, Picker } from "@expo/ui";
import type { DocumentItemPickerProps } from "./document-item-picker.types";
import { getDocumentItemPickerOptions } from "./document-item-picker.types";

export default function DocumentItemPicker(props: DocumentItemPickerProps) {
  const options = getDocumentItemPickerOptions(props);

  return (
    <Host
      style={{ width: "100%", alignItems: "stretch" }}
      colorScheme={props.colorScheme ?? "light"}
      seedColor={props.colors.buttonPrimary}
    >
      <Picker
        selectedValue={props.selectedProductId ?? ""}
        onValueChange={(value) => {
          if (value) props.onSelect(value);
        }}
      >
        {options.map((option) => (
          <Picker.Item
            key={option.value || "empty"}
            label={option.label}
            value={option.value}
          />
        ))}
      </Picker>
    </Host>
  );
}
