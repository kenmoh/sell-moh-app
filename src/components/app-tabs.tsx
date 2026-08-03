import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.card}
      labelStyle={{ selected: { color: colors.textSecondary } }}
    >
      <NativeTabs.Trigger name="(pos)">
        <NativeTabs.Trigger.Label>POS</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cart.fill" md={"home"} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(orders)">
        <NativeTabs.Trigger.Label>Orders</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md={"orders"} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(dashboard)">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md={"bar_chart"} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(inventory)">
        <NativeTabs.Trigger.Label>Inventory</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="shippingbox" md={"inventory_2"} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(more)">
        <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.clipboard" md={"more_vert"} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
