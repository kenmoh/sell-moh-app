import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const SignIn = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.heroSection}>
          <View style={[styles.logoWrap, { backgroundColor: colors.card }]}>
            <View style={styles.logoBadge}>
              <Lucide name="store" size={24} color="#ffffff" />
            </View>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome back
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to continue managing your business.
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
          <AppTextInput
            label="Email"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            leftIcon="mail"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <AppTextInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            leftIcon="lock"
            secureTextEntry
            rightIcon="eye"
          />

          <TouchableOpacity activeOpacity={0.8} style={styles.forgotRow}>
            <Text style={[styles.forgotText, { color: colors.textSecondary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: colors.backgroundElement },
              ]}
            />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
              or continue with
            </Text>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: colors.backgroundElement },
              ]}
            />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.socialButton,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Lucide name="apple" size={18} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.socialButton,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Lucide name="chrome" size={18} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.socialButton,
                { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Lucide name="facebook" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don’t have an account?
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/sign-up")}
            >
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  formCard: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  forgotRow: {
    alignSelf: "flex-end",
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: "700",
  },
});
