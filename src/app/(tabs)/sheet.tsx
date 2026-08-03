import { Host, Icon, List, ListItem } from "@expo/ui";
import { background } from "@expo/ui/jetpack-compose/modifiers";
import { SafeAreaView } from "react-native-safe-area-context";

const CHEVRON = Icon.select({
  ios: "chevron.right",
  android: require("@expo/material-symbols/chevron_right.xml"),
});

export default function ListItemSlotsExample() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Host style={{ flex: 1 }}>
        <List>
          <ListItem
            modifiers={[background("red")]}
            onPress={() => {}}
            trailing={<Icon name={CHEVRON} size={14} color="gray" />}
            supportingText="Secondary line below the headline"
          >
            Profile
          </ListItem>
          <ListItem
            onPress={() => {}}
            trailing={<Icon name={CHEVRON} size={14} color="gray" />}
          >
            Settings
          </ListItem>
        </List>
      </Host>
    </SafeAreaView>
  );
}
