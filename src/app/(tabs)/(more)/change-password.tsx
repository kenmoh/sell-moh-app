import { changePassword } from "@/api/auth";
import AppView from "@/components/app-view";
import { Button } from "@/components/button";
import AppTextInput from "@/components/text-input";
import { useToast } from "@/hooks/use-toast";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { z } from "zod";

const schema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })
  .refine((d) => d.new_password !== d.current_password, {
    message: "New password must be different",
    path: ["new_password"],
  });

type Field = keyof z.infer<typeof schema>;

export default function ChangePasswordScreen() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const handleChange = async () => {
    const result = schema.safeParse({
      current_password: current,
      new_password: newPass,
      confirm_password: confirm,
    });
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
      await changePassword({
        current_password: result.data.current_password,
        new_password: result.data.new_password,
      });
      toast.success("Success", "Password changed");
      router.back();
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppView>
      <View style={styles.container}>
        <View style={styles.form}>
          <AppTextInput
            label="Current Password"
            placeholder="Enter current password"
            value={current}
            onChangeText={(t) => {
              setCurrent(t);
              setErrors((c) => ({ ...c, current_password: undefined }));
            }}
            leftIcon="lock"
            secureTextEntry
            error={errors.current_password}
          />
          <AppTextInput
            label="New Password"
            placeholder="Min 8 characters"
            value={newPass}
            onChangeText={(t) => {
              setNewPass(t);
              setErrors((c) => ({ ...c, new_password: undefined }));
            }}
            leftIcon="lock"
            secureTextEntry
            error={errors.new_password}
          />
          <AppTextInput
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirm}
            onChangeText={(t) => {
              setConfirm(t);
              setErrors((c) => ({ ...c, confirm_password: undefined }));
            }}
            leftIcon="lock"
            secureTextEntry
            error={errors.confirm_password}
          />

          <Button
            loading={loading}
            onPress={handleChange}
            size="lg"
            style={styles.primaryButton}
            title="Update Password"
          />
        </View>
      </View>
    </AppView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 5 },
  header: { alignItems: "center", marginBottom: 32 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  form: { gap: 16 },
  primaryButton: {
    marginTop: 8,
  },
});
