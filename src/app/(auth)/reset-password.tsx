import { resetPassword } from "@/api/auth";
import AppView from "@/components/app-view";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { z } from "zod";

const schema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type Field = keyof z.infer<typeof schema>;

const ResetPassword = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const { token } = useLocalSearchParams<{ token: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const handleReset = async () => {
    const result = schema.safeParse({ new_password: newPassword, confirm_password: confirmPassword });
    if (!result.success) {
      const errs: Partial<Record<Field, string>> = {};
      result.error.issues.forEach((i) => {
        errs[i.path[0] as Field] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await resetPassword(token!, result.data.new_password);
      Alert.alert("Success", "Your password has been reset.", [
        { text: "OK", onPress: () => router.replace("/(auth)/sign-in") },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppView>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Lucide name="key-round" size={32} color="#3b82f6" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Reset Password
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your new password below.
        </Text>

        <View style={styles.form}>
          <AppTextInput
            label="New Password"
            placeholder="Min 8 characters"
            value={newPassword}
            onChangeText={(t) => {
              setNewPassword(t);
              setErrors((c) => ({ ...c, new_password: undefined }));
            }}
            leftIcon="lock"
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? "eye-off" : "eye"}
            onRightIconPress={() => setShowPassword(!showPassword)}
            error={errors.new_password}
          />
          <AppTextInput
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              setErrors((c) => ({ ...c, confirm_password: undefined }));
            }}
            leftIcon="lock"
            secureTextEntry
            error={errors.confirm_password}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={loading}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.buttonPrimary },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleReset}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </AppView>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(59,130,246,0.12)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  form: { gap: 16, marginTop: 16 },
  primaryButton: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
