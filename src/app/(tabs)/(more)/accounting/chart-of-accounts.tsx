import { fetchAccounts, createAccount } from "@/api/accounting";
import AddAccountSheet from "@/components/accounting/add-account-sheet";
import Pill from "@/components/pill";
import SearchInput from "@/components/search-input";
import InfoTooltip from "@/components/info-tooltip";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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

type AccountType = "All" | "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";

const accountTypes: AccountType[] = ["All", "Asset", "Liability", "Equity", "Revenue", "Expense"];

const ChartOfAccounts = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const queryClient = useQueryClient();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<AccountType>("All");
  const [showAddSheet, setShowAddSheet] = useState(false);

  const {
    data: accounts = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const { mutate: addAccount, isPending: isAdding } = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setShowAddSheet(false);
    },
  });

  const filtered = useMemo(() => {
    let result = accounts;
    if (activeFilter !== "All") {
      result = result.filter(
        (a) => a.account_type.toLowerCase() === activeFilter.toLowerCase(),
      );
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q),
      );
    }
    return result;
  }, [accounts, activeFilter, search]);

  const getTypeColor = useCallback((type: string) => {
    switch (type.toLowerCase()) {
      case "asset":
        return "#10b981";
      case "liability":
        return "#ef4444";
      case "equity":
        return "#8b5cf6";
      case "revenue":
        return "#3b82f6";
      case "expense":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: (typeof accounts)[0] }) => (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? "#282b32" : "#eef0f4",
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.codeBadge,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <Text style={[styles.codeText, { color: colors.text }]}>
              {item.code}
            </Text>
          </View>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: `${getTypeColor(item.account_type)}15` },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                { color: getTypeColor(item.account_type) },
              ]}
            >
              {item.account_type}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardName, { color: colors.text }]}>
          {item.name}
        </Text>
      </View>
    ),
    [colors, isDark, getTypeColor],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Lucide name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Chart of Accounts
        </Text>
        <InfoTooltip
          title="Chart of Accounts"
          message="Your chart of accounts is the complete list of all financial accounts used to record transactions. It's the backbone of your accounting system, organizing everything into assets, liabilities, equity, revenue, and expenses."
        />
        <Pressable
          onPress={() => setShowAddSheet(true)}
          style={[styles.addTrigger, { backgroundColor: colors.backgroundElement }]}
        >
          <Lucide name="plus" size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search accounts..."
        />
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {accountTypes.map((type) => (
          <Pill
            key={type}
            label={type}
            active={activeFilter === type}
            onPress={() => setActiveFilter(type)}
            color={type === "All" ? undefined : getTypeColor(type)}
          />
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconBadge,
                  { backgroundColor: colors.backgroundElement },
                ]}
              >
                <Lucide name="book-open" size={32} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Accounts Found
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                {search
                  ? "Try a different search term"
                  : "Add your first account to get started"}
              </Text>
            </View>
          }
        />
      )}

      <AddAccountSheet
        visible={showAddSheet}
        onVisibleChange={setShowAddSheet}
        onAdd={(data) => addAccount(data)}
      />
    </SafeAreaView>
  );
};

export default ChartOfAccounts;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  addTrigger: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: { fontSize: 12, fontWeight: "700", fontFamily: "monospace" },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  typeText: { fontSize: 11, fontWeight: "700" },
  cardName: { fontSize: 15, fontWeight: "600" },
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
