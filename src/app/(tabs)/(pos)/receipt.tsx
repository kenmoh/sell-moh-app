import React, { useMemo, useCallback } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "react-native";
import { buildReceiptHtml } from "@/lib/receipt-html";
import type { ReceiptData } from "@/types/payments";
import Lucide from "@react-native-vector-icons/lucide";

export default function ReceiptScreen() {
  const router = useRouter();
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
    total?: string;
    amountPaid?: string;
    paymentMethod?: string;
  }>();

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
        total: parseFloat(params.total || "0"),
        amount_paid: parseFloat(params.amountPaid || "0"),
        payment_method: params.paymentMethod || "cash",
      };
    } catch {
      return null;
    }
  }, [params]);

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

  if (!receiptData) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Lucide name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Receipt</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.receiptCard, { backgroundColor: colors.sheet, borderColor: colors.backgroundElement }]}>
        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
            Receipt #
          </Text>
          <Text style={[styles.receiptValue, { color: colors.text }]}>
            {receiptData.receipt_number}
          </Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
            Sale #
          </Text>
          <Text style={[styles.receiptValue, { color: colors.text }]}>
            {receiptData.sale_number}
          </Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
            Business
          </Text>
          <Text style={[styles.receiptValue, { color: colors.text }]}>
            {receiptData.business_name}
          </Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
            Store
          </Text>
          <Text style={[styles.receiptValue, { color: colors.text }]}>
            {receiptData.store_name}
          </Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
            Payment
          </Text>
          <Text style={[styles.receiptValue, { color: colors.text }]}>
            {receiptData.payment_method.toUpperCase()}
          </Text>
        </View>

        <View style={[styles.divider, { borderColor: colors.backgroundElement }]} />

        {receiptData.items.map((item, i) => (
          <View key={i} style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: colors.textSecondary, flex: 1 }]}>
              {item.qty} x {item.product_name}
            </Text>
            <Text style={[styles.receiptValue, { color: colors.text }]}>
              ₦{item.line_total.toLocaleString()}
            </Text>
          </View>
        ))}

        <View style={[styles.divider, { borderColor: colors.backgroundElement }]} />

        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
            Subtotal
          </Text>
          <Text style={[styles.receiptValue, { color: colors.text }]}>
            ₦{receiptData.subtotal.toLocaleString()}
          </Text>
        </View>
        {receiptData.discount > 0 && (
          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
              Discount
            </Text>
            <Text style={[styles.receiptValue, { color: colors.text }]}>
              -₦{receiptData.discount.toLocaleString()}
            </Text>
          </View>
        )}
        {receiptData.tax > 0 && (
          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
              Tax (VAT)
            </Text>
            <Text style={[styles.receiptValue, { color: colors.text }]}>
              ₦{receiptData.tax.toLocaleString()}
            </Text>
          </View>
        )}

        <View style={[styles.divider, { borderColor: colors.backgroundElement, borderWidth: 1.5 }]} />

        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: colors.text, fontWeight: "700", fontSize: 16 }]}>
            TOTAL
          </Text>
          <Text style={[styles.receiptValue, { color: colors.text, fontWeight: "700", fontSize: 16 }]}>
            ₦{receiptData.total.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePrint}
          style={[styles.printBtn, { backgroundColor: colors.buttonPrimary }]}
        >
          <Lucide name="printer" size={20} color="#fff" />
          <Text style={styles.printBtnText}>Print Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSavePdf}
          style={[styles.printBtn, { backgroundColor: colors.backgroundElement }]}
        >
          <Lucide name="download" size={20} color={colors.text} />
          <Text style={[styles.printBtnText, { color: colors.text }]}>Save PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  receiptCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  receiptLabel: { fontSize: 13 },
  receiptValue: { fontSize: 13, fontWeight: "600" },
  divider: { borderTopWidth: 1, marginVertical: 10 },
  btnRow: {
    flexDirection: "row",
    gap: 12,
  },
  printBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  printBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
