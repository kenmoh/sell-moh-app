import { Button } from "@/components/button";
import { Colors } from "@/constants/theme";
import { buildReceiptHtml } from "@/lib/receipt-html";
import type { ReceiptData } from "@/types/payments";
import Lucide from "@react-native-vector-icons/lucide";
import * as Print from "expo-print";
import { Stack, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const GREEN = "#059669";
const RED = "#ef4444";

export default function ReceiptScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? Colors.dark : Colors.light;

  const params = useLocalSearchParams<{
    receiptNumber?: string;
    businessName?: string;
    businessPhone?: string;
    storeName?: string;
    storeAddress?: string;
    saleNumber?: string;
    createdAt?: string;
    customerName?: string;
    items?: string;
    subtotal?: string;
    discount?: string;
    tax?: string;
    taxBreakdown?: string;
    total?: string;
    amountPaid?: string;
    paymentMethod?: string;
    voided?: string;
  }>();

  const isVoid = params.voided === "1";

  const receiptData = useMemo<ReceiptData | null>(() => {
    if (!params.saleNumber) return null;
    try {
      return {
        receipt_number: params.receiptNumber || "",
        business_name: params.businessName || "",
        business_phone: params.businessPhone || "",
        business_address: "",
        logo_url: "",
        store_name: params.storeName || "",
        store_address: params.storeAddress || "",
        sale_number: params.saleNumber || "",
        created_at: params.createdAt || new Date().toISOString(),
        customer_name: params.customerName || null,
        items: params.items ? JSON.parse(params.items) : [],
        subtotal: parseFloat(params.subtotal || "0"),
        discount: parseFloat(params.discount || "0"),
        tax: parseFloat(params.tax || "0"),
        tax_breakdown: params.taxBreakdown
          ? JSON.parse(params.taxBreakdown)
          : [],
        total: parseFloat(params.total || "0"),
        amount_paid: parseFloat(params.amountPaid || "0"),
        payment_method: params.paymentMethod || "cash",
        is_void: isVoid,
      };
    } catch {
      return null;
    }
  }, [params, isVoid]);

  const html = useMemo(
    () => (receiptData ? buildReceiptHtml(receiptData) : ""),
    [receiptData],
  );

  const handlePrint = () => {
    if (!html) return;
    Print.printAsync({ html }).catch(() => {});
  };

  const handleSavePdf = useCallback(async () => {
    if (!html) return;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      }
    } catch {}
  }, [html]);

  const paidDate = useMemo(() => {
    const d = receiptData ? new Date(receiptData.created_at) : null;
    if (!d || isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [receiptData]);

  if (!receiptData) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
      </View>
    );
  }

  const statusColor = isVoid ? RED : GREEN;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: isVoid ? "Void Receipt" : "Receipt" }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero */}
        <View style={styles.hero}>
          <View
            style={[styles.heroBadge, { backgroundColor: `${statusColor}1A` }]}
          >
            <Lucide
              name={isVoid ? "ban" : "check"}
              size={26}
              color={statusColor}
            />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {isVoid
              ? "Sale voided"
              : `${receiptData.payment_method.toUpperCase()} payment received`}
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            {paidDate}
          </Text>
        </View>

        {/* Receipt body */}
        <View
          style={[
            styles.receiptCard,
            {
              backgroundColor: colors.sheet,
              borderColor: colors.backgroundElement,
            },
          ]}
        >
          <View style={styles.businessBlock}>
            <Text
              style={[styles.businessName, { color: colors.text }]}
              numberOfLines={1}
            >
              {receiptData.business_name}
            </Text>
            {!!receiptData.store_name && (
              <Text
                style={[styles.businessSub, { color: colors.textSecondary }]}
              >
                {receiptData.store_name} · Receipt #{receiptData.receipt_number}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.dashedDivider,
              { borderColor: colors.backgroundElement },
            ]}
          />

          <View style={styles.receiptRow}>
            <Text
              style={[styles.receiptLabel, { color: colors.textSecondary }]}
            >
              Sale #
            </Text>
            <Text style={[styles.receiptValue, { color: colors.text }]}>
              {receiptData.sale_number}
            </Text>
          </View>
          <View style={styles.receiptRow}>
            <Text
              style={[styles.receiptLabel, { color: colors.textSecondary }]}
            >
              Payment
            </Text>
            <View
              style={[
                styles.methodBadge,
                { backgroundColor: isVoid ? `${RED}14` : `${GREEN}14` },
              ]}
            >
              <Text
                style={[
                  styles.methodBadgeText,
                  { color: isVoid ? RED : GREEN },
                ]}
              >
                {receiptData.payment_method.toUpperCase()}
              </Text>
            </View>
          </View>
          {!!receiptData.customer_name && (
            <View style={styles.receiptRow}>
              <Text
                style={[styles.receiptLabel, { color: colors.textSecondary }]}
              >
                Customer
              </Text>
              <Text style={[styles.receiptValue, { color: colors.text }]}>
                {receiptData.customer_name}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.dashedDivider,
              { borderColor: colors.backgroundElement },
            ]}
          />

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            ITEMS
          </Text>
          <View style={styles.itemsBlock}>
            {receiptData.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <View
                  style={[
                    styles.qtyBadge,
                    { backgroundColor: colors.backgroundElement },
                  ]}
                >
                  <Text
                    style={[styles.qtyText, { color: colors.textSecondary }]}
                  >
                    {item.qty}
                  </Text>
                </View>
                <Text
                  style={[styles.itemName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.product_name}
                </Text>
                <Text style={[styles.itemTotal, { color: colors.text }]}>
                  ₦{item.line_total.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.dashedDivider,
              { borderColor: colors.backgroundElement },
            ]}
          />

          <View style={styles.receiptRow}>
            <Text
              style={[styles.receiptLabel, { color: colors.textSecondary }]}
            >
              Subtotal
            </Text>
            <Text style={[styles.receiptValue, { color: colors.text }]}>
              ₦{receiptData.subtotal.toLocaleString()}
            </Text>
          </View>
          {receiptData.discount > 0 && (
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: GREEN }]}>
                Discount
              </Text>
              <Text style={[styles.receiptValue, { color: GREEN }]}>
                -₦{receiptData.discount.toLocaleString()}
              </Text>
            </View>
          )}
          {receiptData.tax_breakdown.length > 0
            ? receiptData.tax_breakdown.map((t, i) => (
                <View key={i} style={styles.receiptRow}>
                  <Text
                    style={[
                      styles.receiptLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t.name} ({t.rate}%)
                  </Text>
                  <Text style={[styles.receiptValue, { color: colors.text }]}>
                    ₦{t.amount.toLocaleString()}
                  </Text>
                </View>
              ))
            : receiptData.tax > 0 && (
                <View style={styles.receiptRow}>
                  <Text
                    style={[
                      styles.receiptLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Tax
                  </Text>
                  <Text style={[styles.receiptValue, { color: colors.text }]}>
                    ₦{receiptData.tax.toLocaleString()}
                  </Text>
                </View>
              )}

          {/* Total highlight */}
          <View
            style={[
              styles.totalBar,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              TOTAL
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              ₦{receiptData.total.toLocaleString()}
            </Text>
          </View>

          <Text style={[styles.paidLine, { color: colors.textSecondary }]}>
            {isVoid
              ? "Voided — items returned to stock"
              : receiptData.amount_paid >= receiptData.total &&
                  receiptData.amount_paid > 0
                ? `Paid ₦${receiptData.amount_paid.toLocaleString()} via ${receiptData.payment_method.toUpperCase()}`
                : `Paid ₦${receiptData.amount_paid.toLocaleString()} of ₦${receiptData.total.toLocaleString()}`}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.btnRow}>
        <Button
          leftIcon={(color) => (
            <Lucide name="printer" size={18} color={color} />
          )}
          onPress={handlePrint}
          style={styles.btn}
          title="Print Receipt"
        />
        <Button
          leftIcon={(color) => (
            <Lucide name="download" size={18} color={color} />
          )}
          onPress={handleSavePdf}
          style={styles.btn}
          title="Save PDF"
          variant="outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "700" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  hero: { alignItems: "center", marginBottom: 16, gap: 6 },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  heroTitle: { fontSize: 16, fontWeight: "800", textAlign: "center" },
  heroSub: { fontSize: 12 },
  receiptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  businessBlock: { alignItems: "center", marginBottom: 4, gap: 4 },
  businessName: { fontSize: 16, fontWeight: "800" },
  businessSub: { fontSize: 12, textAlign: "center" },
  dashedDivider: {
    borderTopWidth: 1,
    borderStyle: "dashed",
    marginVertical: 12,
  },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  receiptLabel: { fontSize: 13 },
  receiptValue: { fontSize: 13, fontWeight: "600" },
  methodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  methodBadgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  itemsBlock: { gap: 10 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  qtyText: { fontSize: 12, fontWeight: "700" },
  itemName: { flex: 1, fontSize: 13, fontWeight: "500" },
  itemTotal: { fontSize: 13, fontWeight: "600" },
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  totalLabel: { fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  totalValue: { fontSize: 18, fontWeight: "800" },
  paidLine: { fontSize: 12, textAlign: "center", marginTop: 12 },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 8,
  },
  btn: {
    flex: 1,
  },
});
