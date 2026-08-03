import { Colors } from "@/constants/theme";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type OrderStatus = "Completed" | "Pending" | "Voided";

const statusStyles: Record<
  OrderStatus,
  { color: string; background: string }
> = {
  Completed: { color: "#1a7f37", background: "rgba(178, 248, 205, 0.9)" },
  Pending: { color: "#9a6700", background: "rgba(255, 224, 138, 0.9)" },
  Voided: { color: "#cf222e", background: "rgba(255, 179, 179, 0.9)" },
};

interface OrderCardProps {
  orderNumber: string;
  customer?: string;
  itemCount: number;
  price: number;
  status: OrderStatus;
  date: string;
  onPress: () => void;
}

const OrderCard = ({
  orderNumber,
  date,
  itemCount,
  price,
  status,
  onPress,
  customer = "Walk-in Customer",
}: OrderCardProps) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: 10,
        padding: 12,
        backgroundColor: colors.card,
        elevation: 1,
        width: "90%",
        alignSelf: "center",
        marginVertical: 5,
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <View style={styles.container}>
        <Text style={[styles.headingText, { color: colors.text }]}>
          #ORD-{orderNumber}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
          {customer}
        </Text>
        <Text style={styles.footerText}>
          {itemCount} {itemCount > 1 ? "Items" : "Item"}
        </Text>
      </View>
      <View style={styles.container}>
        <Text style={[styles.headingText, { color: colors.text }]}>
          NGN {price}
        </Text>
        <Text
          style={{
            color: statusStyles[status].color,
            backgroundColor: statusStyles[status].background,
            paddingVertical: 2.5,
            textAlign: "center",
            paddingHorizontal: 5,
            borderRadius: 10,
          }}
        >
          {status}
        </Text>
        <Text style={styles.footerText}>{date}</Text>
      </View>
    </Pressable>
  );
};

export default OrderCard;

const styles = StyleSheet.create({
  headingText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#bbb",
  },
  container: {
    gap: 5,
  },
});
