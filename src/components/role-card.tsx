import type { FetchTenantRoles } from "@/types/auth";
import { Colors, type ColorPalette } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { memo, useMemo } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type Props = {
  role: FetchTenantRoles;
  expanded: boolean;
  onToggle: (roleId: string) => void;
  /** Number of staff assigned to this role, shown in the header when known. */
  memberCount?: number;
  /** Opens the edit sheet. Separate from toggling so the tap target is clear. */
  onEdit?: () => void;
};

const ANIM_MS = 220;

// Android keeps layout animation behind a flag. Enabling it at module load is
// idempotent and harmless where it is already on, and without it the card snaps
// open on Android while animating everywhere else.
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Chip text is the raw "resource:action" permission. Split it so the resource
 *  reads as the subject and the action as the qualifier. */
function splitPermission(permission: string): [string, string] {
  const [resource, ...rest] = permission.split(":");
  return [resource, rest.join(":")];
}

/**
 * One role in the roles list. Collapsed it is a single row; tapping expands it
 * in place to list the permissions the role actually grants.
 *
 * The height change goes through the native LayoutAnimation rather than an
 * animated style. Animating `height` from React meant measuring the expanded
 * content first, and a measurement that landed a frame late made the card jump
 * from full height down and back up; a Reanimated layout transition was worse,
 * re-measuring every sibling on every frame. This way the native side runs one
 * layout pass per toggle: no measurement, nothing to stutter, and the content
 * fades in and out with the height it occupies.
 *
 * The card also lifts above its neighbours while open, since a growing card that
 * keeps its original z-order gets painted over by the rows below it.
 */
function RoleCard({ role, expanded, onToggle, memberCount, onEdit }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const colors: ColorPalette = Colors[isDark ? "dark" : "light"];

  // Dedupe: the chips are keyed by permission name, and one repeated row would
  // render two children sharing a key.
  const permissions = useMemo(
    () => [...new Set(role.permissions ?? [])],
    [role.permissions],
  );
  const hasPermissions = permissions.length > 0;

  const rotation = useSharedValue(expanded ? 180 : 0);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Springs on the chevron: the rotation should feel attached to the press,
  // where the layout change is happy to be linear.
  const handlePress = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        ANIM_MS,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    rotation.value = withSpring(expanded ? 0 : 180, {
      damping: 18,
      stiffness: 190,
    });
    onToggle(role.id);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: expanded
            ? colors.buttonPrimary
            : isDark
              ? colors.backgroundElement
              : "#eef0f4",
          zIndex: expanded ? 1 : 0,
          elevation: expanded ? 2 : 0,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.header, { opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={[styles.icon, { backgroundColor: "rgba(59,130,246,0.1)" }]}>
          <Lucide name="shield" size={20} color="#3b82f6" />
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{role.name}</Text>
          <Text style={[styles.summary, { color: colors.textSecondary }]}>
            {hasPermissions
              ? `${permissions.length} permission${permissions.length === 1 ? "" : "s"}`
              : "No permissions"}
            {role.description ? ` · ${role.description}` : ""}
          </Text>
        </View>

        {typeof memberCount === "number" && memberCount > 0 && (
          <Text style={[styles.members, { color: colors.textSecondary }]}>
            {memberCount}
          </Text>
        )}

        {onEdit && (
          <Pressable
            onPress={onEdit}
            hitSlop={8}
            style={({ pressed }) => [
              styles.edit,
              {
                backgroundColor: colors.backgroundElement,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Lucide name="pencil" size={13} color={colors.textSecondary} />
          </Pressable>
        )}

        <Animated.View style={chevronStyle}>
          <Lucide name="chevron-down" size={16} color={colors.textSecondary} />
        </Animated.View>
      </Pressable>

      {expanded && (
        <View style={styles.chipsWrap}>
          {hasPermissions ? (
            <View style={styles.chips}>
              {permissions.map((permission) => {
                const [resource, action] = splitPermission(permission);
                return (
                  <View
                    key={`${resource}:${permission}`}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: isDark ? colors.card : "#e5e7eb",
                      },
                    ]}
                  >
                    <Text style={[styles.chipResource, { color: colors.text }]}>
                      {resource}
                    </Text>
                    <Text style={[styles.chipAction, { color: colors.textSecondary }]}>
                      {action}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              This role grants nothing yet. Edit it to add permissions.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export default memo(RoleCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
    overflow: "hidden",
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "700" },
  summary: { fontSize: 12, lineHeight: 16 },
  members: { fontSize: 12, fontWeight: "600" },
  edit: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chipsWrap: { paddingTop: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  chipResource: { fontSize: 11, fontWeight: "700" },
  chipAction: { fontSize: 11, fontWeight: "500" },
  empty: { fontSize: 12, fontStyle: "italic" },
});