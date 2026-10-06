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
import PillRow from "@/components/pill-row";
import { Colors } from "@/constants/theme";
import { getMenuIcon } from "@/types/notification-menu-icon";
import {
  getNotificationTypeConfig,
  NOTIFICATION_TYPE_CONFIG,
  type InAppNotification,
  type NotificationType,
} from "@/types/notifications";
import MoreVert from "@expo/material-symbols/more_vert.xml";
import { Checkbox, Host } from "@expo/ui";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
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

  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<InAppNotification | null>(
    null,
  );

  // One driver for the whole select-mode transition: the toolbar fades and
  // drops in, and every row's checkbox scales up with it. A state-held value
  // keeps a stable identity for interpolation without reading a ref mid-render.
  const selectAnim = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    Animated.timing(selectAnim, {
      toValue: editMode ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [editMode, selectAnim]);

  // Fetch notifications
  const {
    data: notifData,
    isLoading,
    isRefetching,
    refetch: refetchNotifs,
  } = useQuery({
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
  const { data: unreadCount = 0, refetch: refetchUnread } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchNotifs(), refetchUnread()]);
  }, [refetchNotifs, refetchUnread]);

  // Fetch notification settings
  const { data: bizSettings } = useQuery({
    queryKey: ["business-settings"],
    queryFn: () => fetchBusinessSettings(),
  });

  const notifs = useMemo(() => notifData?.items ?? [], [notifData]);
  const typeTogglesFromServer = useMemo(
    () => (bizSettings?.settings as any)?.notification_types ?? {},
    [bizSettings],
  );

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

  type NotifListItem =
    | { kind: "group"; label: "Today" | "Yesterday" | "Older" }
    | { kind: "notif"; n: InAppNotification; last: boolean };

  const listItems = useMemo<NotifListItem[]>(() => {
    const items: NotifListItem[] = [];
    for (const g of ["Today", "Yesterday", "Older"] as const) {
      const list = groups[g];
      if (list.length === 0) continue;
      items.push({ kind: "group", label: g });
      list.forEach((n, i) =>
        items.push({ kind: "notif", n, last: i === list.length - 1 }),
      );
    }
    return items;
  }, [groups]);

  const renderRightActions = useCallback(
    (id: string) => {
      return function SwipeDeleteAction(
        progress: Animated.AnimatedInterpolation<number>,
      ) {
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

  const listHeader = (
    <PillRow inset={20} style={styles.filterTabsWrap}>
      {FILTERS.map((f) => (
        <Pill
          key={f}
          label={f}
          active={f === activeFilter}
          onPress={() => setActiveFilter(f)}
          color="#3b82f6"
          badge={f === "Unread" && unreadCount > 0 ? unreadCount : undefined}
        />
      ))}
    </PillRow>
  );

  const renderListItem = ({ item }: { item: NotifListItem }) => {
    if (item.kind === "group") {
      return (
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {item.label.toUpperCase()}
          </Text>
        </View>
      );
    }
    const n = item.n;
    const config = getNotificationTypeConfig(n.type);
    return (
      <View style={{ paddingHorizontal: 20, marginBottom: item.last ? 0 : 8 }}>
        <Swipeable
          renderRightActions={editMode ? undefined : renderRightActions(n.id)}
          enabled={!editMode}
        >
          <Pressable
            style={[styles.notifCard, { backgroundColor: colors.card }]}
            onPress={() => {
              if (editMode) return;
              handlePress(n);
            }}
          >
            {editMode && (
              <Animated.View
                style={[
                  styles.checkbox,
                  {
                    opacity: selectAnim,
                    transform: [
                      {
                        scale: selectAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.7, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Host matchContents>
                  <Checkbox
                    value={selectedIds.has(n.id)}
                    onValueChange={() => handlePress(n)}
                  />
                </Host>
              </Animated.View>
            )}
            {!n.is_read && <View style={styles.unreadDot} />}
            <View style={[styles.iconBadge, { backgroundColor: config.bg }]}>
              <Lucide
                name={config.icon as any}
                size={18}
                color={config.color}
              />
            </View>
            <View style={styles.notifInfo}>
              <Text style={[styles.notifTitle, { color: colors.text }]}>
                {n.title}
              </Text>
              <Text
                style={[styles.notifDesc, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {n.body}
              </Text>
            </View>
            <Text style={[styles.notifTime, { color: colors.textSecondary }]}>
              {formatTime(n.created_at)}
            </Text>
          </Pressable>
        </Swipeable>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Toolbar placement="right" backgroundColor={colors.background}>
        <Stack.Toolbar.Menu
          icon={process.env.EXPO_OS === "ios" ? "ellipsis.circle" : MoreVert}
        >
          {NOTIFICATION_TYPE_CONFIG.map((type) => (
            <Stack.Toolbar.MenuAction
              key={type.id}
              icon={getMenuIcon(type.id)}
              isOn={
                type.id === "system"
                  ? true
                  : (typeTogglesFromServer[type.id] ?? true)
              }
              disabled={type.id === "system"}
              onPress={() => handleTogglePref(type.id)}
            >
              {type.label}
            </Stack.Toolbar.MenuAction>
          ))}

          {/* A custom toolbar view took the menu button with it, so the menu
              holds only these toggles and the screen's own actions live in
              the content below the header. */}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      {/* Screen actions — kept in the content rather than the header so they
          are one tap away and survive without a custom toolbar view. */}
      {editMode ? (
        <Animated.View
          style={[
            styles.editToolbar,
            {
              backgroundColor: colors.card,
              opacity: selectAnim,
              transform: [
                {
                  translateY: selectAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            },
          ]}
        >
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
          <View style={styles.editToolbarRight}>
            {selectedIds.size > 0 && (
              <Pressable onPress={handleBatchDelete} hitSlop={8}>
                <Text style={styles.deleteLink}>Delete</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                setEditMode(false);
                setSelectedIds(new Set());
              }}
              hitSlop={8}
            >
              <Text style={styles.doneLink}>Done</Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <View
          style={[styles.actionRow, { borderBottomColor: colors.backgroundElement }]}
        >
          <Pressable
            style={styles.actionBtn}
            onPress={() => markAllMutation.mutate()}
            disabled={unreadCount === 0 || markAllMutation.isPending}
            hitSlop={6}
          >
            <Lucide
              name="check-check"
              size={15}
              color={unreadCount === 0 ? "#6b7280" : "#3b82f6"}
            />
            <Text
              style={[
                styles.actionBtnText,
                {
                  color: unreadCount === 0 ? "#6b7280" : "#3b82f6",
                },
              ]}
            >
              {markAllMutation.isPending
                ? "Marking read..."
                : unreadCount > 0
                  ? `Mark all read (${unreadCount})`
                  : "All caught up"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => setEditMode(true)}
            hitSlop={6}
          >
            <Lucide name="check-square" size={15} color="#3b82f6" />
            <Text style={[styles.actionBtnText, { color: "#3b82f6" }]}>
              Select
            </Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={listItems}
        keyExtractor={(item) =>
          item.kind === "group" ? `g-${item.label}` : `n-${item.n.id}`
        }
        renderItem={renderListItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              size="small"
              color="#3b82f6"
              style={{ marginTop: 40 }}
            />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
      />

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
  doneLink: { color: "#3b82f6", fontSize: 14, fontWeight: "600" },
  editToolbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  actionBtnText: { fontSize: 13, fontWeight: "600" },
  filterTabsWrap: {
    marginTop: 12,
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
