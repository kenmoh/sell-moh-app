import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const StoreProfile = () => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const [storeName, setStoreName] = useState("Sunrise Supermart");
  const [businessType, setBusinessType] = useState("Supermarket");
  const [phone, setPhone] = useState("+234 801 234 5678");
  const [email, setEmail] = useState("sunrise@example.com");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("12 Adeola Odeku Street");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("Lagos");
  const [state, setState] = useState("Lagos State");
  const [country, setCountry] = useState("Nigeria");
  const [regNumber, setRegNumber] = useState("RC-1234567");
  const [taxId, setTaxId] = useState("");
  const [currency, setCurrency] = useState("Nigerian Naira (₦)");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Lucide name="chevron-left" size={24} color={colors.text} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Store Profile
        </Text>
        <Pressable onPress={() => {}}>
          <Text style={styles.saveLink}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
          gap: 24,
        }}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrapper}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>SS</Text>
            </View>
            <View style={styles.editBadge}>
              <Lucide name="camera" size={12} color="#fff" />
            </View>
          </View>
          <Pressable>
            <Text style={styles.changeLogo}>Change Logo</Text>
          </Pressable>
        </View>

        {/* Store Information */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            STORE INFORMATION
          </Text>
          <View style={styles.fieldStack}>
            <AppTextInput
              leftIcon="store"
              value={storeName}
              onChangeText={setStoreName}
            />
            <AppTextInput
              leftIcon="building"
              value={businessType}
              onChangeText={setBusinessType}
              rightIcon="chevron-down"
              onRightIconPress={() => {}}
            />
            <AppTextInput
              leftIcon="phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <AppTextInput
              leftIcon="mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <AppTextInput
              leftIcon="globe"
              value={website}
              onChangeText={setWebsite}
              placeholder="www.yourstore.com"
            />
          </View>
        </View>

        {/* Location */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            LOCATION
          </Text>
          <View style={styles.fieldStack}>
            <AppTextInput
              leftIcon="map-pin"
              value={address}
              onChangeText={setAddress}
            />
            <AppTextInput
              leftIcon="home"
              value={apartment}
              onChangeText={setApartment}
              placeholder="Apartment, suite, etc."
            />
            <AppTextInput
              leftIcon="building"
              value={city}
              onChangeText={setCity}
            />
            <AppTextInput
              leftIcon="map"
              value={state}
              onChangeText={setState}
              rightIcon="chevron-down"
              onRightIconPress={() => {}}
            />
            <AppTextInput
              leftIcon="flag"
              value={country}
              onChangeText={setCountry}
              rightIcon="chevron-down"
              onRightIconPress={() => {}}
            />
          </View>
        </View>

        {/* Business */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            BUSINESS
          </Text>
          <View style={styles.fieldStack}>
            <AppTextInput
              leftIcon="file-text"
              value={regNumber}
              onChangeText={setRegNumber}
            />
            <View style={styles.taxRow}>
              <View style={styles.taxInputWrapper}>
                <AppTextInput
                  leftIcon="hash"
                  value={taxId}
                  onChangeText={setTaxId}
                  placeholder="Enter tax ID"
                />
              </View>
              <Pressable style={styles.expandButton}>
                <Lucide name="maximize-2" size={14} color="#3b82f6" />
              </Pressable>
            </View>
            <AppTextInput
              leftIcon="dollar-sign"
              value={currency}
              onChangeText={setCurrency}
              rightIcon="chevron-down"
              onRightIconPress={() => {}}
            />
          </View>
        </View>

        {/* Save CTA */}
        <Pressable style={styles.saveButton}>
          <Lucide name="save" size={18} color="#fff" />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default StoreProfile;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  saveLink: { color: "#3b82f6", fontSize: 15, fontWeight: "600" },
  logoSection: { alignItems: "center", gap: 8 },
  logoWrapper: { position: "relative" },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
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
    borderColor: "#fff",
  },
  changeLogo: { color: "#3b82f6", fontSize: 14, fontWeight: "600" },
  fieldGroup: { gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  fieldStack: { gap: 10 },
  taxRow: { position: "relative" },
  taxInputWrapper: { flex: 1 },
  expandButton: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
