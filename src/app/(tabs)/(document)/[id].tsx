import { getDocumentById } from "@/api/document";
import AppView from "@/components/app-view";
import { Colors } from "@/constants/theme";
import type { Document } from "@/types/document-types";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
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

const formatCurrency = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const DocumentDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocumentById(id!),
    enabled: !!id,
  });

  console.log(data);

  const doc = data?.data as Document | undefined;

  if (isLoading) {
    return (
      <AppView>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.buttonPrimary} />
        </View>
      </AppView>
    );
  }

  if (isError || !doc) {
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
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 10,
      }}
    >
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
            Items ({doc.items?.length ?? doc.item_count})
          </Text>
          {doc.items.map((item, i) => (
            <View
              key={item.id}
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
                {formatCurrency(item.line_total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.card,
              borderColor: colors.backgroundSelected,
              borderBottomEndRadius: 16,
              borderBottomStartRadius: 16,
            },
          ]}
        >
          <View style={[styles.summaryRow, styles.totalSummary]}>
            <Text style={[styles.totalSummaryLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalSummaryValue, { color: colors.text }]}>
              {formatCurrency(doc.total)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
    // borderRadius: 16,
    borderTopEndRadius: 16,
    borderTopStartRadius: 16,
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
