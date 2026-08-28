import AddDocumentSheet from "@/components/add-document-sheet";
import { createDocument, getDocuments } from "@/api/document";
import { Colors } from "@/constants/theme";
import { useSession } from "@/lib/ctx";
import { DocumentCreateRequest, DocumentResponse, DocumentType } from "@/types/document-types";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DOC_TYPES: { label: string; value: DocumentType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Invoice", value: "invoice" },
  { label: "Quote", value: "quote" },
  { label: "Receipt", value: "receipt" },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  draft: { color: "#6B7280", bg: "rgba(107, 114, 128, 0.12)" },
  pending: { color: "#D97706", bg: "rgba(217, 119, 6, 0.12)" },
  paid: { color: "#059669", bg: "rgba(5, 150, 105, 0.12)" },
  voided: { color: "#DC2626", bg: "rgba(220, 38, 38, 0.12)" },
  sent: { color: "#2563EB", bg: "rgba(37, 99, 235, 0.12)" },
};

const typeConfig: Record<
  DocumentType,
  { icon: string; color: string; bg: string }
> = {
  invoice: {
    icon: "file-text",
    color: "#2563EB",
    bg: "rgba(37, 99, 235, 0.12)",
  },
  quote: { icon: "receipt", color: "#7C3AED", bg: "rgba(124, 58, 237, 0.12)" },
  receipt: {
    icon: "check-circle",
    color: "#059669",
    bg: "rgba(5, 150, 105, 0.12)",
  },
  purchase_order: {
    icon: "shopping-bag",
    color: "#D97706",
    bg: "rgba(217, 119, 6, 0.12)",
  },
};

const formatCurrency = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const DocumentListScreen = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<DocumentType | "all">("all");
  const [showAddSheet, setShowAddSheet] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useSession();

  const { data: documentsResponse, isPending, isRefetching, refetch } = useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });

  const documents: DocumentResponse[] = useMemo(() => {
    const raw = documentsResponse?.data;
    if (Array.isArray(raw)) return raw as DocumentResponse[];
    return [];
  }, [documentsResponse]);

  const createMutation = useMutation({
    mutationFn: (payload: DocumentCreateRequest) => createDocument(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      Alert.alert("Success", "Document created successfully");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to create document");
    },
  });

  const handleCreate = async (payload: DocumentCreateRequest) => {
    createMutation.mutateAsync({
      ...payload,
      tenant_id: user?.business_id ?? "",
      actor_id: user?.user_id ?? "",
    });
  };

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchesType = activeType === "all" || doc.doc_type === activeType;
      const matchesSearch =
        !search || doc.doc_number.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [documents, activeType, search]);

  const renderHeader = () => (
    <Stack.Screen
      options={{
        title: "Documents",
        headerShadowVisible: false,
        headerShown: true,
        headerRight: () => (
          <Pressable
            style={[styles.addBtn, { backgroundColor: colors.buttonPrimary }]}
            onPress={() => setShowAddSheet(true)}
          >
            <Lucide name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>New</Text>
          </Pressable>
        ),
      }}
    />
  );

  const renderStickyHeader = () => (
    <View style={[styles.stickyWrap, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.searchRow,
          { backgroundColor: colors.backgroundElement },
        ]}
      >
        <Lucide name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search documents..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Lucide name="x" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={DOC_TYPES}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const isActive = activeType === item.value;
          return (
            <Pressable
              style={[
                styles.filterPill,
                {
                  backgroundColor: isActive
                    ? colors.buttonPrimary
                    : colors.backgroundElement,
                },
              ]}
              onPress={() => setActiveType(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isActive ? "#fff" : colors.textSecondary,
                    fontWeight: isActive ? "700" : "600",
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );

  const renderDoc = ({ item }: { item: DocumentResponse }) => {
    const type = typeConfig[item.doc_type];
    const status = statusConfig[item.status] || statusConfig.draft;

    return (
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.backgroundSelected,
          },
        ]}
        onPress={() => router.push(`/(tabs)/(more)/document/${item.id}`)}
      >
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, { backgroundColor: type.bg }]}>
            <Lucide name={type.icon as any} size={14} color={type.color} />
            <Text style={[styles.typeText, { color: type.color }]}>
              {item.doc_type.replace("_", " ")}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <View
              style={[styles.statusDot, { backgroundColor: status.color }]}
            />
            <Text style={[styles.statusText, { color: status.color }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardMiddle}>
          <Text style={[styles.docNumber, { color: colors.text }]}>
            {item.doc_number}
          </Text>
          <Text style={[styles.total, { color: colors.text }]}>
            {formatCurrency(item.total)}
          </Text>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.cardMeta}>
            <Lucide name="layers" size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {item.item_count} {item.item_count === 1 ? "item" : "items"}
            </Text>
          </View>
          {item.due_date && (
            <View style={styles.cardMeta}>
              <Lucide name="calendar" size={12} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                Due{" "}
                {new Date(item.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 15,
        backgroundColor: colors.background,
      }}
    >
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderDoc}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderStickyHeader()}
          </>
        }
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 20 },
        ]}
        ListEmptyComponent={
          isPending ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.buttonPrimary} size="large" />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Lucide name="file-x" size={48} color={colors.backgroundSelected} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No documents found
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Try adjusting your filters or create a new document.
              </Text>
            </View>
          )
        }
      />

      <AddDocumentSheet
        visible={showAddSheet}
        onVisibleChange={setShowAddSheet}
        onCreate={handleCreate}
      />
    </View>
  );
};

export default DocumentListScreen;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  stickyWrap: {
    paddingBottom: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 50,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterRow: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardTop: {
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
  typeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
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
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  cardMiddle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  docNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
  total: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardBottom: {
    flexDirection: "row",
    gap: 14,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
});
