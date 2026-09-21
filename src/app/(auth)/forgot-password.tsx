import { forgotPassword } from "@/api/auth";
import AppView from "@/components/app-view";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

type ForgotField = keyof z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<ForgotField, string>>>(
    {},
  );

  const handleSendCode = async () => {
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const nextErrors: Partial<Record<ForgotField, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as ForgotField;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await forgotPassword(result.data.email);
      setSent(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AppView>
        <View style={styles.centered}>
          <Text style={[styles.title, { color: colors.text }]}>
            Check Your Email
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We've sent a password reset link to{"\n"}
            <Text style={{ fontWeight: "700", color: colors.text }}>
              {email}
            </Text>
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.buttonPrimary }]}
            onPress={() => router.replace("/(auth)/sign-in")}
          >
            <Text style={styles.primaryButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </AppView>
    );
  }

  return (
    <AppView>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Forgot Password?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email and we'll send you a password reset link.
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

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={loading}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.buttonPrimary },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleSendCode}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
            <Text style={[styles.footerLink, { color: colors.buttonPrimary }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppView>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
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
