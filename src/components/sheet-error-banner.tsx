import { useToastContext } from "@/lib/toast-context";
import { Colors, type ColorPalette } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

/**
 * Shows error toasts inside the sheet's own window.
 *
 * A sheet is a native window — a `Dialog` on Android, a presented view
 * controller on iOS — so the app's toast layer cannot rise above it no matter
 * what z-index it uses. A toast raised while a sheet was open simply rendered
 * behind the sheet, which is why a failed cart creation looked like nothing
 * happened.
 *
 * Rendering it here instead puts it inside that same window, so it is visible.
 * The state is still the one toast context, so there is nothing extra to keep in
 * step: a toast raised here expires on the same timer, and the same dismiss
 * button removes it.
 *
 * Errors only. A success raised mid-sheet ("Saved") does not need to interrupt,
 * and leaving it to the app-level toast keeps the sheet uncluttered.
 */
export default function SheetErrorBanner() {
  const { toasts, dismissToast } = useToastContext();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];

  const latest = [...toasts].reverse().find((toast) => toast.type === "error");
  if (!latest) return null;

  return (
    <View
      // box-none so the banner does not swallow taps meant for the form
      // underneath it; only the dismiss button is touchable.
      pointerEvents="box-none"
      style={styles.container}
    >
      <Pressable
        onPress={() => dismissToast(latest.id)}
        style={[
          styles.banner,
          {
            backgroundColor: isDark ? "#2a1618" : "#fee2e2",
            borderColor: "rgba(220,38,38,0.35)",
          },
        ]}
      >
        <Lucide name="x-circle" size={16} color="#dc2626" />
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.text }]}>
            {latest.title}
          </Text>
          {!!latest.message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {latest.message}
            </Text>
          )}
        </View>
        <Lucide name="x" size={14} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 8,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 13, fontWeight: "700" },
  message: { fontSize: 12, lineHeight: 16 },
});