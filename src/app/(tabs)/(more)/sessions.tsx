import { listSessions, revokeSession } from "@/api/auth";
import { Colors } from "@/constants/theme";
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

function formatDevice(ua: string | null): string {
  if (!ua) return "Unknown Device";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android Device";
  if (ua.includes("Windows")) return "Windows PC";
  if (ua.includes("Mac")) return "Mac";
  return "Unknown Device";
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

export default function SessionsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const toast = useToast();

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
          data={sessions ?? []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 20,
          }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.deviceIcon,
                    { backgroundColor: colors.backgroundElement },
                  ]}
                >
                  <Lucide
                    name={
                      (formatDevice(item.device_name) === "iPhone"
                        ? "smartphone"
                        : formatDevice(item.device_name) === "Android"
                          ? "smartphone"
                          : "monitor") as any
                    }
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.deviceName, { color: colors.text }]}>
                    {item.device_name || formatDevice(item.user_agent)}
                  </Text>
                  <Text
                    style={[styles.deviceMeta, { color: colors.textSecondary }]}
                  >
                    {item.ip_address || "Unknown IP"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleRevoke(item.id)}
                  disabled={isRevoking}
                  style={[styles.revokeBtn, { backgroundColor: "rgba(220,38,38,0.1)" }]}
                >
                  <Lucide name="log-out" size={14} color="#dc2626" />
                </Pressable>
              </View>
              <View style={[styles.cardFooter, { borderTopColor: colors.backgroundElement }]}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  Created: {formatTime(item.created_at)}
                </Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  Active: {formatTime(item.last_active_at)}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Lucide name="shield-check" size={36} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No active sessions
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
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceName: { fontSize: 14, fontWeight: "600" },
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
});
