import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";
import { usePathname, useSegments } from "expo-router";
import { useMemo } from "react";

const staticPathList = [
  "/scan*",
  "/report",
  "/accounting",
  "/customers",
  "/notifications",
  "/store",
  "/store-profile",
  "/discounts",
  "/staff-roles",
  "/add-product",
  "/ai",
  "/profile",
  "/tenant-activity-logs",
  "/open-carts",
];

// literal segment patterns, matched against useSegments()
const dynamicSegmentList = [
  ["(inventory)", "[id]"],
  ["(orders)", "[id]"],
  ["(more)", "[storeId]"],
  ["(more)", "document", "[id]"],
  ["(more)", "open-carts", "[id]"],
];

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|\\]/g, "\\$&")
    .replace(/\*$/, ".*")
    .replace(/\[[^\]]+\]/g, "[^/]+");
  return new RegExp(`^${escaped}$`);
}

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const pathname = usePathname();
  const segments = useSegments();

  const compiledStaticPatterns = useMemo(
    () => staticPathList.map((p) => patternToRegex(p)),
    [],
  );

  const shouldHideTabBar = useMemo(() => {
    const matchesStatic = compiledStaticPatterns.some((re) =>
      re.test(pathname),
    );

    const matchesDynamic = dynamicSegmentList.some((patternSegs) => {
      if (patternSegs.length > segments.length) return false;
      // check the tail of `segments` matches `patternSegs`
      const tail = segments.slice(segments.length - patternSegs.length);
      return patternSegs.every((seg, i) => tail[i] === seg);
    });

    return matchesStatic || matchesDynamic;
  }, [pathname, segments, compiledStaticPatterns]);

  return (
    <NativeTabs
      hidden={shouldHideTabBar}
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.card } }}
      rippleColor={colors.backgroundElement}
    >
      <NativeTabs.Trigger name="(pos)">
        <NativeTabs.Trigger.Label hidden>POS</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cart.fill" md={"home"} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(orders)">
        <NativeTabs.Trigger.Label hidden>Orders</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md={"orders"} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(dashboard)">
        <NativeTabs.Trigger.Label hidden>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md={"bar_chart"} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(inventory)">
        <NativeTabs.Trigger.Label hidden>Inventory</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="shippingbox" md={"inventory_2"} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(more)">
        <NativeTabs.Trigger.Label hidden>More</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.clipboard" md={"more_vert"} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
