# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Jetpack Compose (@expo/ui/jetpack-compose)

## State
- `OutlinedTextField` `value` prop requires `ObservableState<string>` — use `useNativeState("")` from `@expo/ui/jetpack-compose`, NOT `useState`
- `OutlinedTextField.Placeholder` is a slot child, not a `placeholder` prop
- Other form state (Switch, Checkbox, Slider, etc.) uses regular `useState`

## Layout
- `ModalBottomSheet` must be rendered OUTSIDE `LazyColumn` but inside `<Host>` (it's an overlay, not a list item)
- Compose `Row`/`Column` only accept `modifiers` prop (not `style`); the universal `Row`/`Column` from `@expo/ui` accept `style`
- Use `weight(N)` modifier from `@expo/ui/jetpack-compose/modifiers` for flex-like sizing in Compose Rows/Columns

## Shapes
- Do NOT use `<Shape.RoundedCorner>` JSX — use `clip(Shapes.RoundedCorner(N))` modifier instead

## Text
- Compose `Text` uses `color` as a direct prop, NOT inside `style: TextStyle`
- `style` on Compose `Text` only accepts `TextStyle` properties

## Icons
- Use `@expo/material-symbols/<name>.xml` for Material Symbols icons (import default, resolves to asset ID)
- Use `<Icon>` from `@expo/ui/jetpack-compose` to render them: `<Icon source={ImportName} size={24} tint={color} />`
- Do NOT wrap `<Icon>` in `<IconButton>` inside container/toolbar slots — pass it directly
- 2794 outlined icons available; run `npx add-material-symbols <name>` from `@expo/material-symbols` CLI to add custom styles
