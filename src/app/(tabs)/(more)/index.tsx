import { fetchMe, toggleAutoCreateCart } from "@/api/auth";
import LinkItem from "@/components/link-item";
import MoreCard from "@/components/MoreCard";
import { Colors } from "@/constants/theme";
import { useSession } from "@/lib/ctx";
import { Host, Switch } from "@expo/ui";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const more = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const { signOut, user, updateUser } = useSession();

  const { mutate: toggleCart } = useMutation({
    mutationFn: toggleAutoCreateCart,
    onMutate: async () => {
      if (!user) return;
      const prev = { ...user };
      updateUser({ ...user, auto_create_cart: !user.auto_create_cart });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) updateUser(context.prev);
    },
    onSuccess: async () => {
      try {
        const me = await fetchMe();
        if (me) updateUser(me);
      } catch {}
    },
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 20,
        gap: 15,
      }}
      showsVerticalScrollIndicator={false}
    >
      <MoreCard label="Store">
        <LinkItem
          label="Store Profile"
          leadingIcon="building-2"
          onPress={() => router.push("/(tabs)/(more)/store-profile")}
        />
        <LinkItem
          label="User Profile"
          leadingIcon="user-circle"
          onPress={() => router.push("/(tabs)/(more)/profile")}
        />
        <LinkItem
          label="Employees & Roles"
          leadingIcon="users-round"
          onPress={() => router.push("/(tabs)/(more)/staff-roles")}
        />
        <LinkItem
          label="Stores"
          leadingIcon="store"
          onPress={() => router.push("/(tabs)/(more)/store")}
        />
        <LinkItem
          label="Discounts & Coupons"
          leadingIcon="percent"
          onPress={() => router.push("/(tabs)/(more)/discounts")}
        />
        <LinkItem
          label="Subscriptions"
          leadingIcon="calendar"
          onPress={() => router.push("/(tabs)/(more)/subscription")}
        />
        <LinkItem
          label="Customers"
          leadingIcon="users-round"
          onPress={() => router.push("/(tabs)/(more)/customers")}
        />
      </MoreCard>

      <MoreCard label="POS">
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View
              style={[styles.settingIcon, { backgroundColor: "#3b82f615" }]}
            >
              <Lucide name="shopping-cart" size={18} color="#3b82f6" />
            </View>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Auto-Create Cart
              </Text>
              <Text
                style={[styles.settingHint, { color: colors.textSecondary }]}
              >
                Generate cart without customer info
              </Text>
            </View>
          </View>
          <Host matchContents>
            <Switch
              value={user?.auto_create_cart ?? false}
              onValueChange={() => toggleCart()}
            />
          </Host>
        </View>
      </MoreCard>

      <MoreCard label="Payments & Accounting">
        <LinkItem
          label="Accounting"
          leadingIcon={"scale"}
          onPress={() => router.push("/(tabs)/(more)/accounting")}
        />
        <LinkItem label="Payment Methods" leadingIcon={"credit-card"} />
        <LinkItem label="Tax Settings" leadingIcon={"coins"} />
        <LinkItem
          label="Documments"
          docType="Receipt | Invoce | Quote"
          leadingIcon={"printer"}
          onPress={() => router.push("/(tabs)/(more)/document")}
        />
        <LinkItem
          label="Reports"
          leadingIcon={"bar-chart"}
          onPress={() => router.push("/(tabs)/(more)/report")}
        />
      </MoreCard>
      <MoreCard label="Logs">
        <LinkItem
          label="Activity Logs"
          leadingIcon={"logs"}
          onPress={() => router.push("/(tabs)/(more)/tenant-activity-logs")}
        />
        <LinkItem
          label="Open Carts"
          leadingIcon={"shopping-cart"}
          onPress={() => router.push("/(tabs)/(more)/open-carts")}
        />
      </MoreCard>
      <MoreCard label="Account">
        <LinkItem
          label="Notification"
          leadingIcon="bell"
          onPress={() => router.push("/(tabs)/(more)/notifications")}
        />

        <LinkItem label="Help & Support" leadingIcon={"circle-question-mark"} />
        <LinkItem label="Log Out" leadingIcon={"log-out"} onPress={signOut} />
      </MoreCard>
    </ScrollView>
  );
};

export default more;

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: { fontSize: 12, fontWeight: "600" },
  settingHint: { fontSize: 10, marginTop: 2 },
});
