import LinkItem from "@/components/link-item";
import MoreCard from "@/components/MoreCard";
import { Colors } from "@/constants/theme";
import { useSession } from "@/lib/ctx";
import { router } from "expo-router";
import { ScrollView, StyleSheet, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const more = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const { signOut } = useSession();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 20,
        gap: 10,
      }}
      showsVerticalScrollIndicator={false}
    >
      <MoreCard label="Store">
        <LinkItem
          label="Store Profile"
          leadingIcon="user"
          onPress={() => router.push("/(tabs)/(more)/store-profile")}
        />
        <LinkItem
          label="Employees & Roles"
          leadingIcon="users"
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

      {/* <MoreCard label="AI">
        <LinkItem
          label="Chat"
          leadingIcon={"message-circle"}
          onPress={() => router.push("/(tabs)/(more)/ai")}
        />
      </MoreCard> */}
      <MoreCard label="Payments & Accounting">
        <LinkItem
          label="Accounting"
          leadingIcon={"table"}
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

const styles = StyleSheet.create({});
