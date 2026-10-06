import { SLIDES } from "@/components/onboarding/slides";
import { Colors } from "@/constants/theme";
import { useOnboarding } from "@/lib/onboarding-context";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

type FinishTarget = "/(auth)/sign-in" | "/(auth)/sign-up";

function RiseText({
  active,
  delay,
  style,
  children,
}: {
  active: boolean;
  delay: number;
  style?: any;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    if (active) {
      p.value = withDelay(
        delay,
        withTiming(1, {
          duration: reduced ? 200 : 300,
          easing: EASE_OUT,
        }),
      );
    } else {
      p.value = withTiming(0, { duration: 140, easing: EASE_OUT });
    }
  }, [active, delay, reduced, p]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: reduced ? 0 : (1 - p.value) * 8 }],
  }));

  return <Animated.Text style={[style, animatedStyle]}>{children}</Animated.Text>;
}

function IlloWrap({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    if (active) {
      p.value = withDelay(
        40,
        withTiming(1, { duration: reduced ? 200 : 480, easing: EASE_OUT }),
      );
    } else {
      p.value = withTiming(0, { duration: 140, easing: EASE_OUT });
    }
  }, [active, reduced, p]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: reduced ? 1 : 0.88 + p.value * 0.12 }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

function Dot({ isActive }: { isActive: boolean }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const reduced = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(isActive ? 1 : 0, {
      duration: reduced ? 0 : 250,
      easing: EASE_OUT,
    });
  }, [isActive, reduced, p]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: 0.94 + p.value * 0.06 }],
  }));
  const circleStyle = useAnimatedStyle(() => ({ opacity: 1 - p.value }));

  return (
    <View style={styles.dotSlot}>
      <Animated.View
        style={[styles.dotCircle, { backgroundColor: colors.textSecondary }, circleStyle]}
      />
      <Animated.View
        style={[styles.dotPill, { backgroundColor: colors.buttonPrimary }, pillStyle]}
      />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduced ? 1 : scale.value }],
  }));

  return (
    <Animated.View style={[styles.buttonWrapper, animatedStyle]}>
      <Pressable
        style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
        onPress={onPress}
        onPressIn={() => {
          // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutable by design
          scale.value = withTiming(0.97, { duration: 120, easing: EASE_OUT });
        }}
        onPressOut={() => {
          // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutable by design
          scale.value = withTiming(1, { duration: 160, easing: EASE_OUT });
        }}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function Onboarding() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { complete } = useOnboarding();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const illoSize = Math.min(width - 40, Math.min(420, height * 0.52));
  const isLast = index === SLIDES.length - 1;

  const finish = (dest: FinishTarget) => {
    complete();
    setTimeout(() => router.replace(dest), 0);
  };

  const goTo = (next: number) => {
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index && i >= 0 && i < SLIDES.length) setIndex(i);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Pressable
        style={[styles.skip, { top: insets.top + 6 }]}
        onPress={() => finish("/(auth)/sign-in")}
        hitSlop={12}
      >
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>
          Skip
        </Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={onScroll}
        onMomentumScrollEnd={onScroll}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        renderItem={({ item, index: i }) => {
          const active = i === index;
          return (
            <View style={[styles.slide, { width }]}>
              <IlloWrap active={active}>
                <item.Illustration active={active} size={illoSize} />
              </IlloWrap>
              <RiseText active={active} delay={80} style={[styles.title, { color: colors.text }]}>
                {item.title}
              </RiseText>
              <RiseText
                active={active}
                delay={150}
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                {item.subtitle}
              </RiseText>
            </View>
          );
        }}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <Dot key={s.key} isActive={i === index} />
          ))}
        </View>
        <PrimaryButton
          label={isLast ? "Get started" : "Next"}
          onPress={() => {
            if (isLast) {
              finish("/(auth)/sign-up");
            } else {
              goTo(index + 1);
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  skip: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    padding: 4,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 28,
    lineHeight: 31,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  footer: {
    paddingTop: 8,
    gap: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dotSlot: {
    width: 22,
    height: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dotCircle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotPill: {
    position: "absolute",
    width: 22,
    height: 8,
    borderRadius: 4,
  },
  buttonWrapper: {
    marginHorizontal: 24,
    borderRadius: 999,
    overflow: "hidden",
  },
  button: {
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
