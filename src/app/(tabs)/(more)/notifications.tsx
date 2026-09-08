import { fetchBusinessSettings, updateBusinessSettings } from "@/api/business";
import {
  deleteNotifications as apiDeleteNotifications,
  markAllRead as apiMarkAllRead,
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
} from "@/api/notifications";
import NotificationDetailCard from "@/components/notification-detail-card";
import Pill from "@/components/pill";
import { Colors } from "@/constants/theme";
import {
  getNotificationTypeConfig,
  NOTIFICATION_TYPE_CONFIG,
  type InAppNotification,
  type NotificationType,
} from "@/types/notifications";
import { Checkbox, Host, Switch } from "@expo/ui";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterType =
  | "All"
  | "Unread"
  | "Orders"
  | "Payments"
  | "Inventory"
  | "Stock"
  | "System";

const FILTERS: FilterType[] = [
  "All",
  "Unread",
  "Orders",
  "Payments",
  "Inventory",
  "Stock",
  "System",
];

function formatDateGroup(iso: string): "Today" | "Yesterday" | "Older" {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (d >= startOfToday) return "Today";
  if (d >= startOfYesterday) return "Yesterday";
  return "Older";
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hr = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const h = parseInt(hr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${min} ${ampm}`;
}

const Notifications = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [typeToggles, setTypeToggles] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<InAppNotification | null>(
    null,
  );

  // Fetch notifications
  const { data: notifData, isLoading } = useQuery({
    queryKey: [
      "notifications",
      activeFilter === "All" ? undefined : activeFilter,
    ],
    queryFn: () =>
      fetchNotifications({
        type:
          activeFilter !== "All" && activeFilter !== "Unread"
            ? (activeFilter.toLowerCase() as NotificationType)
            : undefined,
        unread_only: activeFilter === "Unread",
        limit: 100,
      }),
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });

  // Fetch notification settings
  const { data: bizSettings } = useQuery({
    queryKey: ["business-settings"],
    queryFn: () => fetchBusinessSettings(),
  });

  const notifs = notifData?.items ?? [];
  const typeTogglesFromServer =
    (bizSettings?.settings as any)?.notification_types ?? {};

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiMarkAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => apiDeleteNotifications(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      setEditMode(false);
      setSelectedIds(new Set());
    },
  });

  const togglePrefMutation = useMutation({
    mutationFn: (newPrefs: Record<string, boolean>) =>
      updateBusinessSettings({ settings: { notification_types: newPrefs } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    },
  });

  const handleTogglePref = useCallback(
    (typeId: string) => {
      if (typeId === "system") return;
      const current = {
        ...typeTogglesFromServer,
        [typeId]: !(typeTogglesFromServer[typeId] ?? true),
      };
      togglePrefMutation.mutate(current);
    },
    [typeTogglesFromServer, togglePrefMutation],
  );

  const handlePress = useCallback(
    (notif: InAppNotification) => {
      if (editMode) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(notif.id)) next.delete(notif.id);
          else next.add(notif.id);
          return next;
        });
        return;
      }
      setSelectedNotif(notif);
      setDetailVisible(true);
    },
    [editMode],
  );

  const handleMarkReadFromCard = useCallback(
    (id: string) => {
      markReadMutation.mutate([id]);
    },
    [markReadMutation],
  );

  const handleSwipeDelete = useCallback(
    (id: string) => {
      Alert.alert("Delete", "Remove this notification?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate([id]),
        },
      ]);
    },
    [deleteMutation],
  );

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === notifs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifs.map((n) => n.id)));
    }
  }, [selectedIds, notifs]);

  const handleBatchDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    Alert.alert("Delete", `Remove ${selectedIds.size} notification(s)?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(Array.from(selectedIds)),
      },
    ]);
  }, [selectedIds, deleteMutation]);

  const groups = useMemo(() => {
    const grouped: Record<string, InAppNotification[]> = {
      Today: [],
      Yesterday: [],
      Older: [],
    };
    for (const n of notifs) {
      const g = formatDateGroup(n.created_at);
      grouped[g].push(n);
    }
    return grouped;
  }, [notifs]);

  const renderRightActions = useCallback(
    (id: string) => {
      return (progress: Animated.AnimatedInterpolation<number>) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [80, 0],
        });
        return (
          <Animated.View
            style={[styles.deleteAction, { transform: [{ translateX }] }]}
          >
            <Pressable
              style={styles.deleteActionInner}
              onPress={() => handleSwipeDelete(id)}
            >
              <Lucide name="trash-2" size={18} color="#fff" />
              <Text style={styles.deleteActionText}>Delete</Text>
            </Pressable>
          </Animated.View>
        );
      };
    },
    [handleSwipeDelete],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerRight: () => {
            return editMode ? (
              <Pressable
                onPress={() => {
                  setEditMode(false);
                  setSelectedIds(new Set());
                }}
              >
                <Text style={styles.markReadLink}>Done</Text>
              </Pressable>
            ) : (
              <View style={styles.headerActions}>
                <Pressable onPress={() => markAllMutation.mutate()}>
                  <Text style={styles.markReadLink}>Mark all read</Text>
                </Pressable>
                <Pressable onPress={() => setEditMode(true)} hitSlop={8}>
                  <Lucide name="check-square" size={20} color="#3b82f6" />
                </Pressable>
              </View>
            );
          },
        }}
      />

      {/* Edit mode toolbar */}
      {editMode && (
        <View style={[styles.editToolbar, { backgroundColor: colors.card }]}>
          <Pressable onPress={toggleSelectAll} style={styles.editToolbarLeft}>
            <Host matchContents>
              <Checkbox
                value={selectedIds.size === notifs.length && notifs.length > 0}
                onValueChange={toggleSelectAll}
              />
            </Host>
            <Text style={[styles.editToolbarText, { color: colors.text }]}>
              {selectedIds.size === 0
                ? "Select all"
                : `${selectedIds.size} selected`}
            </Text>
          </Pressable>
          {selectedIds.size > 0 && (
            <Pressable onPress={handleBatchDelete} hitSlop={8}>
              <Text style={styles.deleteLink}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          gap: 16,
        }}
      >
        {/* Notification Type Toggles */}
        <View style={{ paddingHorizontal: 10, marginVertical: 5 }}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textSecondary, marginLeft: 15 },
            ]}
          >
            NOTIFICATION TYPES
          </Text>
          <View style={[styles.typesCard, { backgroundColor: colors.card }]}>
            {NOTIFICATION_TYPE_CONFIG.map((type, i) => (
              <View
                key={type.id}
                style={[
                  styles.typeRow,
                  i < NOTIFICATION_TYPE_CONFIG.length - 1 && {
                    borderBottomColor: colors.backgroundElement,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.bg }]}>
                  <Lucide
                    name={type.icon as any}
                    size={16}
                    color={type.color}
                  />
                </View>
                <Text style={[styles.typeLabel, { color: colors.text }]}>
                  {type.label}
                </Text>
                <Host matchContents>
                  <Switch
                    value={
                      type.id === "system"
                        ? true
                        : (typeTogglesFromServer[type.id] ?? true)
                    }
                    disabled={type.id === "system"}
                    onValueChange={() => handleTogglePref(type.id)}
                  />
                </Host>
              </View>
            ))}
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
        >
          {FILTERS.map((f) => (
            <Pill
              key={f}
              label={f}
              active={f === activeFilter}
              onPress={() => setActiveFilter(f)}
              color="#3b82f6"
              badge={
                f === "Unread" && unreadCount > 0 ? unreadCount : undefined
              }
            />
          ))}
        </ScrollView>

        {/* Notification Groups */}
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color="#3b82f6"
            style={{ marginTop: 40 }}
          />
        ) : (
          (["Today", "Yesterday", "Older"] as const).map((group) => {
            const items = groups[group];
            if (items.length === 0) return null;
            return (
              <View key={group} style={{ paddingHorizontal: 20 }}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textSecondary }]}
                >
                  {group.toUpperCase()}
                </Text>
                <View style={styles.notifList}>
                  {items.map((n) => {
                    const config = getNotificationTypeConfig(n.type);
                    return (
                      <Swipeable
                        key={n.id}
                        renderRightActions={
                          editMode ? undefined : renderRightActions(n.id)
                        }
                        enabled={!editMode}
                      >
                        <Pressable
                          style={[
                            styles.notifCard,
                            { backgroundColor: colors.card },
                          ]}
                          onPress={() => {
                            if (editMode) return;
                            handlePress(n);
                          }}
                        >
                          {editMode && (
                            <View style={styles.checkbox}>
                              <Host matchContents>
                                <Checkbox
                                  value={selectedIds.has(n.id)}
                                  onValueChange={() => handlePress(n)}
                                />
                              </Host>
                            </View>
                          )}
                          {!n.is_read && <View style={styles.unreadDot} />}
                          <View
                            style={[
                              styles.iconBadge,
                              { backgroundColor: config.bg },
                            ]}
                          >
                            <Lucide
                              name={config.icon as any}
                              size={18}
                              color={config.color}
                            />
                          </View>
                          <View style={styles.notifInfo}>
                            <Text
                              style={[
                                styles.notifTitle,
                                { color: colors.text },
                              ]}
                            >
                              {n.title}
                            </Text>
                            <Text
                              style={[
                                styles.notifDesc,
                                { color: colors.textSecondary },
                              ]}
                              numberOfLines={2}
                            >
                              {n.body}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.notifTime,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {formatTime(n.created_at)}
                          </Text>
                        </Pressable>
                      </Swipeable>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Detail Card */}
      <NotificationDetailCard
        visible={detailVisible}
        notification={selectedNotif}
        onClose={() => {
          setDetailVisible(false);
          setSelectedNotif(null);
        }}
        onMarkRead={handleMarkReadFromCard}
      />
    </View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  headerLeft: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  markReadLink: { color: "#3b82f6", fontSize: 13, fontWeight: "600" },
  editToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 4,
  },
  editToolbarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  editToolbarText: { fontSize: 14, fontWeight: "500" },
  deleteLink: { color: "#dc2626", fontSize: 14, fontWeight: "600" },
  typesCard: { borderRadius: 12, padding: 4 },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 10,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  filterTabs: {
    paddingHorizontal: 10,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  notifList: { gap: 8 },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  checkbox: {
    marginRight: 4,
    marginTop: 2,
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  notifInfo: { flex: 1, gap: 4 },
  notifTitle: { fontSize: 14, fontWeight: "700" },
  notifDesc: { fontSize: 13, lineHeight: 18 },
  notifTime: { fontSize: 11, fontWeight: "500" },
  deleteAction: {
    width: 80,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 16,
  },
  deleteActionInner: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  deleteActionText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});
