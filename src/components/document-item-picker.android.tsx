import {
  DropdownMenuItem,
  ExposedDropdownMenu,
  ExposedDropdownMenuBox,
  Host,
  OutlinedTextField,
  Text,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import {
  clip,
  fillMaxWidth,
  menuAnchor,
  Shapes,
} from "@expo/ui/jetpack-compose/modifiers";
import { useEffect, useState } from "react";
import type { DocumentItemPickerProps } from "./document-item-picker.types";

export default function DocumentItemPicker({
  selectedLabel,
  products,
  colors,
  colorScheme,
  onSelect,
}: DocumentItemPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const labelState = useNativeState(selectedLabel);

  useEffect(() => {
    labelState.set(selectedLabel);
  }, [labelState, selectedLabel]);

  return (
    <Host
      matchContents={{ vertical: true }}
      style={{ width: "100%" }}
      colorScheme={colorScheme ?? "light"}
      seedColor={colors.buttonPrimary}
    >
      <ExposedDropdownMenuBox
        expanded={expanded}
        onExpandedChange={setExpanded}
        modifiers={[fillMaxWidth()]}
      >
        <OutlinedTextField
          value={labelState}
          readOnly
          singleLine
          modifiers={[
            menuAnchor(),
            fillMaxWidth(),
            clip(Shapes.RoundedCorner(12)),
          ]}
          colors={{
            focusedTextColor: colors.text,
            unfocusedTextColor: colors.text,
            focusedContainerColor: colors.textInput,
            unfocusedContainerColor: colors.textInput,
            focusedIndicatorColor: "transparent",
            unfocusedIndicatorColor: "transparent",
          }}
        >
          <OutlinedTextField.TrailingIcon>
            <Text color={colors.textSecondary}>⌄</Text>
          </OutlinedTextField.TrailingIcon>
        </OutlinedTextField>
        <ExposedDropdownMenu
          expanded={expanded}
          onDismissRequest={() => setExpanded(false)}
        >
          {products.map((product) => (
            <DropdownMenuItem
              key={product.id}
              onClick={() => {
                onSelect(product.id);
                setExpanded(false);
              }}
            >
              <DropdownMenuItem.Text>
                <Text>{product.name}</Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
          {products.length === 0 && (
            <DropdownMenuItem enabled={false}>
              <DropdownMenuItem.Text>
                <Text color={colors.textSecondary}>
                  No items in this store
                </Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          )}
        </ExposedDropdownMenu>
      </ExposedDropdownMenuBox>
    </Host>
  );
}
