import { createRole, getPermissions } from "@/api/auth";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { CreateRole } from "@/types/auth";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
};

const RANK_OPTIONS = [20, 40, 60, 80, 100];

const AddRoleSheet = ({ visible, onVisibleChange }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rank, setRank] = useState<number>(0);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permFilter, setPermFilter] = useState("");

  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
    enabled: visible,
  });

  const { mutate: createRoleMutation, isPending } = useMutation({
    mutationFn: (data: CreateRole) => createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onVisibleChange(false);
      reset();
    },
    onError: (error) => {
      console.error("Failed to create role", error);
      // Ideally show a toast here
    },
  });

  const permissions = permissionsData?.data || [];

  const filteredPermissions = permissions.filter(
    (p) =>
      p.name.toLowerCase().includes(permFilter.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(permFilter.toLowerCase())),
  );

  const togglePermission = (id: string) => {
    setSelectedPermissions((current) =>
      current.includes(id) ? current.filter((p) => p !== id) : [...current, id],
    );
  };

  const reset = () => {
    setName("");
    setDescription("");
    setRank(0);
    setSelectedPermissions([]);
  };

  const handleCreate = () => {
    if (!name.trim()) return;

    createRoleMutation({
      name: name.trim(),
      description: description.trim() || null,
      rank,
      permission_ids: selectedPermissions,
    });
  };

  const canSubmit = name.trim().length > 0 && rank > 0 && !isPending;

  return (
    <AppBottomSheet
      snapPoints={["80%", "100%"]}
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>New Role</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Create a new role and assign permissions
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Role Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Role Details
          </Text>
          <AppTextInput
            placeholder="Role Name (e.g. Manager)"
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

        {/* Rank */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Rank
          </Text>
          <View style={styles.rankRow}>
            {RANK_OPTIONS.map((r) => {
              const isActive = rank === r;
              return (
                <Pressable
                  key={r}
                  style={[
                    styles.rankPill,
                    {
                      backgroundColor: isActive
                        ? colors.buttonPrimary
                        : colors.backgroundElement,
                    },
                  ]}
                  onPress={() => setRank(isActive ? 0 : r)}
                >
                  <Text
                    style={[
                      styles.rankPillText,
                      { color: isActive ? "#fff" : colors.text },
                    ]}
                  >
                    {r}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Permissions
          </Text>

          {isLoadingPermissions ? (
            <ActivityIndicator
              color={colors.buttonPrimary}
              style={{ padding: 20 }}
            />
          ) : (
            <>
              <View style={styles.permFilterWrap}>
                <Lucide name="search" size={14} color={colors.textSecondary} />
                <TextInput
                  placeholder="Filter permissions..."
                  placeholderTextColor={colors.textSecondary}
                  value={permFilter}
                  onChangeText={setPermFilter}
                  style={[styles.permFilterInput, { color: colors.text }]}
                />
                {permFilter.length > 0 && (
                  <Pressable onPress={() => setPermFilter("")}>
                    <Lucide name="x" size={14} color={colors.textSecondary} />
                  </Pressable>
                )}
              </View>
              <View style={styles.permissionsList}>
                {filteredPermissions.map((perm) => {
                  const isSelected = selectedPermissions.includes(perm.id);
                  return (
                    <Pressable
                      key={perm.id}
                      style={[
                        styles.permissionCard,
                        {
                          backgroundColor: isSelected
                            ? "rgba(34, 197, 94, 0.15)"
                            : colors.backgroundElement,
                          borderColor: isSelected ? "#22c55e" : "transparent",
                          borderWidth: 1.5,
                        },
                      ]}
                      onPress={() => togglePermission(perm.id)}
                    >
                      <Text
                        style={[
                          styles.permissionName,
                          { color: isSelected ? "#22c55e" : colors.text },
                        ]}
                      >
                        {perm.name}
                      </Text>
                      {perm.description ? (
                        <Text
                          style={[
                            styles.permissionDesc,
                            {
                              color: isSelected
                                ? "rgba(34,197,94,0.7)"
                                : colors.textSecondary,
                            },
                          ]}
                        >
                          {perm.description}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Create Button */}
      <Pressable
        style={[
          styles.createBtn,
          {
            backgroundColor: colors.buttonPrimary,
            opacity: canSubmit ? 1 : 0.5,
          },
        ]}
        disabled={!canSubmit}
        onPress={handleCreate}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Lucide name="plus" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Create Role</Text>
          </>
        )}
      </Pressable>
    </AppBottomSheet>
  );
};

export default AddRoleSheet;

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    paddingBottom: 16,
  },
  section: {
    gap: 10,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rankRow: {
    flexDirection: "row",
    gap: 8,
  },
  rankPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rankPillText: {
    fontSize: 14,
    fontWeight: "600",
  },
  permissionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  permFilterWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 2.5,
  },
  permFilterInput: {
    flex: 1,
    fontSize: 13,
  },
  permissionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 50,
    maxWidth: "100%",
    flexShrink: 1,
  },
  permissionName: {
    fontSize: 13,
    fontWeight: "600",
  },
  permissionDesc: {
    fontSize: 11,
    flexShrink: 1,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 16,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
