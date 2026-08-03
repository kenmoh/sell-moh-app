import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme.web";
import AddCircle from "@expo/material-symbols/add_circle.xml";
import ContentCopy from "@expo/material-symbols/content_copy.xml";
import ContentCut from "@expo/material-symbols/content_cut.xml";
import ContentPaste from "@expo/material-symbols/content_paste.xml";
import Info from "@expo/material-symbols/info.xml";
import SearchIcon from "@expo/material-symbols/search.xml";
import SelectAll from "@expo/material-symbols/select_all.xml";
import { Column, Host, Picker, Row } from "@expo/ui";
import {
  AlertDialog,
  AssistChip,
  Badge,
  Button,
  Card,
  Checkbox,
  CircularProgressIndicator,
  DateTimePicker,
  DockedSearchBar,
  ElevatedButton,
  FilledTonalButton,
  FilterChip,
  HorizontalDivider,
  HorizontalFloatingToolbar,
  HorizontalPager,
  HorizontalUncontainedCarousel,
  Icon,
  LazyColumn,
  LinearProgressIndicator,
  ListItem,
  LoadingIndicator,
  ModalBottomSheet,
  OutlinedButton,
  OutlinedTextField,
  RadioButton,
  RNHostView,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Slider,
  Surface,
  Switch,
  Text,
  TextButton,
  ToggleButton,
  useMaterialColors,
  useNativeState,
  VerticalDivider,
} from "@expo/ui/jetpack-compose";
import {
  clip,
  fillMaxWidth,
  Shapes,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import { useState } from "react";
import { Image, Pressable, Text as RNText, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FLAVOURS = [
  { label: "Vanilla", value: "vanilla" },
  { label: "Chocolate", value: "chocolate" },
  { label: "Strawberry", value: "strawberry" },
];

function SectionHeader({ title }: { title: string }) {
  const m3 = useMaterialColors();
  return (
    <Row style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 4 }}>
      <Text
        color={m3.onSurfaceVariant}
        style={{
          fontSize: 13,
          fontWeight: "500",
          letterSpacing: 1,
        }}
      >
        {title.toUpperCase()}
      </Text>
    </Row>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <BoxWrapper>
      <Surface tonalElevation={1} modifiers={[clip(Shapes.RoundedCorner(10))]}>
        <Column spacing={16} style={{ padding: 16 }}>
          {children}
        </Column>
      </Surface>
    </BoxWrapper>
  );
}

function BoxWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Column style={{ paddingHorizontal: 16, paddingVertical: 2 }}>
      {children}
    </Column>
  );
}

function ControlRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Row alignment="center" spacing={16}>
      <Text modifiers={[weight(1)]} style={{ fontSize: 14 }}>
        {label}
      </Text>
      {children}
    </Row>
  );
}

export default function ComponentsShowcase() {
  const insets = useSafeAreaInsets();
  const m3 = useMaterialColors();
  const [switchOn, setSwitchOn] = useState(false);
  const [checked, setChecked] = useState(false);
  const [radio, setRadio] = useState("first");
  const [sliderValue, setSliderValue] = useState(0.5);
  const textValue = useNativeState("");
  const [filterSelected, setFilterSelected] = useState(false);
  const [tog, setTog] = useState(false);
  const [segIndex, setSegIndex] = useState(0);
  const [flavour, setFlavour] = useState("vanilla");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [pagerPage, setPagerPage] = useState(0);
  const [dockQuery, setDockQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Host
        useViewportSizeMeasurement
        seedColor={"#1c1d22"}
        style={{ flex: 1 }}
      >
        <LazyColumn
          verticalArrangement={{ spacedBy: 0 }}
          contentPadding={{
            top: insets.top + 8,
            bottom: insets.bottom + 24,
          }}
        >
          <Row
            alignment="center"
            style={{ paddingHorizontal: 16, paddingBottom: 8 }}
          >
            <Column spacing={4}>
              <Text
                color={m3.onSurface}
                style={{ fontSize: 26, fontWeight: "700" }}
              >
                Components
              </Text>
              <Text color={m3.onSurfaceVariant} style={{ fontSize: 13 }}>
                Material 3 · Jetpack Compose
              </Text>
            </Column>
            <Badge>
              <Text
                color={m3.onSurfaceVariant}
                style={{ fontSize: 11, fontWeight: "600" }}
              >
                v57
              </Text>
            </Badge>
          </Row>

          <SectionHeader title="Typography" />
          <SectionCard>
            <Text
              color={m3.onSurfaceVariant}
              style={{ fontSize: 22, fontWeight: "700" }}
            >
              Display — Headline
            </Text>
            <Text
              color={m3.onSurfaceVariant}
              style={{ fontSize: 16, fontWeight: "500" }}
            >
              Title medium
            </Text>
            <Text color={m3.onSurfaceVariant} style={{ fontSize: 14 }}>
              Body regular for longer content.
            </Text>
            <Text color={m3.onSurfaceVariant} style={{ fontSize: 12 }}>
              Label small — caption
            </Text>
          </SectionCard>

          <SectionHeader title="Buttons" />
          <SectionCard>
            <Row alignment="center" spacing={12}>
              <Button onClick={() => {}} modifiers={[weight(1)]}>
                <Text>Filled</Text>
              </Button>
              <FilledTonalButton onClick={() => {}} modifiers={[weight(1)]}>
                <Text>Tonal</Text>
              </FilledTonalButton>
            </Row>
            <Row alignment="center" spacing={12}>
              <OutlinedButton onClick={() => {}} modifiers={[weight(1)]}>
                <Text>Outlined</Text>
              </OutlinedButton>
              <ElevatedButton onClick={() => {}} modifiers={[weight(1)]}>
                <Text>Elevated</Text>
              </ElevatedButton>
            </Row>
            <TextButton onClick={() => {}}>
              <Text>Text Button</Text>
            </TextButton>
          </SectionCard>

          <SectionHeader title="Selection & Toggle" />
          <SectionCard>
            <ControlRow label="Switch">
              <Switch value={switchOn} onCheckedChange={setSwitchOn} />
            </ControlRow>
            <ControlRow label="Checkbox">
              <Checkbox value={checked} onCheckedChange={setChecked} />
            </ControlRow>
            <ControlRow label="Toggle Button">
              <ToggleButton checked={tog} onCheckedChange={setTog}>
                <Text>{tog ? "ON" : "OFF"}</Text>
              </ToggleButton>
            </ControlRow>
            <Column spacing={8}>
              <Text style={{ fontSize: 13, fontWeight: "500" }}>
                Radio Group
              </Text>
              <Row alignment="center" spacing={24}>
                <Row alignment="center" spacing={4}>
                  <RadioButton
                    selected={radio === "first"}
                    onClick={() => setRadio("first")}
                  />
                  <Text style={{ fontSize: 13 }}>Option A</Text>
                </Row>
                <Row alignment="center" spacing={4}>
                  <RadioButton
                    selected={radio === "second"}
                    onClick={() => setRadio("second")}
                  />
                  <Text style={{ fontSize: 13 }}>Option B</Text>
                </Row>
              </Row>
            </Column>
            <Column spacing={4}>
              <Text style={{ fontSize: 13, fontWeight: "500" }}>
                Segmented Button
              </Text>
              <SingleChoiceSegmentedButtonRow>
                <SegmentedButton
                  selected={segIndex === 0}
                  onClick={() => setSegIndex(0)}
                >
                  <SegmentedButton.Label>
                    <Text>Day</Text>
                  </SegmentedButton.Label>
                </SegmentedButton>
                <SegmentedButton
                  selected={segIndex === 1}
                  onClick={() => setSegIndex(1)}
                >
                  <SegmentedButton.Label>
                    <Text>Week</Text>
                  </SegmentedButton.Label>
                </SegmentedButton>
                <SegmentedButton
                  selected={segIndex === 2}
                  onClick={() => setSegIndex(2)}
                >
                  <SegmentedButton.Label>
                    <Text>Month</Text>
                  </SegmentedButton.Label>
                </SegmentedButton>
              </SingleChoiceSegmentedButtonRow>
            </Column>
          </SectionCard>

          <SectionHeader title="Input" />
          <SectionCard>
            <OutlinedTextField value={textValue} singleLine>
              <OutlinedTextField.Placeholder>
                <Text color={m3.onSurfaceVariant}>Type something...</Text>
              </OutlinedTextField.Placeholder>
            </OutlinedTextField>
            <ControlRow label={`Slider (${sliderValue.toFixed(1)})`}>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                min={0}
                max={1}
                modifiers={[weight(1)]}
              />
            </ControlRow>
            <ControlRow label="Picker">
              <Picker
                selectedValue={flavour}
                onValueChange={setFlavour}
                appearance="menu"
              >
                {FLAVOURS.map((f) => (
                  <Picker.Item key={f.value} label={f.label} value={f.value} />
                ))}
              </Picker>
            </ControlRow>
          </SectionCard>

          <SectionHeader title="Search" />
          <SectionCard>
            <DockedSearchBar onQueryChange={setDockQuery}>
              <DockedSearchBar.Placeholder>
                <Text color={m3.onSurfaceVariant}>Search</Text>
              </DockedSearchBar.Placeholder>
              <DockedSearchBar.LeadingIcon>
                <Icon
                  source={SearchIcon}
                  size={24}
                  tint={m3.onSurfaceVariant}
                />
              </DockedSearchBar.LeadingIcon>
            </DockedSearchBar>
            {dockQuery.trim() && (
              <Text style={{ fontSize: 12 }} color={m3.onSurfaceVariant}>
                Query: "{dockQuery}"
              </Text>
            )}
          </SectionCard>

          <SectionHeader title="Chips" />
          <SectionCard>
            <Row alignment="center" spacing={12}>
              <AssistChip onClick={() => {}}>
                <AssistChip.Label>
                  <Text>Assist</Text>
                </AssistChip.Label>
              </AssistChip>
              <FilterChip
                selected={filterSelected}
                onClick={() => setFilterSelected(!filterSelected)}
              >
                <FilterChip.Label>
                  <Text>Filter</Text>
                </FilterChip.Label>
              </FilterChip>
            </Row>
          </SectionCard>

          <SectionHeader title="Carousel" />
          <SectionCard>
            <HorizontalUncontainedCarousel
              itemWidth={260}
              itemSpacing={12}
              contentPadding={{ start: 0, end: 0 }}
            >
              {["Red", "Green", "Blue", "Amber", "Purple"].map((name, i) => (
                <Surface
                  key={i}
                  tonalElevation={3}
                  modifiers={[clip(Shapes.RoundedCorner(12))]}
                >
                  <Column
                    style={{ padding: 24 }}
                    spacing={4}
                    alignment="center"
                  >
                    <Text style={{ fontSize: 28, fontWeight: "700" }}>
                      {i + 1}
                    </Text>
                    <Text color={m3.onSurfaceVariant} style={{ fontSize: 13 }}>
                      {name}
                    </Text>
                  </Column>
                </Surface>
              ))}
            </HorizontalUncontainedCarousel>
          </SectionCard>

          <SectionHeader title="Horizontal Pager" />
          <SectionCard>
            <HorizontalPager
              pageSpacing={8}
              contentPadding={{ start: 16, end: 16 }}
              onCurrentPageChange={setPagerPage}
            >
              {["One", "Two", "Three", "Four"].map((name, i) => (
                <Surface
                  key={i}
                  tonalElevation={i + 1}
                  modifiers={[clip(Shapes.RoundedCorner(12))]}
                >
                  <Column
                    style={{ padding: 32 }}
                    spacing={4}
                    alignment="center"
                  >
                    <Text style={{ fontSize: 32, fontWeight: "700" }}>
                      {i + 1}
                    </Text>
                    <Text color={m3.onSurfaceVariant} style={{ fontSize: 14 }}>
                      Page {name}
                    </Text>
                  </Column>
                </Surface>
              ))}
            </HorizontalPager>
            <Text
              color={m3.onSurfaceVariant}
              style={{ fontSize: 13, textAlign: "center" }}
            >
              Page {pagerPage + 1} of 4
            </Text>
          </SectionCard>

          <SectionHeader title="Divider" />
          <SectionCard>
            <Row alignment="center" spacing={16}>
              <Text style={{ fontSize: 14 }}>Left</Text>
              <VerticalDivider thickness={1} color={m3.outlineVariant} />
              <Text style={{ fontSize: 14 }}>Center</Text>
              <VerticalDivider thickness={1} color={m3.outlineVariant} />
              <Text style={{ fontSize: 14 }}>Right</Text>
            </Row>
          </SectionCard>

          <SectionHeader title="Floating Toolbar" />
          <SectionCard>
            <HorizontalFloatingToolbar variant="vibrant">
              <Column spacing={4} alignment="center">
                <Icon
                  source={ContentCut}
                  size={24}
                  tint={m3.onSurfaceVariant}
                />
                <Text style={{ fontSize: 10 }}>Cut</Text>
              </Column>
              <Column spacing={4} alignment="center">
                <Icon
                  source={ContentCopy}
                  size={24}
                  tint={m3.onSurfaceVariant}
                />
                <Text style={{ fontSize: 10 }}>Copy</Text>
              </Column>
              <Column spacing={4} alignment="center">
                <Icon
                  source={ContentPaste}
                  size={24}
                  tint={m3.onSurfaceVariant}
                />
                <Text style={{ fontSize: 10 }}>Paste</Text>
              </Column>
              <Column spacing={4} alignment="center">
                <Icon source={SelectAll} size={24} tint={m3.onSurfaceVariant} />
                <Text style={{ fontSize: 10 }}>Select</Text>
              </Column>
              <HorizontalFloatingToolbar.FloatingActionButton>
                <Icon source={AddCircle} size={28} tint={m3.onSurfaceVariant} />
              </HorizontalFloatingToolbar.FloatingActionButton>
            </HorizontalFloatingToolbar>
          </SectionCard>

          <SectionHeader title="Progress" />
          <SectionCard>
            <Column spacing={12}>
              <Text style={{ fontSize: 13 }}>Linear determinate (65%)</Text>
              <LinearProgressIndicator progress={0.65} />
              <Text style={{ fontSize: 13 }}>Linear indeterminate</Text>
              <LinearProgressIndicator />
              <Row alignment="center" spacing={24}>
                <Column spacing={4} alignment="center">
                  <Text style={{ fontSize: 12 }}>Circular</Text>
                  <CircularProgressIndicator progress={0.75} />
                </Column>
                <Column spacing={4} alignment="center">
                  <Text style={{ fontSize: 12 }}>Indeterminate</Text>
                  <CircularProgressIndicator />
                </Column>
                <Column spacing={4} alignment="center">
                  <Text style={{ fontSize: 12 }}>Loading</Text>
                  <LoadingIndicator />
                </Column>
              </Row>
            </Column>
          </SectionCard>

          <SectionHeader title="Date & Time" />
          <SectionCard>
            <Column spacing={8}>
              <Text style={{ fontSize: 13 }}>Inline DateTimePicker</Text>
              <DateTimePicker
                initialDate={null}
                onDateSelected={(date) =>
                  setSelectedDate(date.toLocaleDateString())
                }
                variant="picker"
                color={m3.primary}
              />
              {selectedDate && (
                <Text style={{ fontSize: 12 }} color={m3.onSurfaceVariant}>
                  Selected: {selectedDate}
                </Text>
              )}
            </Column>
          </SectionCard>

          <SectionHeader title="Modal Bottom Sheet" />
          <SectionCard>
            <Column spacing={8}>
              <Text style={{ fontSize: 13 }}>
                A modal bottom sheet with interactive controls
              </Text>
              <Button onClick={() => setSheetOpen(true)}>
                <Text>Open Bottom Sheet</Text>
              </Button>
            </Column>
          </SectionCard>

          <SectionHeader title="Alert Dialog" />
          <SectionCard>
            <Column spacing={4}>
              <Text style={{ fontSize: 13 }}>
                A Material 3 alert dialog with icon, title, body, and actions
              </Text>
              <Button onClick={() => setAlertOpen(true)}>
                <Text>Show Alert</Text>
              </Button>
            </Column>
          </SectionCard>

          <SectionHeader title="Cards & Surface" />
          <SectionCard>
            <Card>
              <Column spacing={8} style={{ padding: 16 }}>
                <Text
                  color={m3.onSurfaceVariant}
                  style={{ fontSize: 16, fontWeight: "600" }}
                >
                  Material Card
                </Text>
                <Text color={m3.onSurfaceVariant} style={{ fontSize: 13 }}>
                  Card uses surface color from the seeded palette
                </Text>
              </Column>
            </Card>
            <Surface
              tonalElevation={3}
              // shape={{ type: "roundedCorner", radius: 12 }}
            >
              <Column spacing={4} style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: "600" }}>Surface</Text>
                <Text color={m3.onSurfaceVariant} style={{ fontSize: 13 }}>
                  With tonalElevation=3
                </Text>
              </Column>
            </Surface>
          </SectionCard>

          <SectionHeader title="Product Card" />
          <BoxWrapper>
            <RNHostView matchContents modifiers={[fillMaxWidth()]}>
              <Pressable onPress={() => {}}>
                <View
                  style={{
                    backgroundColor: m3.surfaceContainerLow ?? m3.surface,
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    source={{
                      uri: "https://picsum.photos/seed/headphones/400/300",
                    }}
                    style={{ width: "100%", height: 200 }}
                    resizeMode="cover"
                  />
                  <View style={{ padding: 16, gap: 12 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor:
                            m3.secondaryContainer ?? m3.surfaceVariant,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                      >
                        <RNText
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: m3.onSecondaryContainer ?? m3.onSurface,
                          }}
                        >
                          NEW
                        </RNText>
                      </View>
                      <RNText
                        style={{ fontSize: 12, color: m3.onSurfaceVariant }}
                      >
                        Electronics
                      </RNText>
                    </View>
                    <RNText
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: m3.onSurface,
                      }}
                    >
                      Wireless Headphones Pro
                    </RNText>
                    <RNText
                      style={{
                        fontSize: 14,
                        lineHeight: 20,
                        color: m3.onSurfaceVariant,
                      }}
                    >
                      Premium sound with active noise cancellation and 40-hour
                      battery life.
                    </RNText>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((i) => (
                        <RNText
                          key={i}
                          style={{ fontSize: 16, color: "#FFB300" }}
                        >
                          {"\u2605"}
                        </RNText>
                      ))}
                      <RNText
                        style={{
                          fontSize: 13,
                          color: m3.onSurfaceVariant,
                          marginLeft: 4,
                        }}
                      >
                        4.9 (128 reviews)
                      </RNText>
                    </View>
                    <View
                      style={{
                        height: 0.5,
                        backgroundColor:
                          m3.outlineVariant ?? "rgba(128,128,128,0.3)",
                      }}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <RNText
                        style={{
                          fontSize: 22,
                          fontWeight: "700",
                          color: m3.onSurface,
                        }}
                      >
                        $299.00
                      </RNText>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: m3.primary,
                          paddingVertical: 10,
                          borderRadius: 20,
                          alignItems: "center",
                        }}
                      >
                        <RNText
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: m3.onPrimary,
                          }}
                        >
                          Add to Cart
                        </RNText>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            </RNHostView>
          </BoxWrapper>

          <SectionHeader title="Badge" />
          <SectionCard>
            <Row alignment="center" spacing={32}>
              <Column spacing={4} alignment="center">
                <Badge />
                <Text style={{ fontSize: 12 }}>Dot</Text>
              </Column>
              <Column spacing={4} alignment="center">
                <Badge>
                  <Text style={{ fontSize: 10, fontWeight: "700" }}>3</Text>
                </Badge>
                <Text style={{ fontSize: 12 }}>Count</Text>
              </Column>
              <Column spacing={4} alignment="center">
                <Badge>
                  <Text style={{ fontSize: 10, fontWeight: "700" }}>99+</Text>
                </Badge>
                <Text style={{ fontSize: 12 }}>Overflow</Text>
              </Column>
            </Row>
          </SectionCard>

          <SectionHeader title="List Item" />
          <SectionCard>
            <ListItem>
              <ListItem.HeadlineContent>
                <Text>Headline Text</Text>
              </ListItem.HeadlineContent>
              <ListItem.SupportingContent>
                <Text style={{ fontSize: 12 }}>Supporting detail text</Text>
              </ListItem.SupportingContent>
            </ListItem>
            <HorizontalDivider />
            <ListItem>
              <ListItem.HeadlineContent>
                <Text>With Trailing</Text>
              </ListItem.HeadlineContent>
              <ListItem.TrailingContent>
                <Text color={m3.onSurfaceVariant} style={{ fontSize: 12 }}>
                  Trailing
                </Text>
              </ListItem.TrailingContent>
            </ListItem>
          </SectionCard>

          <Row style={{ padding: 16, paddingBottom: 8 }} alignment="center">
            <Column spacing={0} alignment={"center"}>
              <Text
                color={m3.onSurfaceVariant}
                style={{
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                Jetpack Compose · @expo/ui v57
              </Text>
            </Column>
          </Row>
        </LazyColumn>
        {alertOpen && (
          <AlertDialog onDismissRequest={() => setAlertOpen(false)}>
            <AlertDialog.Icon>
              <Icon source={Info} size={28} tint={m3.onSurfaceVariant} />
            </AlertDialog.Icon>
            <AlertDialog.Title>
              <Text style={{ fontSize: 20, fontWeight: "600" }}>
                Confirmation
              </Text>
            </AlertDialog.Title>
            <AlertDialog.Text>
              <Text color={m3.onSurfaceVariant}>
                This demonstrates a Material 3 alert dialog with slot-based
                content. Press confirm to dismiss.
              </Text>
            </AlertDialog.Text>
            <AlertDialog.ConfirmButton>
              <Button onClick={() => setAlertOpen(false)}>
                <Text>Confirm</Text>
              </Button>
            </AlertDialog.ConfirmButton>
            <AlertDialog.DismissButton>
              <Button onClick={() => setAlertOpen(false)}>
                <Text>Cancel</Text>
              </Button>
            </AlertDialog.DismissButton>
          </AlertDialog>
        )}
        {sheetOpen && (
          <ModalBottomSheet
            onDismissRequest={() => setSheetOpen(false)}
            showDragHandle
          >
            <Column spacing={16} style={{ padding: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: "600" }}>
                Bottom Sheet
              </Text>
              <Text color={m3.onSurfaceVariant} style={{ fontSize: 14 }}>
                This sheet contains components that inherit the seedColor
                palette.
              </Text>
              <ControlRow label="Toggle">
                <Switch value={switchOn} onCheckedChange={setSwitchOn} />
              </ControlRow>
              <ControlRow label="Check">
                <Checkbox value={checked} onCheckedChange={setChecked} />
              </ControlRow>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                min={0}
                max={1}
              />
              <Button onClick={() => setSheetOpen(false)}>
                <Text>Close</Text>
              </Button>
            </Column>
          </ModalBottomSheet>
        )}
      </Host>
    </View>
  );
}
