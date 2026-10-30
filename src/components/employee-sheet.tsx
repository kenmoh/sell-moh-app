import {
  assignEmployeeRole,
  forceSignOut,
  getEmployeeRoles,
  removeEmployeeRole,
  setEmployeeStatus,
} from "@/api/auth";
import AppBottomSheet from "@/components/bottom-sheet";
import { Button } from "@/components/button";
import Pill from "@/components/pill";
import { Colors, type ColorPalette } from "@/constants/theme";
import { useToast } from "@/hooks/use-toast";
import type { Employee, FetchTenantRoles } from "@/types/auth";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
 * Details for one employee: who they are, which roles they hold, and whether
 * the account is active.
 *
 * A user can hold several roles; the chips below toggle membership. Save sends
 * one call for every added role and one for every removed one, leaving the
 * untouched assignments alone — replacing them wholesale would silently drop
 * what the employee already holds (which is exactly what broke before).
 *
 * Role and status are the two things that decide whether someone can work.
 * Changing either invalidates the employees and roles queries, because the
 * list shows the very values being edited.
 */
const EmployeeSheet = ({ employee, roles, onClose }: Props) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];
  const queryClient = useQueryClient();
  const toast = useToast();

  // Null means nothing pending: chips then show what the employee holds.
  const [pendingRoles, setPendingRoles] = useState<string[] | null>(null);

  const { data: heldRoles } = useQuery({
    queryKey: ["employee-roles", employee.id],
    queryFn: () => getEmployeeRoles(employee.id),
  });

  const heldNames = useMemo(
    () => (heldRoles ?? []).map((r) => r.name),
    [heldRoles],
  );

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["employees"] });
    void queryClient.invalidateQueries({ queryKey: ["roles"] });
    void queryClient.invalidateQueries({
      queryKey: ["employee-roles", employee.id],
    });
  };

  const applyChanges = useMutation({
    mutationFn: async () => {
      if (!pendingRoles) return;
      const added = pendingRoles.filter((name) => !heldNames.includes(name));
      const removed = heldNames.filter((name) => !pendingRoles.includes(name));
      for (const name of added) {
        await assignEmployeeRole(employee.id, name);
      }
      for (const name of removed) {
        await removeEmployeeRole(employee.id, name);
      }
    },
    onSuccess: () => {
      toast.success("Roles updated");
      setPendingRoles(null);
      refresh();
    },
    onError: (error: Error) => {
      toast.error("Could not update roles", error.message);
      setPendingRoles(null);
      refresh();
    },
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

  const signOutEverywhere = useMutation({
    mutationFn: () => forceSignOut(employee.id),
    onSuccess: () => {
      toast.success("Signed out", `${employee.full_name || employee.email} leaves every device`);
      refresh();
    },
    onError: (error: Error) => toast.error("Could not sign out", error.message),
  });

  // While the per-employee query is still loading, the list's summary field
  // (comma separated) keeps the chips accurate enough to stay interactive.
  const selected =
    pendingRoles ??
    (heldNames.length > 0
      ? heldNames
      : employee.role
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean));
  const dirty =
    pendingRoles !== null &&
    (pendingRoles.some((name) => !heldNames.includes(name)) ||
      heldNames.some((name) => !pendingRoles.includes(name)));

  const toggleRole = (name: string) => {
    const base = pendingRoles ?? heldNames;
    setPendingRoles(
      base.includes(name) ? base.filter((r) => r !== name) : [...base, name],
    );
  };

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
            ROLES
          </Text>
          <View style={styles.pills}>
            {roles.map((role) => (
              <Pill
                key={role.id}
                label={role.name}
                icon="shield"
                active={selected.includes(role.name)}
                onPress={() => toggleRole(role.name)}
              />
            ))}
          </View>
          {roles.length === 0 && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              No roles yet. Create one on the roles list first.
            </Text>
          )}
          {roles.length > 0 && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Tap to grant or take away a role; multiple can be on at once.
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
          <Button
            fullWidth
            leftIcon={(color) => <Lucide name="check" size={16} color={color} />}
            loading={applyChanges.isPending}
            onPress={() => applyChanges.mutate()}
            title="Save roles"
          />
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
        <Pressable
          style={[styles.button, { backgroundColor: "rgba(220,38,38,0.1)" }]}
          disabled={signOutEverywhere.isPending}
          onPress={() => signOutEverywhere.mutate()}
        >
          {signOutEverywhere.isPending ? (
            <ActivityIndicator color={colors.textSecondary} />
          ) : (
            <>
              <Lucide name="log-out" size={16} color="#dc2626" />
              <Text style={[styles.buttonText, { color: "#dc2626" }]}>
                Sign out everywhere
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