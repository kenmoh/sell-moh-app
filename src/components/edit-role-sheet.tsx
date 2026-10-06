import { getPermissions, setRolePermissions, updateRole } from "@/api/auth";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors, type ColorPalette } from "@/constants/theme";
import { useToast } from "@/hooks/use-toast";
import type { FetchTenantRoles, Permissions } from "@/types/auth";
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

type PermissionRow = NonNullable<Permissions["data"]>[number];

type Props = {
  /** The parent mounts this per role, so state initialises once from it. */
  role: FetchTenantRoles;
  onClose: () => void;
};

/**
 * Roles the tenant was seeded with rather than created. Editing one is allowed,
 * but stripping permissions from a role that came pre-seeded can lock staff out
 * of everyday work, so it takes an explicit confirmation rather than one tap.
 */
const SEEDED_ROLES = new Set(["owner", "manager", "cashier", "inventory", "viewer"]);

const isPinRequiredError = (message: string) =>
  message.includes("supervisor_pin_required") || message.toLowerCase().includes("pin");

/**
 * Edit a role's details and permission set.
 *
 * The permission list is grouped by resource so a role reads as "these are the
 * things this role can touch" rather than a flat wall of 75 strings. The
 * supervisor PIN field appears only when the server asks for it: the client
 * cannot know the caller's rank, and role names are configurable, so the
 * honest signal is the 403.
 */
const EditRoleSheet = ({ role, onClose }: Props) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];
  const queryClient = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? "");
  const [selected, setSelected] = useState<string[]>(role.permissions ?? []);
  const [filter, setFilter] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const { data: permissionsData, isLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
    staleTime: 300_000,
  });

  // Dedupe by id: the group map and the chip keys are both derived from this,
  // and a repeated permission row would render two children sharing a key.
  const permissions = useMemo(() => {
    const seen = new Map<string, PermissionRow>();
    (permissionsData?.data ?? []).forEach((permission) => {
      if (!seen.has(permission.id)) seen.set(permission.id, permission);
    });
    return [...seen.values()];
  }, [permissionsData]);

  const granted = useMemo(
    () => new Set(permissions.filter((p) => selected.includes(p.name)).map((p) => p.id)),
    [permissions, selected],
  );

  const grouped = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const map = new Map<string, typeof permissions>();
    permissions
      .filter(
        (p) =>
          !needle ||
          p.name.toLowerCase().includes(needle) ||
          (p.description ?? "").toLowerCase().includes(needle),
      )
      .forEach((p) => {
        const resource = p.name.split(":")[0];
        map.set(resource, [...(map.get(resource) ?? []), p]);
      });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions, filter]);

  const toggle = (id: string, name: string) =>
    setSelected((current) =>
      current.includes(name)
        ? current.filter((p) => p !== name)
        : [...current, name],
    );

  const save = useMutation({
    mutationFn: async () => {
      const ids = permissions.filter((p) => selected.includes(p.name)).map((p) => p.id);
      // Details first: a renamed role with unsaved permissions is still a
      // consistent role, whereas permissions alone would silently apply to the
      // old name.
      await updateRole({ id: role.id, name: name.trim(), description: description.trim() || null });
      return setRolePermissions(role.id, ids, pin || undefined);
    },
    onSuccess: () => {
      toast.success("Role updated", `${name} now grants ${selected.length} permissions.`);
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: (error: Error) => {
      if (isPinRequiredError(error.message)) {
        setShowPin(true);
        setConfirming(false);
        toast.error("Supervisor PIN required", error.message);
        return;
      }
      toast.error("Could not update role", error.message);
    },
  });

  const isSeeded = SEEDED_ROLES.has(role.name.toLowerCase());
  const changed = useMemo(
    () =>
      name.trim() !== role.name ||
      (description.trim() || null) !== role.description ||
      selected.length !== (role.permissions?.length ?? 0) ||
      selected.some((p) => !(role.permissions ?? []).includes(p)),
    [name, description, selected, role],
  );
  const canSubmit = name.trim().length > 0 && changed && !save.isPending;

  return (
    <AppBottomSheet
      visible
      onVisibleChange={(next) => {
        if (!next) onClose();
      }}
      snapPoints={["70%", "95%"]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Edit Role</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {selected.length} of {permissions.length} permissions granted
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <AppTextInput
            placeholder="Role name"
            value={name}
            onChangeText={setName}
            leftIcon="shield"
            autoCapitalize="words"
          />
          <AppTextInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            leftIcon="align-left"
            autoCapitalize="sentences"
          />
        </View>

        {showPin && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Supervisor PIN
            </Text>
            <AppTextInput
              placeholder="4-6 digits"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              leftIcon="lock"
            />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Changing permissions changes what everyone holding this role can
              do, so it needs a supervisor unless you are the owner.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            PERMISSIONS
          </Text>
          <AppTextInput
            placeholder="Filter permissions"
            value={filter}
            onChangeText={setFilter}
            leftIcon="search"
            autoCapitalize="none"
          />

          {isLoading ? (
            <ActivityIndicator color={colors.buttonPrimary} style={{ padding: 20 }} />
          ) : (
            grouped.map(([resource, items]) => (
              <View key={resource} style={styles.group}>
                <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>
                  {resource}
                </Text>
                <View style={styles.chips}>
                  {items.map((permission) => {
                    const isOn = granted.has(permission.id);
                    return (
                      <Pressable
                        key={`${resource}:${permission.name}`}
                        onPress={() => toggle(permission.id, permission.name)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isOn
                              ? colors.buttonPrimary
                              : colors.backgroundElement,
                          },
                        ]}
                      >
                        {isOn && (
                          <Lucide name="check" size={11} color="#fff" />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            { color: isOn ? "#fff" : colors.textSecondary },
                          ]}
                        >
                          {permission.name.split(":")[1] ?? permission.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {confirming ? (
        <View style={[styles.confirmBox, { borderColor: "#f59e0b" }]}>
          <Text style={[styles.confirmTitle, { color: colors.text }]}>
            {role.name} is a built-in role
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {selected.length === 0
              ? "This will strip every permission from it and may lock its holders out."
              : "Changing a built-in role affects everyone who already holds it."}
          </Text>
          <View style={styles.confirmRow}>
            <Pressable
              style={[styles.button, { backgroundColor: colors.backgroundElement }]}
              onPress={() => setConfirming(false)}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: "#f59e0b" }]}
              disabled={save.isPending}
              onPress={() => save.mutate()}
            >
              {save.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Apply anyway</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={[
            styles.submit,
            {
              backgroundColor: colors.buttonPrimary,
              opacity: canSubmit ? 1 : 0.5,
            },
          ]}
          disabled={!canSubmit}
          onPress={() => (isSeeded ? setConfirming(true) : save.mutate())}
        >
          <Lucide name="check" size={18} color="#fff" />
          <Text style={styles.submitText}>Save Changes</Text>
        </Pressable>
      )}
    </AppBottomSheet>
  );
};

const styles = StyleSheet.create({
  header: { gap: 4, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: "700" },
  subtitle: { fontSize: 13 },
  content: { gap: 18, paddingBottom: 12 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  hint: { fontSize: 11, lineHeight: 16 },
  group: { gap: 6, marginTop: 6 },
  groupLabel: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { fontSize: 11, fontWeight: "600" },
  confirmBox: {
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  confirmTitle: { fontSize: 14, fontWeight: "700" },
  confirmRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  button: {
    flex: 1,
    alignItems: "center",
    borderRadius: 50,
    paddingVertical: 12,
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  submit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 16,
    marginTop: 14,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

export default EditRoleSheet;