import { fetchBalanceSheet } from "@/api/accounting";
import BalanceSheetIntegrity from "@/components/balance-sheet-integrity";
import InfoTooltip from "@/components/info-tooltip";
import StoreSwitcher from "@/components/store-switcher";
import { Colors } from "@/constants/theme";
import { useActiveStore } from "@/lib/store-context";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import Info from "@expo/material-symbols/info.xml";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Fragment, useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PnLLineItem } from "@/types/accounting";

type Section = {
  title: string;
  items: PnLLineItem[];
  total: number;
  color: string;
  icon: string;
};

const BalanceSheet = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const { activeStoreId } = useActiveStore();

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const asAtDate = date.toISOString().split("T")[0];

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["balance-sheet", asAtDate, activeStoreId],
    queryFn: () => fetchBalanceSheet(asAtDate, activeStoreId),
  });

  const sections: Section[] = data
    ? [
        {
          title: "Assets",
          items: data.assets,
          total: data.total_assets,
          color: "#10b981",
          icon: "briefcase",
        },
        {
          title: "Liabilities",
          items: data.liabilities,
          total: data.total_liabilities,
          color: "#ef4444",
          icon: "credit-card",
        },
        {
          title: "Equity",
          items: data.equity,
          total: data.total_equity,
          color: "#8b5cf6",
          icon: "shield",
        },
      ]
    : [];

  const renderSection = useCallback(
    (section: Section) => (
      <View key={section.title} style={styles.section}>
        <View
          style={[
            styles.sectionHeader,
            { borderBottomColor: isDark ? "#282b32" : "#e5e7eb" },
          ]}
        >
          <View style={styles.sectionHeaderLeft}>
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: `${section.color}15` },
              ]}
            >
              <Lucide
                name={section.icon as any}
                size={16}
                color={section.color}
              />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
          </View>
          <Text style={[styles.sectionTotal, { color: section.color }]}>
            ₦{section.total.toLocaleString()}
          </Text>
        </View>
        {section.items.map((item: PnLLineItem, idx: number) => (
          <Fragment key={item.account_id}>
            {idx > 0 && (
              <View
                style={[
                  styles.lineSeparator,
                  { backgroundColor: isDark ? "#282b32" : "#e5e7eb" },
                ]}
              />
            )}
            <View style={styles.lineItem}>
              <View style={styles.lineItemLeft}>
                <Text
                  style={[styles.lineItemCode, { color: colors.textSecondary }]}
                >
                  {item.account_code}
                </Text>
                <Text style={[styles.lineItemName, { color: colors.text }]}>
                  {item.account_name}
                </Text>
              </View>
              <Text style={[styles.lineItemAmount, { color: section.color }]}>
                ₦{item.amount.toLocaleString()}
              </Text>
            </View>
          </Fragment>
        ))}
        {section.items.length === 0 && (
          <Text style={[styles.emptySection, { color: colors.textSecondary }]}>
            No {section.title.toLowerCase()} recorded
          </Text>
        )}
      </View>
    ),
    [colors, isDark],
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      
    >
      {/* Header */}
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={process.env.EXPO_OS === "ios" ? "info.circle" : Info}
          onPress={() => setShowInfo(true)}
        />
      </Stack.Toolbar>
      <InfoTooltip
        title="Balance Sheet"
        message={`Your balance sheet is a snapshot of your business's financial health at a specific point in time. It shows what you own (assets), what you owe (liabilities), and what's left over (equity). The equation is always: Assets = Liabilities + Equity.

Every sale, invoice and payment is recorded twice in the books, so the two sides can never disagree with each other. Equity is the owner's capital plus revenue minus expenses — profit is not transferred into retained earnings at year end here, so it counts toward equity as it is earned.

The panel above the figures reports two controls. The balance check (Assets − Liabilities − Equity) should be ₦0; anything else means a record reached the books on only one side. And the receivable and payable figures are compared with the ledger accounts behind them (1100 and 2000), so a bill or invoice saved without its journal shows up instead of quietly drifting.`}
        visible={showInfo}
        onVisibleChange={setShowInfo}
        trigger={false}
      />

      {/* Store Filter */}
      <View style={styles.switcherRow}>
        <StoreSwitcher mode="all" />
      </View>

      {/* Date Picker */}
      <View style={styles.dateContainer}>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={({ pressed }) => [
            styles.datePill,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? "#262930" : "#eef0f4",
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Lucide name="calendar" size={16} color={colors.text} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDate(date)}
          </Text>
          <Lucide name="chevron-down" size={16} color={colors.textSecondary} />
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="compact"
            presentation="dialog"
            onValueChange={(_, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
            onDismiss={() => setShowPicker(false)}
          />
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.title}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={data ? <BalanceSheetIntegrity data={data} /> : null}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3b82f6"
            />
          }
          renderItem={({ item }) => renderSection(item)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconBadge,
                  { backgroundColor: colors.backgroundElement },
                ]}
              >
                <Lucide
                  name="landmark"
                  size={32}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Data
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                No balance sheet data for this date
              </Text>
            </View>
          }
        />
      )}

      {/* Total Assets = Liabilities + Equity Footer */}
      {data && (
        <View
          style={[
            styles.totalFooter,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: isDark ? "#282b32" : "#e5e7eb",
            },
          ]}
        >
          <Text style={[styles.totalFooterLabel, { color: colors.text }]}>
            Total
          </Text>
          <View style={styles.totalFooterRow}>
            <View style={styles.totalFooterItem}>
              <Text style={[styles.totalFooterItemLabel, { color: "#10b981" }]}>
                Assets
              </Text>
              <Text style={[styles.totalFooterItemValue, { color: "#10b981" }]}>
                ₦{data.total_assets.toLocaleString()}
              </Text>
            </View>
            <Text
              style={[
                styles.totalFooterEquals,
                { color: colors.textSecondary },
              ]}
            >
              =
            </Text>
            <View style={styles.totalFooterItem}>
              <Text style={[styles.totalFooterItemLabel, { color: "#ef4444" }]}>
                Liab + Equity
              </Text>
              <Text style={[styles.totalFooterItemValue, { color: "#ef4444" }]}>
                ₦{(data.total_liabilities + data.total_equity).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default BalanceSheet;

const styles = StyleSheet.create({
  container: { flex: 1 },
  switcherRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dateContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionTotal: { fontSize: 16, fontWeight: "800" },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  lineSeparator: { height: StyleSheet.hairlineWidth },
  lineItemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lineItemCode: { fontSize: 12, fontFamily: "monospace", fontWeight: "600" },
  lineItemName: { fontSize: 14, fontWeight: "500" },
  lineItemAmount: { fontSize: 14, fontWeight: "700" },
  emptySection: {
    fontSize: 13,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  totalFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalFooterLabel: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  totalFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalFooterItem: { alignItems: "center" },
  totalFooterItemLabel: { fontSize: 11, fontWeight: "600" },
  totalFooterItemValue: { fontSize: 15, fontWeight: "800" },
  totalFooterEquals: { fontSize: 18, fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: "center", marginBottom: 18 },
});
