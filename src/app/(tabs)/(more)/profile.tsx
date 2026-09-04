import { getPinStatus, setSupervisorPin } from "@/api/auth";
import AppBottomSheet from "@/components/bottom-sheet";
import AppView from "@/components/app-view";
import { Colors } from "@/constants/theme";
import { useSession } from "@/lib/ctx";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const { user } = useSession();
  const queryClient = useQueryClient();

  const [pinSheetVisible, setPinSheetVisible] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  const { data: pinData, error: pinError } = useQuery({
    queryKey: ["pin-status"],
    queryFn: getPinStatus,
  });

  const { mutate: savePin, isPending: isSavingPin } = useMutation({
    mutationFn: (pin: string) => setSupervisorPin(pin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pin-status"] });
      setPinSheetVisible(false);
      setPinInput("");
      setPinConfirm("");
      Alert.alert("Success", "Supervisor PIN updated");
    },
    onError: (e: any) => {
      Alert.alert("Error", e?.message || "Failed to set PIN");
    },
  });

  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  const daysUntilExpiry = pinData?.expires_at
    ? Math.max(0, Math.ceil((new Date(pinData.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const handleSavePin = () => {
    if (pinInput.length < 4) {
      Alert.alert("Error", "PIN must be 4-6 digits");
      return;
    }
    if (pinInput !== pinConfirm) {
      Alert.alert("Error", "PINs do not match");
      return;
    }
    savePin(pinInput);
  };

  return (
    <AppView>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Name */}
        <View style={[styles.avatarSection, { alignItems: "center" }]}>
          <View style={[styles.avatar, { backgroundColor: colors.buttonPrimary }]}>
            {user?.avatar_url ? (
              <Text style={styles.avatarText}>{initials}</Text>
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <Text style={[styles.name, { color: colors.text }]}>
            {user?.full_name || "Unknown User"}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.roleText, { color: colors.textSecondary }]}>
              {user?.role?.replace("_", " ")?.toUpperCase() || "USER"}
            </Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            ACCOUNT
          </Text>
          <InfoRow icon="mail" label="Email" value={user?.email} colors={colors} />
          <InfoRow icon="shield" label="Status" value={user?.status} colors={colors} />
          <InfoRow
            icon="clock"
            label="Last Login"
            value={user?.last_login_at ? formatRelativeTime(user.last_login_at) : "Never"}
            colors={colors}
          />
          <InfoRow
            icon="shopping-cart"
            label="Auto-Create Cart"
            value={user?.auto_create_cart ? "Enabled" : "Disabled"}
            colors={colors}
          />
        </View>

        {/* Security */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            SECURITY
          </Text>

          <Pressable
            onPress={() => {
              setPinInput("");
              setPinConfirm("");
              setPinSheetVisible(true);
            }}
            style={styles.pinRow}
          >
            <View style={styles.pinRowLeft}>
              <Lucide name="key-round" size={18} color="#aaa" />
              <View>
                <Text style={[styles.pinLabel, { color: colors.text }]}>
                  Supervisor PIN
                </Text>
                <Text style={[styles.pinStatus, { color: pinError ? "#e74c3c" : colors.textSecondary }]}>
                  {pinError
                    ? "Unable to load"
                    : pinData?.has_pin
                      ? daysUntilExpiry !== null
                        ? `Set — expires in ${daysUntilExpiry} days`
                        : "Set"
                      : "Not set"}
                </Text>
              </View>
            </View>
            <Lucide name="chevron-right" size={20} color="#aaa" />
          </Pressable>
        </View>
      </ScrollView>

      {/* PIN Sheet */}
      <AppBottomSheet
        visible={pinSheetVisible}
        onVisibleChange={setPinSheetVisible}
        snapPoints={["45%"]}
      >
        <Text style={[styles.sheetTitle, { color: colors.text }]}>
          {pinData?.has_pin ? "Update Supervisor PIN" : "Set Supervisor PIN"}
        </Text>
        <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
          4-6 digit PIN used for voiding cart items
        </Text>

        <View style={{ gap: 12, marginTop: 16 }}>
          <TextInput
            style={[styles.pinInput, { color: colors.text, borderColor: colors.backgroundElement }]}
            placeholder="Enter PIN"
            placeholderTextColor={colors.textSecondary}
            value={pinInput}
            onChangeText={setPinInput}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
            autoFocus
          />
          <TextInput
            style={[styles.pinInput, { color: colors.text, borderColor: colors.backgroundElement }]}
            placeholder="Confirm PIN"
            placeholderTextColor={colors.textSecondary}
            value={pinConfirm}
            onChangeText={setPinConfirm}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
          />

          <Pressable
            onPress={handleSavePin}
            disabled={isSavingPin || !pinInput.trim() || !pinConfirm.trim()}
            style={[
              styles.saveBtn,
              {
                backgroundColor:
                  !pinInput.trim() || !pinConfirm.trim()
                    ? colors.textSecondary
                    : colors.buttonPrimary,
              },
            ]}
          >
            {isSavingPin ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save PIN</Text>
            )}
          </Pressable>
        </View>
      </AppBottomSheet>
    </AppView>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value?: string | null;
  colors: any;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoRowLeft}>
      <Lucide name={icon as any} size={16} color="#aaa" />
      <Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
      {value || "—"}
    </Text>
  </View>
);

const formatRelativeTime = (iso: string) => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "—";
  }
};

export default ProfileScreen;

const styles = StyleSheet.create({
  avatarSection: { paddingTop: 16, gap: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700" },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  card: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 13 },
  pinRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pinRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  pinLabel: { fontSize: 14 },
  pinStatus: { fontSize: 12, marginTop: 2 },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetSubtitle: { fontSize: 13, marginTop: 4 },
  pinInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    letterSpacing: 4,
    textAlign: "center",
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
