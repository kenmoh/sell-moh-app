import type { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  children: ReactNode;
  /**
   * The horizontal padding of whatever contains this strip. The strip cancels
   * it out so chips travel all the way to the screen edge instead of being
   * clipped by the container, which reads as a slot they sink into.
   */
  inset?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A horizontally scrolling strip of chips that bleeds to the screen edges.
 *
 * A plain ScrollView rather than a FlatList: nesting one virtualised list
 * inside another (as a ListHeaderComponent) brings its own sizing and gesture
 * problems, and these strips only ever hold a handful of items.
 */
export default function PillRow({
  children,
  inset = 0,
  gap = 8,
  style,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={[styles.strip, { marginHorizontal: -inset }, style]}
      contentContainerStyle={[
        styles.content,
        { gap, paddingHorizontal: inset },
      ]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { flexGrow: 0 },
  // A little vertical breathing room so a pressed pill is not clipped by the
  // strip's own bounds.
  content: { paddingVertical: 4 },
});