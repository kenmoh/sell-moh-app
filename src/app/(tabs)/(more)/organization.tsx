import {
  fetchBusinessSettings,
  updateBusinessSettings,
  uploadBusinessLogo,
} from "@/api/business";
import { Button } from "@/components/button";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/lib/ctx";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OrganizationScreen = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const { user } = useSession();
  const toast = useToast();
  const queryClient = useQueryClient();
  const canManage = user?.permissions?.includes("sync:manage") ?? false;

  const [draft, setDraft] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  }>({});

  const {
    data: business,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["business-settings"],
    queryFn: fetchBusinessSettings,
  });

  useApiErrorToast({ isError, error, title: "Couldn't load organization" });

  const name = draft.name ?? business?.name ?? "";
  const phone = draft.phone ?? business?.phone ?? "";
  const address = draft.address ?? business?.address ?? "";

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const trimmedAddress = address.trim();
  const nameInvalid = trimmedName.length < 2;
  const hasChanges =
    !!business &&
    (trimmedName !== (business.name ?? "") ||
      trimmedPhone !== (business.phone ?? "") ||
      trimmedAddress !== (business.address ?? ""));
  const canSave = canManage && hasChanges && !nameInvalid;

  const saveMutation = useMutation({
    mutationFn: () =>
      updateBusinessSettings({
        name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
      }),
    onSuccess: (updated) => {
      setDraft({});
      queryClient.setQueryData(["business-settings"], updated);
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
      toast.success(
        "Organization updated",
        "Your organization details were saved.",
      );
    },
    onError: (e: any) => {
      toast.error(
        "Couldn't update organization",
        e?.message || "Please try again.",
      );
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (uri: string) => uploadBusinessLogo(uri),
    onSuccess: (updated) => {
      queryClient.setQueryData(["business-settings"], updated);
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
      toast.success("Logo updated", "Your organization logo was saved.");
    },
    onError: (e: any) => {
      toast.error("Couldn't upload logo", e?.message || "Please try again.");
    },
  });

  const handlePickLogo = async () => {
    if (!canManage || uploadLogoMutation.isPending) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.warning("Permission needed", "Please grant photo library access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      uploadLogoMutation.mutate(result.assets[0].uri);
    }
  };

  const initials =
    trimmedName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "OR";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: true, title: "Organization" }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 24,
          gap: 24,
        }}
      >
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.buttonPrimary} />
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              Loading organization...
            </Text>
          </View>
        ) : isError ? (
          <View style={styles.centerState}>
            <Lucide
              name="circle-alert"
              size={28}
              color={colors.textSecondary}
            />
            <Text style={[styles.stateTitle, { color: colors.text }]}>
              {"Couldn't load organization details"}
            </Text>
            <Button onPress={() => refetch()} title="Try again" />
          </View>
        ) : (
          <>
            {!canManage && (
              <View
                style={[
                  styles.notice,
                  { backgroundColor: colors.backgroundElement },
                ]}
              >
                <Lucide name="lock" size={16} color={colors.textSecondary} />
                <Text
                  style={[styles.noticeText, { color: colors.textSecondary }]}
                >
                  Only the owner or a user with permission can edit these
                  details.
                </Text>
              </View>
            )}

            <View style={styles.logoSection}>
              <Pressable
                onPress={handlePickLogo}
                disabled={!canManage || uploadLogoMutation.isPending}
                style={styles.logoWrapper}
              >
                {business?.logo_url ? (
                  <Image
                    source={{ uri: business.logo_url }}
                    style={styles.logoImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.logo,
                      { backgroundColor: colors.buttonPrimary },
                    ]}
                  >
                    <Text style={styles.logoText}>{initials}</Text>
                  </View>
                )}
                {uploadLogoMutation.isPending && (
                  <View style={styles.logoOverlay}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
                {canManage && !uploadLogoMutation.isPending && (
                  <View
                    style={[
                      styles.editBadge,
                      { borderColor: colors.background },
                    ]}
                  >
                    <Lucide name="camera" size={12} color="#fff" />
                  </View>
                )}
              </Pressable>
              <Text style={[styles.logoHint, { color: colors.textSecondary }]}>
                {uploadLogoMutation.isPending
                  ? "Uploading logo..."
                  : canManage
                    ? "Tap to change logo"
                    : "Organization logo"}
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                ORGANIZATION INFORMATION
              </Text>
              <View style={styles.fieldStack}>
                <AppTextInput
                  label="Business name"
                  leftIcon="building-2"
                  value={name}
                  onChangeText={(value) =>
                    setDraft((prev) => ({ ...prev, name: value }))
                  }
                  editable={canManage}
                  maxLength={120}
                  placeholder="Your business name"
                  error={
                    name.length > 0 && nameInvalid
                      ? "Enter at least 2 characters"
                      : undefined
                  }
                />
                <AppTextInput
                  label="Phone"
                  leftIcon="phone"
                  value={phone}
                  onChangeText={(value) =>
                    setDraft((prev) => ({ ...prev, phone: value }))
                  }
                  editable={canManage}
                  keyboardType="phone-pad"
                  placeholder="Business phone number"
                />
                <AppTextInput
                  label="Address"
                  value={address}
                  onChangeText={(value) =>
                    setDraft((prev) => ({ ...prev, address: value }))
                  }
                  editable={canManage}
                  multiline
                  placeholder="Business address"
                />
              </View>
            </View>

            {canManage && (
              <Button
                disabled={!canSave}
                fullWidth
                leftIcon={(color) => <Lucide name="save" size={18} color={color} />}
                loading={saveMutation.isPending}
                onPress={() => saveMutation.mutate()}
                title="Save Changes"
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default OrganizationScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerSide: { width: 60, minHeight: 32, justifyContent: "center" },
  headerLeft: { alignItems: "flex-start" },
  headerRight: { alignItems: "flex-end" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  saveLink: { fontSize: 15, fontWeight: "600" },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    padding: 12,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18 },
  logoSection: { alignItems: "center", gap: 8 },
  logoWrapper: { position: "relative" },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: { width: 88, height: 88, borderRadius: 22 },
  logoOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 28, fontWeight: "800", color: "#fff" },
  editBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  logoHint: { fontSize: 13, fontWeight: "500" },
  fieldGroup: { gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  fieldStack: { gap: 12 },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  centerState: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  stateTitle: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  stateText: { fontSize: 13 },
  retryButton: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
  },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
