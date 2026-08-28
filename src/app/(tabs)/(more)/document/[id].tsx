import AppView from "@/components/app-view";
import { Colors } from "@/constants/theme";
import { DocumentResponse } from "@/types/document-types";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useLocalSearchParams } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const statusConfig: Record<string, { color: string; bg: string }> = {
  draft: { color: "#6B7280", bg: "rgba(107, 114, 128, 0.12)" },
  pending: { color: "#D97706", bg: "rgba(217, 119, 6, 0.12)" },
  paid: { color: "#059669", bg: "rgba(5, 150, 105, 0.12)" },
  voided: { color: "#DC2626", bg: "rgba(220, 38, 38, 0.12)" },
  sent: { color: "#2563EB", bg: "rgba(37, 99, 235, 0.12)" },
};

const typeConfig: Record<
  string,
  { icon: string; color: string; bg: string; label: string }
> = {
  invoice: {
    icon: "file-text",
    color: "#2563EB",
    bg: "rgba(37, 99, 235, 0.12)",
    label: "Invoice",
  },
  quote: {
    icon: "receipt",
    color: "#7C3AED",
    bg: "rgba(124, 58, 237, 0.12)",
    label: "Quote",
  },
  receipt: {
    icon: "check-circle",
    color: "#059669",
    bg: "rgba(5, 150, 105, 0.12)",
    label: "Receipt",
  },
  purchase_order: {
    icon: "shopping-bag",
    color: "#D97706",
    bg: "rgba(217, 119, 6, 0.12)",
    label: "Purchase Order",
  },
};

const MOCK_DOCS: Record<
  string,
  DocumentResponse & {
    customer_name?: string;
    items: {
      description: string;
      qty: number;
      unit_price: number;
      discount_pct?: number;
      tax_rate?: number;
    }[];
  }
> = {
  "1": {
    id: "1",
    tenant_id: "t1",
    doc_number: "INV-001",
    doc_type: "invoice",
    status: "paid",
    subtotal: 170000,
    discount: 8500,
    tax: 12750,
    total: 174250,
    item_count: 2,
    due_date: "2026-09-15",
    customer_name: "John Doe",
    items: [
      {
        description: "Samsung Galaxy A14 - Black, 128GB",
        qty: 2,
        unit_price: 85000,
        discount_pct: 5,
        tax_rate: 7.5,
      },
      {
        description: "Screen Protector",
        qty: 2,
        unit_price: 2500,
        tax_rate: 7.5,
      },
    ],
  },
  "2": {
    id: "2",
    tenant_id: "t1",
    doc_number: "QUO-003",
    doc_type: "quote",
    status: "sent",
    subtotal: 45000,
    discount: 0,
    tax: 3375,
    total: 48375,
    item_count: 3,
    customer_name: "Acme Corp",
    items: [
      {
        description: "Office Chair - Ergonomic",
        qty: 3,
        unit_price: 15000,
        tax_rate: 7.5,
      },
    ],
  },
  "3": {
    id: "3",
    tenant_id: "t1",
    doc_number: "REC-012",
    doc_type: "receipt",
    status: "paid",
    subtotal: 12500,
    discount: 0,
    tax: 937,
    total: 13437,
    item_count: 1,
    customer_name: "Jane Smith",
    items: [
      {
        description: "Coca-Cola 50cl (Pack of 12)",
        qty: 1,
        unit_price: 12500,
        tax_rate: 7.5,
      },
    ],
  },
  "4": {
    id: "4",
    tenant_id: "t1",
    doc_number: "INV-002",
    doc_type: "invoice",
    status: "pending",
    subtotal: 85000,
    discount: 5000,
    tax: 6000,
    total: 86000,
    item_count: 4,
    due_date: "2026-09-30",
    customer_name: "Bob Williams",
    items: [
      {
        description: "Bluetooth Earbuds Pro",
        qty: 1,
        unit_price: 25000,
        tax_rate: 7.5,
      },
      {
        description: "Phone Case - Clear",
        qty: 2,
        unit_price: 3000,
        tax_rate: 7.5,
      },
      {
        description: "Charger Cable USB-C",
        qty: 2,
        unit_price: 5000,
        discount_pct: 10,
        tax_rate: 7.5,
      },
    ],
  },
  "5": {
    id: "5",
    tenant_id: "t1",
    doc_number: "INV-003",
    doc_type: "invoice",
    status: "voided",
    subtotal: 25000,
    discount: 0,
    tax: 1875,
    total: 26875,
    item_count: 1,
    customer_name: "Void Customer",
    items: [
      {
        description: "Dettol Antiseptic 250ml",
        qty: 5,
        unit_price: 5000,
        tax_rate: 7.5,
      },
    ],
  },
  "6": {
    id: "6",
    tenant_id: "t1",
    doc_number: "QUO-004",
    doc_type: "quote",
    status: "draft",
    subtotal: 320000,
    discount: 15000,
    tax: 23250,
    total: 330250,
    item_count: 5,
    customer_name: "Big Buyer Ltd",
    items: [
      {
        description: "Golden Penny Semovita 5kg",
        qty: 10,
        unit_price: 8000,
        tax_rate: 7.5,
      },
      {
        description: "Indomie Chicken 70g (Carton)",
        qty: 5,
        unit_price: 24000,
        discount_pct: 5,
        tax_rate: 7.5,
      },
    ],
  },
};

const formatCurrency = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const DocumentDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const doc = MOCK_DOCS[id || "1"];
  if (!doc) {
    return (
      <AppView>
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Document not found</Text>
        </View>
      </AppView>
    );
  }

  const type = typeConfig[doc.doc_type];
  const status = statusConfig[doc.status] || statusConfig.draft;

  return (
    <AppView>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Doc Identity Card */}
        <View
          style={[
            styles.identityCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.backgroundSelected,
            },
          ]}
        >
          <View style={styles.identityTop}>
            <View style={[styles.typeBadge, { backgroundColor: type.bg }]}>
              <Lucide name={type.icon as any} size={16} color={type.color} />
              <Text style={[styles.typeLabel, { color: type.color }]}>
                {type.label}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <View
                style={[styles.statusDot, { backgroundColor: status.color }]}
              />
              <Text style={[styles.statusLabel, { color: status.color }]}>
                {doc.status}
              </Text>
            </View>
          </View>

          <Text style={[styles.docNumber, { color: colors.text }]}>
            {doc.doc_number}
          </Text>

          {doc.customer_name && (
            <View style={styles.customerRow}>
              <Lucide name="user" size={14} color={colors.textSecondary} />
              <Text
                style={[styles.customerName, { color: colors.textSecondary }]}
              >
                {doc.customer_name}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.totalRow,
              { borderTopColor: colors.backgroundSelected },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              {formatCurrency(doc.total)}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.card,
              borderColor: colors.backgroundSelected,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Items ({doc.item_count})
          </Text>
          {doc.items.map((item, i) => (
            <View
              key={i}
              style={[
                styles.itemRow,
                i < doc.items.length - 1 && {
                  borderBottomColor: colors.backgroundSelected,
                  borderBottomWidth: 1,
                },
              ]}
            >
              <View style={styles.itemLeft}>
                <Text style={[styles.itemDesc, { color: colors.text }]}>
                  {item.description}
                </Text>
                <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                  {item.qty} × {formatCurrency(item.unit_price)}
                  {item.discount_pct ? ` (-${item.discount_pct}%)` : ""}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: colors.text }]}>
                {formatCurrency(
                  item.qty *
                    item.unit_price *
                    (1 - (item.discount_pct || 0) / 100),
                )}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.card,
              borderColor: colors.backgroundSelected,
            },
          ]}
        >
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Subtotal
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatCurrency(doc.subtotal)}
            </Text>
          </View>
          {doc.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: colors.textSecondary }]}
              >
                Discount
              </Text>
              <Text style={[styles.summaryValue, { color: "#DC2626" }]}>
                -{formatCurrency(doc.discount)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Tax
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatCurrency(doc.tax)}
            </Text>
          </View>
          <View
            style={[
              styles.summaryRow,
              styles.totalSummary,
              { borderTopColor: colors.backgroundSelected },
            ]}
          >
            <Text style={[styles.totalSummaryLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalSummaryValue, { color: colors.text }]}>
              {formatCurrency(doc.total)}
            </Text>
          </View>
        </View>

        {/* Info */}
        {(doc.due_date || doc.linked_sale_id) && (
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.card,
                borderColor: colors.backgroundSelected,
              },
            ]}
          >
            {doc.due_date && (
              <View style={styles.infoRow}>
                <Lucide
                  name="calendar"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Due Date
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {new Date(doc.due_date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
            )}
            {doc.linked_sale_id && (
              <View style={styles.infoRow}>
                <Lucide name="link" size={16} color={colors.textSecondary} />
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Linked Sale
                </Text>
                <Text
                  style={[styles.infoValue, { color: colors.buttonPrimary }]}
                >
                  {doc.linked_sale_id}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </AppView>
  );
};

export default DocumentDetailScreen;

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backBtnWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  identityCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  identityTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  docNumber: {
    fontSize: 22,
    fontWeight: "700",
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  customerName: {
    fontSize: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    gap: 12,
  },
  itemLeft: {
    flex: 1,
    gap: 4,
  },
  itemDesc: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemQty: {
    fontSize: 12,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  totalSummary: {
    borderTopWidth: 1,
    paddingTop: 10,
  },
  totalSummaryLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  totalSummaryValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: "auto",
  },
});
