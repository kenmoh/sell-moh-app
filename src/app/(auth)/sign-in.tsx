import { login } from "@/api/auth";
import AppView from "@/components/app-view";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { useSession } from "@/lib/ctx";
import { LoginResponseData } from "@/types/auth";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type SignInField = keyof z.infer<typeof signInSchema>;

const SignIn = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<SignInField, string>>>({});

  const handleSignIn = async () => {
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      const nextErrors: Partial<Record<SignInField, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as SignInField;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const res = await login({ email: result.data.email, password: result.data.password });
      const data = res.data as LoginResponseData;

      if (data.requires_totp) {
        Alert.alert(
          "TOTP Required",
          "Please complete two-factor authentication.",
        );
        return;
      }

      signIn(data.tokens.access_token, data.tokens.refresh_token, data.user);
      router.replace("/(tabs)/(pos)");
    } catch (err: any) {
      Alert.alert("Sign In Failed", err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <AppView>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome Back!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to manage your store, sales, and inventory.
          </Text>
        </View>

        <View style={styles.form}>
          <AppTextInput
            label="Email address"
            placeholder="example@gmail.com"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setErrors((c) => ({ ...c, email: undefined }));
            }}
            leftIcon="mail"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />

          <AppTextInput
            label="Password"
            placeholder="@Sn123hsn#"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setErrors((c) => ({ ...c, password: undefined }));
            }}
            leftIcon="lock"
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? "eye-off" : "eye"}
            onRightIconPress={() => setShowPassword(!showPassword)}
            error={errors.password}
          />

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: colors.textSecondary },
                  rememberMe && {
                    backgroundColor: colors.buttonPrimary,
                    borderColor: colors.buttonPrimary,
                  },
                ]}
              >
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text
                style={[styles.rememberText, { color: colors.textSecondary }]}
              >
                Remember me
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text style={[styles.linkText, { color: colors.buttonPrimary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSignIn}
            disabled={loading}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.buttonPrimary },
              loading && { opacity: 0.7 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign in</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View
            style={[
              styles.dividerLine,
              { backgroundColor: colors.backgroundSelected },
            ]}
          />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
            Or continue with
          </Text>
          <View
            style={[
              styles.dividerLine,
              { backgroundColor: colors.backgroundSelected },
            ]}
          />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.socialButton,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <Text style={styles.socialIcon}>G</Text>
            <Text style={[styles.socialLabel, { color: colors.text }]}>
              Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.socialButton,
              { backgroundColor: colors.backgroundElement },
            ]}
          >
            <Text style={styles.socialIcon}></Text>
            <Text style={[styles.socialLabel, { color: colors.text }]}>
              Apple
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
            <Text style={[styles.footerLink, { color: colors.buttonPrimary }]}>
              Sign up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </AppView>
    </KeyboardAvoidingView>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  form: {
    gap: 16,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  rememberText: {
    fontSize: 13,
    fontWeight: "500",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 50,
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: "700",
  },
  socialLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
