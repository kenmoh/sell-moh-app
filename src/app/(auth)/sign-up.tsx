import AppView from "@/components/app-view";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { RegisterRequest } from "@/types/auth";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { z } from "zod";

const animateStep = () => {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(
      300,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity
    )
  );
};

const stepSchemas = [
  z.object({
    business_name: z.string().trim().min(1, "Business name is required"),
    business_email: z.string().trim().email("Enter a valid business email"),
  }),
  z.object({
    owner_name: z.string().trim().min(1, "Full name is required"),
    owner_email: z.string().trim().email("Enter a valid email"),
    owner_phone: z.string().trim().optional(),
  }),
  z
    .object({
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirm_password: z.string().min(1, "Confirm your password"),
    })
    .refine((data) => data.password === data.confirm_password, {
      path: ["confirm_password"],
      message: "Passwords do not match",
    }),
];

const STEP_LABELS = ["Business", "Owner", "Security"];

type RegisterField = keyof RegisterRequest;
type FormErrors = Partial<Record<RegisterField, string>>;

const SignUp = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegisterRequest>({
    business_name: "",
    business_email: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (field: RegisterField, value: string) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (
        field === "business_email" &&
        current.owner_email === current.business_email
      ) {
        next.owner_email = value;
      }
      return next;
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateStep = (): boolean => {
    const result = stepSchemas[step].safeParse(form);
    if (!result.success) {
      const nextErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as RegisterField;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      });
      setErrors(nextErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      animateStep();
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    animateStep();
    setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    if (!validateStep()) return;
    router.replace("/sign-in");
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
              Create Your Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Set up your store and start selling in minutes.
            </Text>
          </View>

          <View style={styles.steps}>
            {STEP_LABELS.map((label, i) => (
              <View key={label} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        i <= step
                          ? colors.buttonPrimary
                          : colors.backgroundSelected,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepDotText,
                      { color: i <= step ? "#fff" : colors.textSecondary },
                    ]}
                  >
                    {i + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    {
                      color: i <= step ? colors.text : colors.textSecondary,
                      fontWeight: i === step ? "600" : "400",
                    },
                  ]}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.form}>
            {step === 0 && (
              <>
                <AppTextInput
                  label="Business Name"
                  placeholder="My Store"
                  value={form.business_name}
                  onChangeText={(value) => updateField("business_name", value)}
                  leftIcon="building"
                  autoCapitalize="words"
                  error={errors.business_name}
                />
                <AppTextInput
                  label="Business Email"
                  placeholder="business@example.com"
                  value={form.business_email}
                  onChangeText={(value) =>
                    updateField("business_email", value)
                  }
                  leftIcon="mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.business_email}
                />
              </>
            )}

            {step === 1 && (
              <>
                <AppTextInput
                  label="Full Name"
                  placeholder="Alex Smith"
                  value={form.owner_name}
                  onChangeText={(value) => updateField("owner_name", value)}
                  leftIcon="user"
                  autoCapitalize="words"
                  error={errors.owner_name}
                />
                <AppTextInput
                  label="Email address"
                  placeholder="example@gmail.com"
                  value={form.owner_email}
                  onChangeText={(value) => updateField("owner_email", value)}
                  leftIcon="mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.owner_email}
                />
                <AppTextInput
                  label="Phone (optional)"
                  placeholder="+1234567890"
                  value={form.owner_phone}
                  onChangeText={(value) => updateField("owner_phone", value)}
                  leftIcon="phone"
                  keyboardType="phone-pad"
                  error={errors.owner_phone}
                />
              </>
            )}

            {step === 2 && (
              <>
                <AppTextInput
                  label="Password"
                  placeholder="@Sn123hsn#"
                  value={form.password}
                  onChangeText={(value) => updateField("password", value)}
                  leftIcon="lock"
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  error={errors.password}
                />
                <AppTextInput
                  label="Confirm Password"
                  placeholder="@Sn123hsn#"
                  value={form.confirm_password}
                  onChangeText={(value) =>
                    updateField("confirm_password", value)
                  }
                  leftIcon="lock"
                  secureTextEntry={!showPassword}
                  error={errors.confirm_password}
                />
              </>
            )}

            {step > 0 && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.backButton,
                    { borderColor: colors.backgroundSelected },
                  ]}
                  onPress={handleBack}
                >
                  <Text
                    style={[styles.backButtonText, { color: colors.text }]}
                  >
                    Back
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.buttonPrimary, flex: 1 },
                  ]}
                  onPress={step === 2 ? handleSubmit : handleNext}
                >
                  <Text style={styles.primaryButtonText}>
                    {step === 2 ? "Create Account" : "Next"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 0 && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.buttonPrimary },
                ]}
                onPress={handleNext}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dividerRow}>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: colors.backgroundSelected },
              ]}
            />
            <Text
              style={[styles.dividerText, { color: colors.textSecondary }]}
            >
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
            <Text
              style={[styles.footerText, { color: colors.textSecondary }]}
            >
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
              <Text
                style={[styles.footerLink, { color: colors.buttonPrimary }]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </AppView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingBottom: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
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
  steps: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 32,
  },
  stepItem: {
    alignItems: "center",
    gap: 6,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotText: {
    fontSize: 14,
    fontWeight: "700",
  },
  stepLabel: {
    fontSize: 12,
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
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
