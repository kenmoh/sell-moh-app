import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface StaffMember {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  roleColor: string;
  roleBg: string;
  active: boolean;
}

interface Role {
  id: string;
  name: string;
  iconColor: string;
  iconBg: string;
  permissions: string;
  memberCount: number;
}

const staff: StaffMember[] = [
  { id: "1", name: "Amaka Okonkwo", initials: "AO", avatarColor: "#3b82f6", role: "Store Manager", roleColor: "#3b82f6", roleBg: "rgba(59,130,246,0.1)", active: true },
  { id: "2", name: "Chidi Okafor", initials: "CO", avatarColor: "#ef4444", role: "Cashier", roleColor: "#6b7280", roleBg: "rgba(107,114,128,0.1)", active: true },
  { id: "3", name: "Ngozi Adeyemi", initials: "NA", avatarColor: "#a855f7", role: "Cashier", roleColor: "#6b7280", roleBg: "rgba(107,114,128,0.1)", active: false },
  { id: "4", name: "Emeka Bello", initials: "EB", avatarColor: "#f97316", role: "Supervisor", roleColor: "#d97706", roleBg: "rgba(217,119,6,0.1)", active: false },
  { id: "5", name: "Fatima Yusuf", initials: "FY", avatarColor: "#14b8a6", role: "Cashier", roleColor: "#6b7280", roleBg: "rgba(107,114,128,0.1)", active: false },
];

const roles: Role[] = [
  { id: "1", name: "Store Manager", iconColor: "#3b82f6", iconBg: "rgba(59,130,246,0.1)", permissions: "Full access", memberCount: 1 },
  { id: "2", name: "Supervisor", iconColor: "#f97316", iconBg: "rgba(249,115,22,0.1)", permissions: "Limited admin", memberCount: 1 },
  { id: "3", name: "Cashier", iconColor: "#6b7280", iconBg: "rgba(107,114,128,0.1)", permissions: "POS only", memberCount: 3 },
];

const StaffRoles = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [search, setSearch] = useState("");

  const filteredStaff = staff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalStaff = staff.length;
  const activeNow = staff.filter((s) => s.active).length;
  const totalRoles = roles.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Lucide name="chevron-left" size={24} color={colors.text} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Staff & Roles
        </Text>
        <Pressable style={styles.addButton}>
          <Lucide name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={filteredStaff}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ backgroundColor: colors.background }}>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statChip, { backgroundColor: colors.card }]}>
                <View style={[styles.statIcon, { backgroundColor: "rgba(59,130,246,0.1)" }]}>
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
                <View style={[styles.statIcon, { backgroundColor: "rgba(22,163,74,0.1)" }]}>
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
                <View style={[styles.statIcon, { backgroundColor: "rgba(168,85,247,0.1)" }]}>
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

            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: colors.backgroundElement }]}>
              <Lucide name="search" size={18} color={colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search staff..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>

            {/* Staff Members Label */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              STAFF MEMBERS
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.staffCard, { backgroundColor: colors.card }]}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: `${item.avatarColor}18` },
              ]}
            >
              <Text style={[styles.avatarText, { color: item.avatarColor }]}>
                {item.initials}
              </Text>
            </View>
            <View style={styles.staffInfo}>
              <Text style={[styles.staffName, { color: colors.text }]}>
                {item.name}
              </Text>
              <View
                style={[
                  styles.rolePill,
                  { backgroundColor: item.roleBg },
                ]}
              >
                <Text style={[styles.roleText, { color: item.roleColor }]}>
                  {item.role}
                </Text>
              </View>
            </View>
            <View style={styles.staffRight}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: item.active ? "#16a34a" : "#d1d5db",
                  },
                ]}
              />
              <Lucide name="chevron-right" size={18} color={colors.textSecondary} />
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 10 }}>
            {/* Roles Label */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              ROLES
            </Text>

            {/* Roles */}
            {roles.map((role) => (
              <Pressable
                key={role.id}
                style={[styles.roleCard, { backgroundColor: colors.card }]}
              >
                <View
                  style={[
                    styles.roleIcon,
                    { backgroundColor: role.iconBg },
                  ]}
                >
                  <Lucide name="shield" size={20} color={role.iconColor} />
                </View>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleName, { color: colors.text }]}>
                    {role.name}
                  </Text>
                  <Text style={[styles.rolePermissions, { color: colors.textSecondary }]}>
                    {role.permissions}
                  </Text>
                </View>
                <View style={styles.roleRight}>
                  <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
                    {role.memberCount} {role.memberCount === 1 ? "member" : "members"}
                  </Text>
                  <Lucide name="chevron-right" size={18} color={colors.textSecondary} />
                </View>
              </Pressable>
            ))}
          </View>
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
        }}
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
    paddingHorizontal: 20,
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
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
  statusDot: { width: 8, height: 8, borderRadius: 4 },
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
