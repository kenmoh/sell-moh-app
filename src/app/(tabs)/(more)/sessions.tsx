import { listSessions, revokeSession, SessionItem } from "@/api/auth";
import { Colors } from "@/constants/theme";
import { useSession } from "@/lib/ctx";
import { useToast } from "@/hooks/use-toast";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatDevice(item: SessionItem): string {
  if (item.device_name) return item.device_name;
  const ua = item.user_agent ?? "";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android Device";
  if (ua.includes("Windows")) return "Windows PC";
  if (ua.includes("Mac")) return "Mac";
  return "Unknown Device";
}

function initialOf(item: SessionItem): string {
  return (item.employee_name || item.email || "?").trim().charAt(0).toUpperCase();
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function relTime(iso: string | null): string {
  if (!iso) return "never";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "never";
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return "active now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function SessionsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useSession();

  const { data: sessions, isPending } = useQuery({
    queryKey: ["sessions"],
    queryFn: listSessions,
  });

  const { mutate: revoke, isPending: isRevoking } = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Revoked", "Session removed");
    },
    onError: (e: any) => {
      toast.error("Error", e.message || "Failed to revoke session");
    },
  });

  // Signed-in sessions first so whoever is on the floor is at the top.
  const ordered = [...(sessions ?? [])].sort((a, b) => {
    const mine = a.user_id === (user?.user_id ?? "") ? 0 : 1;
    const yours = b.user_id === (user?.user_id ?? "") ? 0 : 1;
    return mine - yours;
  });

  const handleRevoke = (id: string) => {
    revoke(id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isPending ? (
        <ActivityIndicator
          color={colors.buttonPrimary}
          size="large"
          style={{ flex: 1, justifyContent: "center" }}
        />
      ) : (
        <FlatList
          data={ordered}
          keyExtractor={(item) => `${item.user_id}:${item.id}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 20,
          }}
          renderItem={({ item }) => {
            const isMe = item.user_id === user?.user_id;
            return (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: colors.backgroundElement },
                    ]}
                  >
                    <Text style={[styles.avatarText, { color: colors.text }]}>
                      {initialOf(item)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[styles.deviceName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.employee_name || item.email || "Unknown"}
                      </Text>
                      {isMe && (
                        <View style={styles.meTag}>
                          <Text style={styles.meTagText}>You</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.deviceMeta, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {formatDevice(item)} · {item.ip_address || "Unknown IP"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleRevoke(item.id)}
                    disabled={isRevoking}
                    style={[
                      styles.revokeBtn,
                      { backgroundColor: "rgba(220,38,38,0.1)" },
                    ]}
                  >
                    <Lucide name="log-out" size={14} color="#dc2626" />
                  </Pressable>
                </View>
                <View
                  style={[
                    styles.cardFooter,
                    { borderTopColor: colors.backgroundElement },
                  ]}
                >
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    Signed in {formatTime(item.created_at)}
                  </Text>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {relTime(item.last_active_at)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Lucide name="shield-check" size={36} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No active sessions
              </Text>
              <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                Each person is signed in on one device at a time. Sessions
                appear here when someone signs in.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 14, padding: 14, marginBottom: 10, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "600" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  deviceName: { fontSize: 14, fontWeight: "600" },
  meTag: {
    backgroundColor: "#5e33cb",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  meTagText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  deviceMeta: { fontSize: 12, marginTop: 2 },
  revokeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  metaText: { fontSize: 11 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "500" },
  emptyHint: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },
});
