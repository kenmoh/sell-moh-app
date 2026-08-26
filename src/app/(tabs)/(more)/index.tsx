import LinkItem from "@/components/link-item";
import MoreCard from "@/components/MoreCard";
import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import { ScrollView, StyleSheet, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const more = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
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
          leadingIcon="store"
          onPress={() => router.push("/(tabs)/(more)/store-profile")}
        />
        <LinkItem
          label="Employees & Roles"
          leadingIcon="users"
          onPress={() => router.push("/(tabs)/(more)/staff-roles")}
        />
        {/* <LinkItem
          label="Product & Categories"
          leadingIcon="tags"
          onPress={() => router.push("/(tabs)/(more)/products")}
        /> */}
        <LinkItem
          label="Discounts & Coupons"
          leadingIcon="percent"
          onPress={() => router.push("/(tabs)/(more)/discounts")}
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
      </MoreCard>
      <MoreCard label="Account">
        <LinkItem
          label="Notification"
          leadingIcon="bell"
          onPress={() => router.push("/(tabs)/(more)/notifications")}
        />
        <LinkItem label="Security & Pin" leadingIcon={"shield"} />
        <LinkItem label="Help & Support" leadingIcon={"circle-question-mark"} />
      </MoreCard>
    </ScrollView>
  );
};

export default more;

const styles = StyleSheet.create({});
