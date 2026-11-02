import { Host } from "@expo/ui";
import { Picker, Text } from "@expo/ui/swift-ui";
import {
  clipShape,
  frame,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";
import type { DocumentItemPickerProps } from "./document-item-picker.types";
import { getDocumentItemPickerOptions } from "./document-item-picker.types";

export default function DocumentItemPicker(props: DocumentItemPickerProps) {
  const [width, setWidth] = useState(0);
  const options = getDocumentItemPickerOptions(props);

  return (
    <Host
      matchContents={{ vertical: true }}
      style={{ width: "100%" }}
      colorScheme={props.colorScheme ?? "light"}
      onLayout={(event) => {
        const measuredWidth = event.nativeEvent.layout.width;
        setWidth((currentWidth) =>
          currentWidth === measuredWidth ? currentWidth : measuredWidth,
        );
      }}
    >
      <Picker
        selection={props.selectedProductId ?? ""}
        onSelectionChange={(value) => {
          if (value) props.onSelect(value);
        }}
        modifiers={[
          pickerStyle("menu"),
          clipShape("roundedRectangle", 12),
          ...(width > 0 ? [frame({ width })] : []),
        ]}
      >
        {options.map((option) => (
          <Text key={option.value || "empty"} modifiers={[tag(option.value)]}>
            {option.label}
          </Text>
        ))}
      </Picker>
    </Host>
  );
}
