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
import type { StorePickerProps } from "./store-picker.types";

export default function StorePicker({
  stores,
  selectedStoreId,
  colors,
  colorScheme,
  onSelect,
}: StorePickerProps) {
  const [expanded, setExpanded] = useState(false);
  const selectedLabel =
    stores.find((store) => store.id === selectedStoreId)?.name ?? "";
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
          {stores.map((store) => (
            <DropdownMenuItem
              key={store.id}
              onClick={() => {
                onSelect(store.id);
                setExpanded(false);
              }}
            >
              <DropdownMenuItem.Text>
                <Text>{store.name}</Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
        </ExposedDropdownMenu>
      </ExposedDropdownMenuBox>
    </Host>
  );
}
