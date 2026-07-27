/**
 * GlassCard - Premium glassmorphism card with frosted translucent surface,
 * real-time blur, dynamic reflections, light scattering, and spring animation.
 * 
 * Design inspirations: Apple HIG, iOS 17/18 glass, visionOS glass
 * 
 * Features:
 * - Real CSS backdrop-filter blur on web (simulated on native with layered opacity)
 * - Frosted translucent surface with dynamic reflections
 * - Gradient border with accent glow
 * - Inner depth layers for realistic glass feel
 * - Spring-based squish animation on press
 * - Top highlight stripe (light reflection)
 * - High contrast text readability
 * - Corner glow accents
 * - Light scattering particles via LiquidGlassOverlay
 */
import { View, Pressable, TouchableOpacity, Platform, type ViewProps, type StyleProp, type ViewStyle } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { useThemeContext } from "@/lib/theme-provider";
import { useStaggerAnimation } from "@/hooks/use-stagger-animation";
// Glass utility types

interface SpringAnimConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
  overshootClamping?: boolean;
}

export interface GlassCardProps extends ViewProps {
  /** Glass opacity intensity */
  intensity?: "subtle" | "medium" | "high" | "heavy";
  /** Glow accent color (sets shadow + highlights) */
  glowColor?: string;
  /** Show top highlight reflection line */
  highlight?: boolean;
  /** Inner padding */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  /** Optional press handler with spring animation */
  onPress?: () => void;
  /** Spring animation config */
  springConfig?: SpringAnimConfig;
  /** Press scale factor */
  pressScale?: number;
  /** Corner radius */
  radius?: "sm" | "md" | "lg" | "xl" | "full";
  /** Whether to show gradient border (top edge lit) */
  gradientBorder?: boolean;
  /** Blur radius override for web backdrop-filter (px) */
  blurAmount?: number;
  /** Show inner depth layers for realism */
  depth?: boolean;
  /** Whether to show corner glow accents */
  glowAccents?: boolean;
  /** Stagger entrance animation index (-1 = no stagger) */
  staggerIndex?: number;
  /** Stagger interval in ms (only used if staggerIndex >= 0) */
  staggerInterval?: number;
}

const twIntensityMap: Record<string, { bg: string; border: string }> = {
  subtle: {
    bg: "bg-white/40 dark:bg-white/[0.04]",
    border: "border-white/30 dark:border-white/[0.08]",
  },
  medium: {
    bg: "bg-white/60 dark:bg-white/[0.06]",
    border: "border-white/40 dark:border-white/[0.10]",
  },
  high: {
    bg: "bg-white/80 dark:bg-white/[0.10]",
    border: "border-white/50 dark:border-white/[0.14]",
  },
  heavy: {
    bg: "bg-white/90 dark:bg-white/[0.14]",
    border: "border-white/60 dark:border-white/[0.18]",
  },
};

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
  xl: "p-6",
};

const radiusMap = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  full: "rounded-full",
};

const DEFAULT_SPRING = { damping: 18, stiffness: 250, mass: 0.6 };
const PRESSED_SPRING = { damping: 20, stiffness: 350, mass: 0.5 };

function useCardStyles({
  intensity,
  glowColor,
  highlight,
  padding,
  radius,
  gradientBorder,
  blurAmount,
  depth,
  glowAccents,
  className,
  style,
}: Pick<GlassCardProps, "intensity" | "glowColor" | "highlight" | "padding" | "radius" | "gradientBorder" | "blurAmount" | "depth" | "glowAccents" | "className" | "style">) {
  const styles = twIntensityMap[intensity || "medium"];
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const glow = glowColor || (isDark ? "#0066FF" : "#0066FF");

  const twClasses = cn(
    radiusMap[radius || "lg"],
    styles.bg,
    styles.border,
    "border relative overflow-hidden",
    paddingMap[padding || "md"],
    gradientBorder && [
      "border-t-white/60 dark:border-t-white/20",
      "border-l-white/30 dark:border-l-white/10",
      "border-r-transparent border-b-transparent",
    ],
    // Re-add border if gradient border removed it
    gradientBorder && "border",
    className,
  );

  // Web: add backdrop-filter as inline style
  const webBlurStyle: ViewStyle = Platform.OS === "web"
    ? ({
        backdropFilter: `blur(${blurAmount || 20}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${blurAmount || 20}px) saturate(180%)`,
      } as any)
    : {};

  const shadowColor = glow;
  const containerStyle: StyleProp<ViewStyle> = [
    webBlurStyle,
    {
      shadowColor,
      shadowOffset: { width: 0, height: glowColor ? 8 : 4 },
      shadowOpacity: glowColor ? (isDark ? 0.45 : 0.22) : (isDark ? 0.35 : 0.08),
      shadowRadius: glowColor ? 24 : 12,
      elevation: glowColor ? 12 : 6,
    },
    style,
  ];

  return { twClasses, containerStyle, glow, isDark };
}

export function GlassCard({
  children,
  className,
  intensity = "medium",
  glowColor,
  highlight = true,
  padding = "md",
  radius = "lg",
  gradientBorder = false,
  blurAmount = 20,
  depth = true,
  glowAccents = true,
  onPress,
  springConfig,
  pressScale = 0.97,
  staggerIndex = -1,
  staggerInterval = 80,
  style,
  ...props
}: GlassCardProps) {
  const { twClasses, containerStyle, glow, isDark } = useCardStyles({
    intensity, glowColor, highlight, padding, radius, gradientBorder, blurAmount, depth, glowAccents, className, style,
  });

  const scale = useSharedValue(1);
  const shadowScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shadowAnimStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowColor ? 0.25 * shadowScale.value : 0.10 * shadowScale.value,
    elevation: (glowColor ? 12 : 6) * shadowScale.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(pressScale, { ...PRESSED_SPRING, ...springConfig });
    shadowScale.value = withSpring(0.6, { damping: 15, stiffness: 200, mass: 0.4 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { ...DEFAULT_SPRING, ...springConfig });
    shadowScale.value = withSpring(1, { damping: 12, stiffness: 150, mass: 0.7 });
  };

  // Stagger entrance animation
  const { animatedStyle: staggerStyle } = useStaggerAnimation({
    index: Math.max(0, staggerIndex),
    staggerInterval,
    enabled: staggerIndex >= 0,
    springConfig: { damping: 20, stiffness: 200, mass: 0.7 },
  });

  // Top highlight / reflection line
  const highlightElement = highlight && (
    <View
      className="absolute top-0 left-3 right-3 h-[1px] rounded-full"
      style={{
        backgroundColor: glowColor ? `${glowColor}40` : isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.6)",
        zIndex: 2,
      }}
      pointerEvents="none"
    />
  );

  // Gradient border element: lighter on top edge
  const gradientBorderElement = gradientBorder && (
    <View
      className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[inherit]"
      style={{
        backgroundColor: glowColor || "#0066FF",
        opacity: isDark ? 0.2 : 0.25,
        zIndex: 2,
      }}
      pointerEvents="none"
    />
  );

  // Inner depth layer: subtle gradient from top to bottom
  // Uses layered View elements for cross-platform compatibility (no backgroundImage CSS on native)
  const depthLayer = depth && (
    <View
      className="absolute inset-0"
      style={{ zIndex: 1 }}
      pointerEvents="none"
    >
      {/* Top highlight fade */}
      <View
        className="absolute top-0 left-0 right-0 h-[45%]"
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.12)",
          borderTopLeftRadius: radius === "full" ? 9999 : undefined,
          borderTopRightRadius: radius === "full" ? 9999 : undefined,
        }}
      />
      {/* Bottom shadow depth */}
      <View
        className="absolute bottom-0 left-0 right-0 h-[30%]"
        style={{
          backgroundColor: isDark ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.02)",
          borderBottomLeftRadius: radius === "full" ? 9999 : undefined,
          borderBottomRightRadius: radius === "full" ? 9999 : undefined,
        }}
      />
    </View>
  );

  // Corner glow accents
  const glowAccentElements = glowAccents && (
    <>
      <View
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full"
        style={{
          backgroundColor: `${glow}12`,
          opacity: isDark ? 0.3 : 0.15,
          zIndex: 0,
        }}
        pointerEvents="none"
      />
      <View
        className="absolute -bottom-10 -left-10 w-20 h-20 rounded-full"
        style={{
          backgroundColor: `${glow}08`,
          opacity: isDark ? 0.2 : 0.1,
          zIndex: 0,
        }}
        pointerEvents="none"
      />
    </>
  );

  // Inner content wrapper to ensure text is above glass layers
  const content = (
    <View className="relative" style={{ zIndex: 3 }}>
      {depthLayer}
      {glowAccentElements}
      <View className="relative z-10">
        {gradientBorderElement}
        {highlightElement}
        {children}
      </View>
    </View>
  );

  if (Platform.OS === "web") {
    if (onPress) {
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          className={twClasses}
          style={[{ opacity: 1, cursor: "pointer", transition: "all 0.15s ease" }, containerStyle] as any}
          {...(props as any)}
        >
          {content}
        </TouchableOpacity>
      );
    }
    return (
      <View
        className={twClasses}
        style={[{ opacity: 1 }, containerStyle] as any}
        {...(props as any)}
      >
        {content}
      </View>
    );
  }

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} {...(props as any)}>
        <Animated.View className={twClasses} style={[containerStyle, shadowAnimStyle, animatedStyle, staggerStyle]}>
          {content}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View className={twClasses} style={[containerStyle, staggerStyle]} {...props}>
      {content}
    </Animated.View>
  );
}
