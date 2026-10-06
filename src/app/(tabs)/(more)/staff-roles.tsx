import { fetchTenantRoles, getEmployees } from "@/api/auth";
import EmployeeSheet from "@/components/employee-sheet";
import AddEmployeeSheet from "@/components/add-employee-sheet";
import AddRoleSheet from "@/components/add-role-sheet";
import EditRoleSheet from "@/components/edit-role-sheet";
import RoleCard from "@/components/role-card";
import SearchInput from "@/components/search-input";
import type { Employee, FetchTenantRoles } from "@/types/auth";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
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


const ROLE_TINTS: { bg: string; fg: string }[] = [
  { bg: "rgba(59,130,246,0.1)", fg: "#3b82f6" },
  { bg: "rgba(168,85,247,0.1)", fg: "#a855f7" },
  { bg: "rgba(249,115,22,0.1)", fg: "#f97316" },
  { bg: "rgba(20,184,166,0.1)", fg: "#14b8a6" },
  { bg: "rgba(107,114,128,0.1)", fg: "#6b7280" },
];

const AVATAR_TINTS = ["#a855f7", "#f97316", "#14b8a6", "#3b82f6", "#ec4899"];

const initialsOf = (fullName: string | null, email: string) => {
  const source = (fullName ?? "").trim() || email.split("@")[0] || "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/** Stable index for a string, so a role or person keeps the same colour. */
const tintIndex = (key: string, length: number) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return hash % length;
};

const roleTint = (role: string) => ROLE_TINTS[tintIndex(role, ROLE_TINTS.length)];

const StaffRoles = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [search, setSearch] = useState("");
  const [roleSheetVisible, setRoleSheetVisible] = useState(false);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [employeeSheetVisible, setEmployeeSheetVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<FetchTenantRoles | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const {
    data: rolesData,
    isRefetching,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchTenantRoles,
  });
  const { data: employees, isLoading: isLoadingStaff, refetch: refetchStaff } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const staff = useMemo(
    () =>
      (employees ?? []).map((employee) => {
        const primaryRole = employee.role.split(",")[0].trim() || "No role";
        const tint = roleTint(primaryRole);
        return {
          // Carried through so the row can hand the whole record to the sheet
          // without the sheet having to match it back up by id.
          employee,
          id: employee.id,
          name: employee.full_name?.trim() || employee.email,
          initials: initialsOf(employee.full_name, employee.email),
          avatarColor: AVATAR_TINTS[tintIndex(employee.id, AVATAR_TINTS.length)],
          role: primaryRole,
          roleColor: tint.fg,
          roleBg: tint.bg,
          active: employee.is_active,
        };
      }),
    [employees],
  );

  const totalStaff = staff.length;
  const activeNow = staff.filter((s) => s.active).length;

  const totalRoles = rolesData?.length ?? 0;

  // Holders per role, counted from the real employees. A user can hold several
  // roles, so split the comma-joined list rather than matching on the whole.
  const memberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (employees ?? []).forEach((employee) => {
      employee.role
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
        .forEach((role) => counts.set(role, (counts.get(role) ?? 0) + 1));
    });
    return counts;
  }, [employees]);

  const toggleRole = (roleId: string) =>
    setExpandedRoleId((current) => (current === roleId ? null : roleId));

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()),
  );

  type ListItemType =
    | { type: "sticky_header" }
    | { type: "staff_item"; data: (typeof staff)[number] };

  const flatListData: ListItemType[] = useMemo(() => {
    const items: ListItemType[] = [{ type: "sticky_header" }];
    filteredStaff.forEach((item) => {
      items.push({ type: "staff_item", data: item });
    });
    return items;
  }, [filteredStaff]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Staff & Roles",
          headerRight: () => (
            <Pressable
              style={styles.addButton}
              onPress={() => setEmployeeSheetVisible(true)}
            >
              <Lucide name="plus" size={20} color="#fff" />
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={flatListData}
        keyExtractor={(item, index) =>
          item.type === "sticky_header" ? "sticky_header" : item.data.id
        }
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        refreshing={isRefetching}
        onRefresh={() => {
          void refetchStaff();
          void refetchRoles();
        }}
        ListHeaderComponent={
          <View style={{ backgroundColor: colors.background }}>
            {/* Stats Row - Scrolls away */}
            <View style={styles.statsRow}>
              <View style={[styles.statChip, { backgroundColor: colors.card }]}>
                <View
                  style={[styles.statIcon, { backgroundColor: "rgba(59,130,246,0.1)" }]}
                >
                  <Lucide name="users" size={14} color="#3b82f6" />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Total Staff
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {totalStaff}
                </Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: colors.card }]}>
                <View
                  style={[styles.statIcon, { backgroundColor: "rgba(22,163,74,0.1)" }]}
                >
                  <Lucide name="clock" size={14} color="#16a34a" />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Active Now
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {activeNow}
                </Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: colors.card }]}>
                <View
                  style={[styles.statIcon, { backgroundColor: "rgba(168,85,247,0.1)" }]}
                >
                  <Lucide name="shield" size={14} color="#a855f7" />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Roles
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {totalRoles}
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "sticky_header") {
            return (
              <View
                style={[
                  styles.stickyControlsWrapper,
                  { backgroundColor: colors.background },
                ]}
              >
                <SearchInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search staff..."
                />
                <Text
                  style={[styles.sectionLabel, { color: colors.textSecondary }]}
                >
                  STAFF MEMBERS
                </Text>
              </View>
            );
          }

          const { data: staffMember } = item;
          return (
            <Pressable
              onPress={() => setSelectedEmployee(staffMember.employee)}
              style={[
                styles.staffCard,
                {
                  backgroundColor: colors.card,
                  // An inactive account still belongs here, but it should not
                  // read as one that can be signed into.
                  opacity: staffMember.active ? 1 : 0.55,
                },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: `${staffMember.avatarColor}18` },
                ]}
              >
                <Text style={[styles.avatarText, { color: staffMember.avatarColor }]}>
                  {staffMember.initials}
                </Text>
              </View>
              <View style={styles.staffInfo}>
                <Text style={[styles.staffName, { color: colors.text }]}>
                  {staffMember.name}
                </Text>
                <View style={styles.pillRow}>
                  <View
                    style={[styles.rolePill, { backgroundColor: staffMember.roleBg }]}
                  >
                    <Text style={[styles.roleText, { color: staffMember.roleColor }]}>
                      {staffMember.role}
                    </Text>
                  </View>
                  {!staffMember.active && (
                    <View
                      style={[
                        styles.rolePill,
                        { backgroundColor: "rgba(107,114,128,0.1)" },
                      ]}
                    >
                      <Text style={[styles.roleText, { color: "#6b7280" }]}>
                        Inactive
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.staffRight}>
                <Lucide
                  name="chevron-right"
                  size={18}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          isLoadingStaff ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={colors.textSecondary} />
          ) : (
            <Text
              style={[
                styles.emptyState,
                { color: colors.textSecondary },
              ]}
            >
              No staff yet. Add an employee to give them a role.
            </Text>
          )
        }
        ListFooterComponent={
          <View style={{ paddingTop: 24, gap: 10 }}>
            {/* Roles Label */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                ROLES
              </Text>
              <Pressable
                onPress={() => setRoleSheetVisible(true)}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? "rgba(10,14,18,0.6)"
                      : colors.buttonPrimary,
                    flexDirection: "row",
                    borderRadius: 20,
                    paddingHorizontal: 5,
                    paddingVertical: 5,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Lucide name="plus" size={20} color="#fff" />
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}
                >
                  Add Role
                </Text>
              </Pressable>
            </View>

            {/* Roles */}
            {rolesData?.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                expanded={expandedRoleId === role.id}
                onToggle={toggleRole}
                memberCount={memberCounts.get(role.name)}
                onEdit={() => setEditingRole(role)}
              />
            ))}
          </View>
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 15,
        }}
      />
      <AddRoleSheet
        visible={roleSheetVisible}
        onVisibleChange={setRoleSheetVisible}
      />
      {selectedEmployee && (
        <EmployeeSheet
          key={selectedEmployee.id}
          employee={selectedEmployee}
          roles={rolesData ?? []}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
      {editingRole && (
        <EditRoleSheet
          key={editingRole.id}
          role={editingRole}
          onClose={() => setEditingRole(null)}
        />
      )}
      <AddEmployeeSheet
        visible={employeeSheetVisible}
        onVisibleChange={setEmployeeSheetVisible}
      />
    </View>
  );
};

export default StaffRoles;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  statChip: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontSize: 11, fontWeight: "500" },
  statValue: { fontSize: 16, fontWeight: "800" },
  stickyControlsWrapper: {
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  staffCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "700" },
  staffInfo: { flex: 1, gap: 4 },
  staffName: { fontSize: 15, fontWeight: "600" },
  rolePill: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleText: { fontSize: 11, fontWeight: "600" },
  staffRight: { alignItems: "flex-end", gap: 6 },
  pillRow: { flexDirection: "row", gap: 6 },
  emptyState: { textAlign: "center", fontSize: 13, marginTop: 32, paddingHorizontal: 24 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  roleInfo: { flex: 1, gap: 2 },
  roleName: { fontSize: 15, fontWeight: "700" },
  rolePermissions: { fontSize: 13 },
  roleRight: { alignItems: "flex-end", gap: 4 },
  memberCount: { fontSize: 12 },
});
