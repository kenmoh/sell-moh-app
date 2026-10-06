import { assignEmployeeRole, setEmployeeStatus } from "@/api/auth";
import AppBottomSheet from "@/components/bottom-sheet";
import Pill from "@/components/pill";
import { Colors, type ColorPalette } from "@/constants/theme";
import { useToast } from "@/hooks/use-toast";
import type { Employee, FetchTenantRoles } from "@/types/auth";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type Props = {
  /** The parent mounts this per employee, so state initialises once from it. */
  employee: Employee;
  roles: FetchTenantRoles[];
  onClose: () => void;
};

const initialsOf = (fullName: string | null, email: string) => {
  const source = (fullName ?? "").trim() || email.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/**
 * Details for one employee: who they are, what role they hold, and whether the
 * account is active.
 *
 * Role and status are the two things that decide whether someone can work, and
 * both were unreachable from the staff list — the row had no tap target at all.
 * Changing either invalidates the employees and roles queries, because the list
 * shows the very values being edited.
 */
const EmployeeSheet = ({ employee, roles, onClose }: Props) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];
  const queryClient = useQueryClient();
  const toast = useToast();

  const [pendingRole, setPendingRole] = useState<string | null>(null);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["employees"] });
    void queryClient.invalidateQueries({ queryKey: ["roles"] });
  };

  const assign = useMutation({
    mutationFn: async () => {
      if (!pendingRole) return;
      await assignEmployeeRole(employee.id, pendingRole);
    },
    onSuccess: () => {
      toast.success("Role updated");
      setPendingRole(null);
      refresh();
    },
    onError: (error: Error) => toast.error("Could not change role", error.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async () => {
      const next = employee.is_active ? "suspended" : "active";
      await setEmployeeStatus(employee.id, { status: next as "active" | "suspended" });
    },
    onSuccess: () => {
      toast.success("Status updated");
      refresh();
    },
    onError: (error: Error) => toast.error("Could not change status", error.message),
  });

  const currentRole = employee.role.split(",")[0].trim();
  const selectedRole = pendingRole ?? currentRole;
  const dirty = pendingRole !== null && pendingRole !== currentRole;

  return (
    <AppBottomSheet
      visible
      onVisibleChange={(next) => {
        if (!next) onClose();
      }}
      snapPoints={["55%", "85%"]}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.avatarText, { color: colors.buttonPrimary }]}>
            {initialsOf(employee.full_name, employee.email)}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.name, { color: colors.text }]}>
            {employee.full_name?.trim() || employee.email}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {employee.email}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: employee.is_active
                ? "rgba(22,163,74,0.12)"
                : "rgba(107,114,128,0.12)",
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: employee.is_active ? "#16a34a" : "#6b7280" },
            ]}
          >
            {employee.is_active ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            ROLE
          </Text>
          <View style={styles.pills}>
            {roles.map((role) => (
              <Pill
                key={role.id}
                label={role.name}
                icon="shield"
                active={selectedRole === role.name}
                onPress={() => setPendingRole(role.name)}
              />
            ))}
          </View>
          {roles.length === 0 && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              No roles yet. Create one on the roles list first.
            </Text>
          )}
        </View>

        {employee.last_login_at && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              LAST SIGN-IN
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {new Date(employee.last_login_at).toLocaleString()}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        {dirty && (
          <Pressable
            style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
            disabled={assign.isPending}
            onPress={() => assign.mutate()}
          >
            {assign.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Lucide name="check" size={16} color="#fff" />
                <Text style={styles.buttonText}>Save role</Text>
              </>
            )}
          </Pressable>
        )}
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: employee.is_active
                ? "rgba(220,38,38,0.1)"
                : "rgba(22,163,74,0.12)",
            },
          ]}
          disabled={toggleStatus.isPending}
          onPress={() => toggleStatus.mutate()}
        >
          {toggleStatus.isPending ? (
            <ActivityIndicator color={colors.textSecondary} />
          ) : (
            <>
              <Lucide
                name={employee.is_active ? "ban" : "check"}
                size={16}
                color={employee.is_active ? "#dc2626" : "#16a34a"}
              />
              <Text
                style={[
                  styles.buttonText,
                  { color: employee.is_active ? "#dc2626" : "#16a34a" },
                ]}
              >
                {employee.is_active ? "Suspend access" : "Reactivate"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </AppBottomSheet>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "700" },
  headerInfo: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  content: { gap: 18, paddingTop: 18, paddingBottom: 8 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  value: { fontSize: 13 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  hint: { fontSize: 11, lineHeight: 16 },
  actions: { gap: 8, marginTop: 12 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 14,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

export default EmployeeSheet;