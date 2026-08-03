import { Colors } from "@/constants/theme";
import { useLocalSearchParams } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type OrderStatus = "Completed" | "Pending" | "Voided";

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderDetail {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  date: string;
  customer: string;
  phone: string;
  paymentMethod: string;
  reference: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  amountTendered: number;
  voidedBy?: string;
  voidedAt?: string;
  voidReason?: string;
}

const mockOrders: Record<number, OrderDetail> = {
  1: {
    id: 1,
    orderNumber: "455",
    status: "Completed",
    date: "11:52, July 31",
    customer: "Walk-in Customer",
    phone: "+234 800 000 0000",
    paymentMethod: "Cash",
    reference: "TXN-455-88213",
    items: [
      { name: "Jollof Rice & Chicken", quantity: 2, unitPrice: 1200 },
      { name: "Bottled Water", quantity: 3, unitPrice: 250 },
      { name: "Plantain Chips", quantity: 1, unitPrice: 700 },
    ],
    subtotal: 3850,
    discount: 0,
    tax: 0,
    amountTendered: 5000,
  },
  2: {
    id: 2,
    orderNumber: "253",
    status: "Pending",
    date: "11:52, July 29",
    customer: "Walk-in Customer",
    phone: "+234 800 000 0000",
    paymentMethod: "Card",
    reference: "TXN-253-11708",
    items: [
      { name: "Groceries Pack", quantity: 1, unitPrice: 6500 },
      { name: "Soap Bar", quantity: 6, unitPrice: 250 },
      { name: "Detergent", quantity: 5, unitPrice: 170 },
    ],
    subtotal: 8850,
    discount: 0,
    tax: 0,
    amountTendered: 10000,
  },
  3: {
    id: 3,
    orderNumber: "453",
    status: "Voided",
    date: "11:52, July 30",
    customer: "Walk-in Customer",
    phone: "+234 800 000 0000",
    paymentMethod: "Transfer",
    reference: "TXN-453-55241",
    items: [
      { name: "Soft Drink (Can)", quantity: 5, unitPrice: 350 },
      { name: "Snack Pack", quantity: 2, unitPrice: 1050 },
    ],
    subtotal: 3850,
    discount: 0,
    tax: 0,
    amountTendered: 0,
    voidedBy: "Amaka Okonkwo",
    voidedAt: "3:22 PM, July 30",
    voidReason: "Customer changed mind",
  },
};

const statusStyles: Record<
  OrderStatus,
  { color: string; background: string }
> = {
  Completed: { color: "#1a7f37", background: "rgba(178, 248, 205, 0.9)" },
  Pending: { color: "#9a6700", background: "rgba(255, 224, 138, 0.9)" },
  Voided: { color: "#cf222e", background: "rgba(255, 179, 179, 0.9)" },
};

const OrderDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const order = mockOrders[Number(id)] ?? mockOrders[1];
  const statusStyle = statusStyles[order.status];
  const total = order.subtotal - order.discount + order.tax;
  const change = Math.max(0, order.amountTendered - total);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[styles.card, styles.headerCard, { backgroundColor: colors.card }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.orderNumber, { color: colors.text }]}>
              #ORD-{order.orderNumber}
            </Text>
            <Text style={[styles.headerMeta, { color: colors.textSecondary }]}>
              {order.date}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.background },
            ]}
          >
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {order.status}
            </Text>
          </View>
        </View>
        <View
          style={[styles.divider, { backgroundColor: colors.backgroundElement }]}
        />
        <View style={styles.headerFooter}>
          <View>
            <Text style={styles.sectionLabel}>Customer</Text>
            <Text style={[styles.customerName, { color: colors.text }]}>
              {order.customer}
            </Text>
          </View>
          <View style={styles.headerTotal}>
            <Text style={styles.sectionLabel}>Total</Text>
            <Text style={[styles.headerPrice, { color: colors.text }]}>
              NGN {total.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Payment
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Row label="Customer" value={order.customer} />
        <Row label="Phone" value={order.phone} />
        <Row label="Payment method" value={order.paymentMethod} />
        <Row label="Reference" value={order.reference} last />
      </View>

      {order.status === "Voided" && order.voidedBy && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Void Details
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Row label="Voided by" value={order.voidedBy} />
            <Row label="Voided at" value={order.voidedAt ?? "—"} />
            <Row label="Reason" value={order.voidReason ?? "—"} last />
          </View>
        </>
      )}

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Items ({order.items.length})
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {order.items.map((item, index) => (
          <View
            key={item.name}
            style={[
              styles.itemRow,
              index < order.items.length - 1 && styles.rowDivider,
            ]}
          >
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                {item.quantity} × NGN {item.unitPrice.toLocaleString()}
              </Text>
            </View>
            <Text style={[styles.itemTotal, { color: colors.text }]}>
              NGN {(item.quantity * item.unitPrice).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Summary
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Row label="Subtotal" value={`NGN ${order.subtotal.toLocaleString()}`} />
        {order.discount > 0 && (
          <Row
            label="Discount"
            value={`- NGN ${order.discount.toLocaleString()}`}
          />
        )}
        <Row label="Tax" value={`NGN ${order.tax.toLocaleString()}`} />
        <View
          style={[styles.divider, { backgroundColor: colors.backgroundElement }]}
        />
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[styles.grandTotal, { color: colors.text }]}>
            NGN {total.toLocaleString()}
          </Text>
        </View>
        {order.amountTendered > 0 && (
          <>
            <View
              style={[
                styles.divider,
                { backgroundColor: colors.backgroundElement },
              ]}
            />
            <Row
              label="Amount Tendered"
              value={`NGN ${order.amountTendered.toLocaleString()}`}
            />
            <Row label="Change" value={`NGN ${change.toLocaleString()}`} last />
          </>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => {}}
      >
        <Text style={styles.primaryButtonText}>Share receipt</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.secondaryButton,
          { borderColor: colors.backgroundSelected },
          pressed && styles.buttonPressed,
        ]}
        onPress={() => {}}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
          Print receipt
        </Text>
      </Pressable>
      {order.status === "Pending" && (
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.backgroundSelected },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => {}}
        >
          <Text style={styles.voidButtonText}>Void order</Text>
        </Pressable>
      )}
    </ScrollView>
  );
};

const Row = ({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
};

export default OrderDetails;

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  headerCard: { gap: 14 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderNumber: { fontSize: 20, fontWeight: "700" },
  headerMeta: { fontSize: 13, marginTop: 4 },
  statusBadge: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  divider: { height: 1, alignSelf: "stretch" },
  headerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTotal: { alignItems: "flex-end" },
  customerName: { fontSize: 16, fontWeight: "600", marginTop: 3 },
  headerPrice: { fontSize: 18, fontWeight: "700", marginTop: 3 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#aaa",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(120, 120, 120, 0.2)",
  },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: "600" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  itemInfo: { flex: 1, paddingRight: 12, gap: 3 },
  itemName: { fontSize: 15, fontWeight: "600" },
  itemQty: { fontSize: 13 },
  itemTotal: { fontSize: 14, fontWeight: "700" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  grandTotal: { fontSize: 20, fontWeight: "800" },
  primaryButton: {
    backgroundColor: "#2f7df6",
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 10,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: "600" },
  voidButtonText: { fontSize: 15, fontWeight: "700", color: "#cf222e" },
  buttonPressed: { opacity: 0.6 },
});
