import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

interface Account {
  id: string;
  code: string;
  name: string;
  account_type: string;
  status: string;
}

interface Props {
  visible: boolean;
  onVisibleChange: (v: boolean) => void;
  account: Account;
  onRename: (accountId: string, name: string) => void;
  onToggleStatus: (accountId: string, status: "active" | "inactive") => void;
  onDelete: (accountId: string) => void;
  isRenaming?: boolean;
  isToggling?: boolean;
  isDeleting?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  asset: "#10b981",
  liability: "#ef4444",
  equity: "#8b5cf6",
  revenue: "#3b82f6",
  expense: "#f59e0b",
};

const AccountActionSheet = ({
  visible,
  onVisibleChange,
  account,
  onRename,
  onToggleStatus,
  onDelete,
  isRenaming,
  isToggling,
  isDeleting,
}: Props) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors = Colors[isDark ? "dark" : "light"];

  const [editingName, setEditingName] = useState(account.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const typeColor =
    TYPE_COLORS[account.account_type.toLowerCase()] ?? "#6b7280";
  const isActive = account.status === "active";

  return (
    <AppBottomSheet
      visible={visible}
      onVisibleChange={(v) => {
        onVisibleChange(v);
        if (!v) setConfirmDelete(false);
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: typeColor }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.code, { color: colors.text }]}>
            {account.code}
          </Text>
          <Text style={[styles.type, { color: colors.textSecondary }]}>
            {account.account_type}
          </Text>
        </View>
      </View>

      {/* Rename */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        RENAME
      </Text>
      <View style={styles.renameRow}>
        <View style={{ flex: 1 }}>
          <AppTextInput
            value={editingName}
            onChangeText={setEditingName}
            placeholder="Account name"
          />
        </View>
        <Pressable
          onPress={() => onRename(account.id, editingName)}
          disabled={editingName === account.name || !editingName.trim() || isRenaming}
          style={[
            styles.renameBtn,
            {
              backgroundColor:
                editingName !== account.name && editingName.trim()
                  ? colors.buttonPrimary
                  : colors.backgroundElement,
            },
          ]}
        >
          {isRenaming ? (
            <ActivityIndicator size={16} color="#fff" />
          ) : (
            <Lucide
              name="check"
              size={18}
              color={
                editingName !== account.name && editingName.trim()
                  ? "#fff"
                  : colors.textSecondary
              }
            />
          )}
        </Pressable>
      </View>

      {/* Toggle Status */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        STATUS
      </Text>
      <Pressable
        onPress={() =>
          onToggleStatus(account.id, isActive ? "inactive" : "active")
        }
        disabled={isToggling}
        style={({ pressed }) => [
          styles.actionRow,
          {
            backgroundColor: colors.backgroundElement,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Lucide
          name={isActive ? "pause-circle" : "play-circle"}
          size={20}
          color={isActive ? "#f59e0b" : "#10b981"}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.actionTitle, { color: colors.text }]}>
            {isActive ? "Deactivate" : "Activate"}
          </Text>
          <Text
            style={[styles.actionSubtitle, { color: colors.textSecondary }]}
          >
            {isActive
              ? "Hide from dropdowns and reports"
              : "Make visible in dropdowns and reports"}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isActive
                ? "rgba(245,158,11,0.12)"
                : "rgba(16,185,129,0.12)",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: isActive ? "#f59e0b" : "#10b981" },
            ]}
          >
            {account.status}
          </Text>
        </View>
      </Pressable>

      {/* Delete */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        DELETE
      </Text>
      {!confirmDelete ? (
        <Pressable
          onPress={() => setConfirmDelete(true)}
          style={({ pressed }) => [
            styles.actionRow,
            {
              backgroundColor: colors.backgroundElement,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Lucide name="trash-2" size={20} color="#ef4444" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionTitle, { color: "#ef4444" }]}>
              Delete Account
            </Text>
            <Text
              style={[styles.actionSubtitle, { color: colors.textSecondary }]}
            >
              Permanently remove this account
            </Text>
          </View>
        </Pressable>
      ) : (
        <View
          style={[
            styles.confirmBox,
            { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "#ef4444" },
          ]}
        >
          <Text style={[styles.confirmText, { color: colors.text }]}>
            Delete <Text style={{ fontWeight: "700" }}>{account.code}</Text> —{" "}
            {account.name}?
          </Text>
          <Text
            style={[styles.confirmHint, { color: colors.textSecondary }]}
          >
            This cannot be undone. Accounts with journal entries cannot be
            deleted.
          </Text>
          <View style={styles.confirmActions}>
            <Pressable
              onPress={() => setConfirmDelete(false)}
              style={[styles.confirmBtn, { backgroundColor: colors.backgroundElement }]}
            >
              <Text style={[styles.confirmBtnText, { color: colors.text }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onDelete(account.id)}
              disabled={isDeleting}
              style={[styles.confirmBtn, { backgroundColor: "#ef4444" }]}
            >
              {isDeleting ? (
                <ActivityIndicator size={16} color="#fff" />
              ) : (
                <Text style={[styles.confirmBtnText, { color: "#fff" }]}>
                  Delete
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </AppBottomSheet>
  );
};

export default AccountActionSheet;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  code: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  type: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  renameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  renameBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    marginLeft: "auto",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  confirmBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  confirmHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 8,
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
