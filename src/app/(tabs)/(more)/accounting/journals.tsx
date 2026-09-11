import { fetchJournals, createJournal, fetchAccounts } from "@/api/accounting";
import AddJournalSheet from "@/components/accounting/add-journal-sheet";
import InfoTooltip from "@/components/info-tooltip";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

const Journals = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];
  const queryClient = useQueryClient();
  const router = useRouter();

  const [showAddSheet, setShowAddSheet] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["journals"],
    queryFn: ({ pageParam = 1 }) => fetchJournals(pageParam, 20),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const journals = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const { mutate: addJournal, isPending: isAdding } = useMutation({
    mutationFn: createJournal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      setShowAddSheet(false);
    },
  });

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "posted":
        return "#10b981";
      case "draft":
        return "#f59e0b";
      case "voided":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: (typeof journals)[0] }) => (
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
          <Text style={[styles.journalNumber, { color: colors.text }]}>
            {item.journal_number}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}15` },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardDescription, { color: colors.text }]}>
          {item.description}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
            {item.entry_count} entries
          </Text>
          <View style={styles.amounts}>
            <Text style={[styles.debitAmount, { color: "#10b981" }]}>
              ₦{item.total_debit.toLocaleString()}
            </Text>
            <Text style={[styles.creditAmount, { color: "#ef4444" }]}>
              ₦{item.total_credit.toLocaleString()}
            </Text>
          </View>
        </View>
        {item.created_at && (
          <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        )}
      </View>
    ),
    [colors, isDark, getStatusColor],
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
          Journal Entries
        </Text>
        <InfoTooltip
          title="Journal Entries"
          message="A journal entry records a financial transaction in your accounting system. Every entry follows double-entry bookkeeping — every debit must have an equal credit. Use journal entries to record adjustments, corrections, and non-routine transactions."
        />
        <Pressable
          onPress={() => setShowAddSheet(true)}
          style={[styles.addTrigger, { backgroundColor: colors.backgroundElement }]}
        >
          <Lucide name="plus" size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Journal List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={journals}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color={colors.buttonPrimary}
                size="small"
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconBadge,
                  { backgroundColor: colors.backgroundElement },
                ]}
              >
                <Lucide name="file-text" size={32} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Journal Entries
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Journal entries are created automatically or manually
              </Text>
            </View>
          }
        />
      )}

      <AddJournalSheet
        visible={showAddSheet}
        onVisibleChange={setShowAddSheet}
        onAdd={(data) => addJournal(data)}
        accounts={accounts}
        isPending={isAdding}
      />
    </SafeAreaView>
  );
};

export default Journals;

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
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  journalNumber: { fontSize: 14, fontWeight: "700", fontFamily: "monospace" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardDescription: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMeta: { fontSize: 12 },
  amounts: { flexDirection: "row", gap: 12 },
  debitAmount: { fontSize: 13, fontWeight: "700" },
  creditAmount: { fontSize: 13, fontWeight: "700" },
  cardDate: { fontSize: 11, marginTop: 6 },
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
