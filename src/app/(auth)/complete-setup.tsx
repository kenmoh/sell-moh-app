import AppView from "@/components/app-view";
import { Button } from "@/components/button";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { useToast } from "@/hooks/use-toast";
import { updateBusinessSettings } from "@/api/business";
import { useSession } from "@/lib/ctx";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { z } from "zod";

const schema = z.object({
  business_name: z.string().trim().min(2, "Business name is required"),
  phone: z.string().trim().min(6, "Enter a valid phone number"),
  address: z.string().trim().min(1, "Address is required"),
  country: z.string().trim().min(1, "Country is required"),
});

type Field = keyof z.infer<typeof schema>;

export default function CompleteSetupScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const toast = useToast();
  const { user } = useSession();

  const [form, setForm] = useState({
    business_name: user ? `${user.full_name}'s Business` : "",
    phone: "",
    address: "",
    country: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [loading, setLoading] = useState(false);

  const updateField = (field: Field, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSave = async () => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const nextErrors: Partial<Record<Field, string>> = {};
      result.error.issues.forEach((issue) => {
        nextErrors[issue.path[0] as Field] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await updateBusinessSettings({
        name: result.data.business_name,
        phone: result.data.phone,
        address: result.data.address,
        country: result.data.country,
      });
      toast.success("Welcome", "Your business details are saved");
      router.replace("/(tabs)/(pos)");
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to save your business details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppView>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { backgroundColor: colors.background },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: colors.buttonPrimary + "1A" }]}>
              <Lucide name="store" size={26} color={colors.buttonPrimary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>
                Complete Setup
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Tell us about your business to finish setting up your account.
              </Text>
            </View>
          </View>

          <AppTextInput
            label="Business Name"
            placeholder="Your business name"
            value={form.business_name}
            onChangeText={(t) => updateField("business_name", t)}
            leftIcon="store"
            error={errors.business_name}
          />
          <AppTextInput
            label="Phone"
            placeholder="Business phone"
            value={form.phone}
            onChangeText={(t) => updateField("phone", t)}
            leftIcon="phone"
            keyboardType="phone-pad"
            error={errors.phone}
          />
          <AppTextInput
            label="Address"
            placeholder="Business address"
            value={form.address}
            onChangeText={(t) => updateField("address", t)}
            leftIcon="map-pin"
            error={errors.address}
          />
          <AppTextInput
            label="Country"
            placeholder="Country"
            value={form.country}
            onChangeText={(t) => updateField("country", t)}
            leftIcon="globe"
            error={errors.country}
          />

          <Button
            loading={loading}
            onPress={handleSave}
            size="lg"
            style={styles.saveButton}
            title="Continue"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    marginTop: 8,
  },
});
