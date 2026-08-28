import AppView from "@/components/app-view";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import { useState } from "react";
import {
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
  const [errors, setErrors] = useState<Partial<Record<ForgotField, string>>>(
    {},
  );

  const handleSendCode = () => {
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
    // TODO: Implement send code logic
    console.log("Send code to:", result.data.email);
  };

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
            Enter your email and we'll send a 5-digit verification code
            instantly.
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
            style={[
              styles.primaryButton,
              { backgroundColor: colors.buttonPrimary },
            ]}
            onPress={handleSendCode}
          >
            <Text style={styles.primaryButtonText}>Send Code</Text>
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
