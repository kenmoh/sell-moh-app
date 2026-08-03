import OrderCard from "@/components/order-card";
import AView from "@/components/view";
import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type FilterStatus = "All" | "Pending" | "Completed" | "Voided";

const filters: FilterStatus[] = ["All", "Pending", "Completed", "Voided"];

const orders = [
  {
    id: 1,
    status: "Completed",
    itemCount: 3,
    orderNumber: "455",
    price: 3850,
    date: "11:52, July 31",
  },
  {
    id: 2,
    status: "Pending",
    itemCount: 12,
    orderNumber: "253",
    price: 8850,
    date: "11:52, July 29",
  },
  {
    id: 3,
    status: "Voided",
    itemCount: 5,
    orderNumber: "453",
    price: 3850,
    date: "11:52, July 30",
  },
];

const index = () => {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("All");
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const filteredOrders =
    activeFilter === "All"
      ? orders
      : orders.filter((o) => o.status === activeFilter);

  return (
    <AView>
      <View style={[styles.pills, { backgroundColor: colors.background }]}>
        {filters.map((filter) => {
          const isActive = filter === activeFilter;
          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive
                    ? colors.text
                    : colors.backgroundElement,
                },
              ]}
            >
              <Text
                style={{
                  color: isActive ? colors.background : colors.textSecondary,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.list, { backgroundColor: colors.background }]}>
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            status={order.status as "Completed" | "Pending" | "Voided"}
            itemCount={order.itemCount}
            orderNumber={order.orderNumber}
            price={order.price}
            date={order.date}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/(orders)/[id]",
                params: {
                  id: order.id,
                },
              })
            }
          />
        ))}
        {filteredOrders.length === 0 && (
          <Text
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 40,
              fontSize: 15,
            }}
          >
            No {activeFilter.toLowerCase()} orders
          </Text>
        )}
      </View>
    </AView>
  );
};

export default index;

const styles = StyleSheet.create({
  pills: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: { gap: 0 },
});
