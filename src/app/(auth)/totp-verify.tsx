import { login } from "@/api/auth";
import AppView from "@/components/app-view";
import { Colors } from "@/constants/theme";
import { useSession } from "@/lib/ctx";
import { LoginResponseData } from "@/types/auth";
import { Lucide } from "@react-native-vector-icons/lucide";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const TotpVerify = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const { signIn } = useSession();
  const { email, password } = useLocalSearchParams<{
    email: string;
    password: string;
  }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert("Invalid Code", "Please enter a 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const res = await login({
        email: email!,
        password: password!,
        totp_code: code,
      });
      const data = res.data as LoginResponseData;
      signIn(data.tokens.access_token, data.tokens.refresh_token, data.user);
      router.replace("/(tabs)/(pos)");
    } catch (err: any) {
      Alert.alert("Verification Failed", err.message || "Invalid TOTP code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppView>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Lucide name="shield" size={32} color="#3b82f6" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Two-Factor Authentication
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter the 6-digit code from your authenticator app.
        </Text>

        <View style={styles.codeContainer}>
          {Array.from({ length: 6 }).map((_, i) => (
            <TextInput
              key={i}
              style={[
                styles.codeBox,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundElement,
                  borderColor:
                    code.length === i ? "#3b82f6" : colors.backgroundElement,
                },
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={code[i] ?? ""}
              onChangeText={(t) => {
                const digit = t.replace(/[^0-9]/g, "");
                const next = code.split("");
                next[i] = digit;
                setCode(next.join("").slice(0, 6));
              }}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Backspace" && !code[i] && i > 0) {
                  const next = code.split("");
                  next[i - 1] = "";
                  setCode(next.join(""));
                }
              }}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={loading || code.length !== 6}
          style={[
            styles.primaryButton,
            {
              backgroundColor:
                code.length === 6 && !loading
                  ? colors.buttonPrimary
                  : colors.backgroundSelected,
            },
          ]}
          onPress={handleVerify}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backLink}
        >
          <Text style={[styles.backText, { color: colors.textSecondary }]}>
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </AppView>
  );
};

export default TotpVerify;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(59,130,246,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  codeContainer: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 16,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
  },
  primaryButton: {
    width: "100%",
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backLink: { marginTop: 16 },
  backText: { fontSize: 14, fontWeight: "600" },
});
