import AppView from "@/components/app-view";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

type StepKey = 0 | 1 | 2;

const SignUp = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [step, setStep] = useState<StepKey>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [businessType, setBusinessType] = useState("Retail");

  const canContinue = useMemo(() => {
    if (step === 0) {
      return Boolean(
        name &&
        email &&
        password &&
        confirmPassword &&
        password === confirmPassword,
      );
    }

    if (step === 1) {
      return Boolean(storeName && phone && role);
    }

    return true;
  }, [confirmPassword, email, name, password, phone, role, step, storeName]);

  const stepTitles = ["Account", "Business", "Review"];
  const stepDescriptions = [
    "Create your account details",
    "Tell us about your store",
    "Confirm and finish setup",
  ];

  const goNext = () => {
    if (step < 2) {
      setStep((prev) => (prev + 1) as StepKey);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep((prev) => (prev - 1) as StepKey);
    } else {
      router.back();
    }
  };

  const handleSubmit = () => {
    router.replace("/sign-in");
  };

  return (
    <AppView>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressRow}>
          {stepTitles.map((label, index) => {
            const active = step >= index;
            return (
              <View key={label} style={styles.progressItem}>
                <View
                  style={[
                    styles.progressDot,
                    active && styles.progressDotActive,
                  ]}
                >
                  {active ? (
                    <Text style={styles.progressDotText}>{index + 1}</Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.progressLabel,
                    { color: active ? colors.text : colors.textSecondary },
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ gap: 22 }}>
          {step === 0 ? (
            <>
              <AppTextInput
                label="Full name"
                placeholder="Alex Morgan"
                value={name}
                onChangeText={setName}
                leftIcon="user"
                autoCapitalize="words"
              />

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
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                leftIcon="lock"
                secureTextEntry
              />

              <AppTextInput
                label="Confirm password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                leftIcon="shield-check"
                secureTextEntry
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <AppTextInput
                label="Store name"
                placeholder="TapConnect Store"
                value={storeName}
                onChangeText={setStoreName}
                leftIcon="store"
              />

              <AppTextInput
                label="Phone"
                placeholder="0800 123 456"
                value={phone}
                onChangeText={setPhone}
                leftIcon="phone"
                keyboardType="phone-pad"
              />

              <AppTextInput
                label="Your role"
                placeholder="Owner / Manager"
                value={role}
                onChangeText={setRole}
                leftIcon="user"
                autoCapitalize="words"
              />

              <View style={styles.optionCard}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  Business type
                </Text>
                <View style={styles.optionRow}>
                  {["Retail", "Wholesale", "Food"].map((option) => {
                    const selected = businessType === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        activeOpacity={0.8}
                        onPress={() => setBusinessType(option)}
                        style={[
                          styles.optionChip,
                          selected && styles.optionChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            selected && styles.optionChipTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}

          {step === 2 ? (
            <View style={styles.reviewCard}>
              <Text style={[styles.reviewTitle, { color: colors.text }]}>
                You’re ready to go
              </Text>
              <Text
                style={[styles.reviewText, { color: colors.textSecondary }]}
              >
                Review your details and create your account to start managing
                your store.
              </Text>
              <View style={styles.summaryBox}>
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  Name
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {name || "—"}
                </Text>
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  Email
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {email || "—"}
                </Text>
                <Text
                  style={[styles.summaryLabel, { color: colors.textSecondary }]}
                >
                  Store
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {storeName || "—"}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={goBack}
              style={styles.secondaryButton}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: colors.textSecondary },
                ]}
              >
                {step === 0 ? "Sign in" : "Back"}
              </Text>
            </TouchableOpacity>

            {step < 2 ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={goNext}
                disabled={!canContinue}
                style={[
                  styles.primaryButton,
                  !canContinue && styles.primaryButtonDisabled,
                ]}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSubmit}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Create account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </AppView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    // paddingVertical: 24,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 16,
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
    maxWidth: 300,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  progressItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  progressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotActive: {
    backgroundColor: "#4f46e5",
  },
  progressDotText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  formCard: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  optionCard: {
    gap: 10,
    paddingTop: 4,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  optionChipSelected: {
    backgroundColor: "#4f46e5",
  },
  optionChipText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
  },
  optionChipTextSelected: {
    color: "#ffffff",
  },
  reviewCard: {
    gap: 8,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 12,
    gap: 4,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#4f46e5",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
