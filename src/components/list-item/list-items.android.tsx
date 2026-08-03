import { Colors } from "@/constants/theme";
import { Icon } from "@expo/ui";
import { ListItem, Text } from "@expo/ui/jetpack-compose";
import React from "react";
import { useColorScheme } from "react-native";

interface ListItemProps {
  leadingIcon: React.ReactNode;
  trailingIcon: React.ReactNode;
  label: string;
}

export default function AppListItem() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  return (
    <ListItem colors={{ containerColor: colors.card }}>
      <ListItem.HeadlineContent>
        <Text>Notifications</Text>
      </ListItem.HeadlineContent>
      <ListItem.OverlineContent>
        <Text>ACCOUNT</Text>
      </ListItem.OverlineContent>
      <ListItem.SupportingContent>
        <Text>Manage notification preferences</Text>
      </ListItem.SupportingContent>
      <ListItem.LeadingContent>
        <Icon
          name={Icon.select({
            ios: "star.fill",
            android: import("@expo/material-symbols/star.xml"),
          })}
          size={32}
          color="purple"
        />
      </ListItem.LeadingContent>
      <ListItem.TrailingContent>
        <Icon
          name={Icon.select({
            ios: "star.fill",
            android: import("@expo/material-symbols/star.xml"),
          })}
          size={32}
          color="green"
        />
      </ListItem.TrailingContent>
    </ListItem>
  );
}
