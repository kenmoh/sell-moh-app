import { Host } from "@expo/ui";
import { Picker, Text } from "@expo/ui/swift-ui";
import {
  clipShape,
  frame,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";
import type { StorePickerProps } from "./store-picker.types";

export default function StorePicker({
  stores,
  selectedStoreId,
  colorScheme,
  onSelect,
}: StorePickerProps) {
  const [width, setWidth] = useState(0);

  return (
    <Host
      matchContents={{ vertical: true }}
      style={{ width: "100%" }}
      colorScheme={colorScheme ?? "light"}
      onLayout={(event) => {
        const measuredWidth = event.nativeEvent.layout.width;
        setWidth((currentWidth) =>
          currentWidth === measuredWidth ? currentWidth : measuredWidth,
        );
      }}
    >
      <Picker
        selection={selectedStoreId}
        onSelectionChange={(value) => {
          if (value) onSelect(value);
        }}
        modifiers={[
          pickerStyle("menu"),
          clipShape("roundedRectangle", 12),
          ...(width > 0 ? [frame({ width })] : []),
        ]}
      >
        {stores.map((store) => (
          <Text key={store.id} modifiers={[tag(store.id)]}>
            {store.name}
          </Text>
        ))}
      </Picker>
    </Host>
  );
}
