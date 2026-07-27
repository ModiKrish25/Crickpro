/**
 * BrandReveal — Logo formation + app name stagger + tagline.
 *
 * After the ball/wicket impact, the cricket elements morph into
 * the app brand identity using scale, blur-to-sharp, and staggered
 * letter reveals.
 */
import { View, Text } from "react-native";
import { useEffect, useCallback } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { TIMELINE, SPRING, getLogoSize } from "./animation-config";

interface BrandRevealProps {
  /** Screen width for responsive sizing */
  screenWidth: number;
  /** App name to display */
  appName?: string;
  /** Tagline to display */
  tagline?: string;
  /** Whether to animate */
  animate?: boolean;
  /** Callback when brand reveal is complete */
  onRevealComplete?: () => void;
}

const DEFAULT_APP_NAME = "CRICKPRO";
const DEFAULT_TAGLINE = "Every Ball. Every Moment.";

// ─── Individual animated letter ─────────────────────────────────────────

function AnimatedLetter({
  letter,
  index,
  animate,
  delay,
  reducedMotion,
  fontSize,
}: {
  letter: string;
  index: number;
  animate: boolean;
  delay: number;
  reducedMotion: boolean;
  fontSize: number;
}) {
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const offsetY = useSharedValue(reducedMotion ? 0 : 12);

  useEffect(() => {
    if (!animate) return;
    const d = delay + index * 40;
    opacity.value = withDelay(d, withSpring(1, { damping: 14, stiffness: 160, mass: 0.6 }));
    offsetY.value = withDelay(d, withSpring(0, { damping: 16, stiffness: 180, mass: 0.5 }));
  }, [animate, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: offsetY.value }],
  }));

  return (
    <Animated.Text
      className="font-bold tracking-widest"
      style={[style, { fontSize, color: "#FFFFFF", fontWeight: "800" }]}
    >
      {letter === " " ? "\u00A0" : letter}
    </Animated.Text>
  );
}

// ─── Main component ─────────────────────────────────────────────────────

export function BrandReveal({
  screenWidth,
  appName = DEFAULT_APP_NAME,
  tagline = DEFAULT_TAGLINE,
  animate = true,
  onRevealComplete,
}: BrandRevealProps) {
  const reducedMotion = useReducedMotion();
  const logoSize = getLogoSize(screenWidth);

  // Logo reveal
  const logoScale = useSharedValue(reducedMotion ? 1 : 0);
  const logoOpacity = useSharedValue(reducedMotion ? 1 : 0);

  // Tagline
  const taglineOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const taglineOffset = useSharedValue(reducedMotion ? 0 : 10);

  const letters = appName.split("");

  useEffect(() => {
    if (!animate) return;

    const logoDelay = TIMELINE.LOGO_TRANSFORM_START * 1000;
    const taglineDelay = TIMELINE.TAGLINE_APPEAR * 1000;

    // 1. Logo reveal: morph from cricket symbol
    logoScale.value = withDelay(
      logoDelay,
      withSequence(
        withTiming(0.8, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withSpring(1.05, SPRING.BOUNCY),
        withSpring(1, SPRING.SMOOTH),
      ),
    );
    logoOpacity.value = withDelay(logoDelay, withTiming(1, { duration: 400 }));

    // 2. Tagline
    taglineOpacity.value = withDelay(taglineDelay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    taglineOffset.value = withDelay(taglineDelay, withSpring(0, SPRING.SMOOTH));

    // 3. Callback after all animations
    const totalDuration = taglineDelay + 800;
    const timer = setTimeout(() => onRevealComplete?.(), totalDuration);
    return () => clearTimeout(timer);
  }, [animate, reducedMotion]);

  // ─── Animated styles ─────────────────────────────────────────────────

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineOffset.value }],
  }));

  const fontSize = Math.max(28, Math.min(screenWidth * 0.08, 42));
  const taglineFs = Math.max(12, Math.min(screenWidth * 0.035, 16));

  return (
    <View className="items-center gap-5">
      {/* Logo */}
      <Animated.View style={logoStyle}>
        <View
          className="items-center justify-center"
          style={{
            width: logoSize * 2,
            height: logoSize,
          }}
        >
          {/* Cricket ball + stumps combined logo */}
          <View className="items-center justify-center relative">
            {/* Ball */}
            <View
              className="rounded-full absolute"
              style={{
                width: logoSize * 0.5,
                height: logoSize * 0.5,
                backgroundColor: "#CC0000",
                top: -logoSize * 0.2,
                shadowColor: "#CC0000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 8,
              }}
            />
            {/* Stumps */}
            <View className="flex-row items-end" style={{ gap: 3, marginTop: logoSize * 0.15 }}>
              <View style={{ width: 4, height: logoSize * 0.35, backgroundColor: "#D4A017", borderRadius: 1 }} />
              <View style={{ width: 4, height: logoSize * 0.38, backgroundColor: "#E8B830", borderRadius: 1 }} />
              <View style={{ width: 4, height: logoSize * 0.35, backgroundColor: "#D4A017", borderRadius: 1 }} />
            </View>
            {/* Bail */}
            <View
              className="absolute"
              style={{
                width: 22,
                height: 2.5,
                backgroundColor: "#D4A017",
                top: logoSize * 0.35,
                borderRadius: 1,
              }}
            />
          </View>
        </View>
      </Animated.View>

      {/* App name — staggered letters (each letter is its own AnimatedLetter component) */}
      <View className="flex-row justify-center" style={{ gap: 1 }}>
        {letters.map((letter, i) => (
          <AnimatedLetter
            key={`${i}-${letter}`}
            letter={letter}
            index={i}
            animate={animate}
            delay={TIMELINE.APP_NAME_APPEAR * 1000}
            reducedMotion={reducedMotion}
            fontSize={fontSize}
          />
        ))}
      </View>

      {/* Tagline */}
      <Animated.Text
        className="text-center"
        style={[
          taglineStyle,
          {
            fontSize: taglineFs,
            color: "rgba(183, 255, 62, 0.7)",
            fontWeight: "500",
            letterSpacing: 2,
            textTransform: "uppercase" as const,
          },
        ]}
      >
        {tagline}
      </Animated.Text>
    </View>
  );
}

export default BrandReveal;
