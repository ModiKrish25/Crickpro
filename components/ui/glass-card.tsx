/**
 * GlassCard - Reusable glassmorphism card component with spring press animation
 * 
 * Features:
 * - Frosted glass background (semi-transparent with backdrop blur simulation)
 * - Subtle border highlight (light top edge, darker bottom)
 * - Depth shadow for spatial layering
 * - Spring-based squish/bounce animation on press (when `onPress` is provided)
 * - Works cross-platform (web + native)
 * 
 * Usage:
 * <GlassCard>
 *   <Text className="text-foreground">Content</Text>
 * </GlassCard>
 *
 * <GlassCard onPress={() => {}} intensity="high" glowColor="#0a7ea4">
 *   <Text>Pressable with spring animation</Text>
 * </GlassCard>
 */
import { View, Pressable, type ViewProps, type StyleProp, type ViewStyle } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

/**
 * Spring animation config shape accepted by withSpring.
 * Common properties: damping, stiffness, mass, overshootClamping.
 */
interface SpringAnimConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
  overshootClamping?: boolean;
}

export interface GlassCardProps extends ViewProps {
  /** Glass intensity: subtle (default), medium, high */
  intensity?: "subtle" | "medium" | "high";
  /** Optional glow color for the border highlight */
  glowColor?: string;
  /** Whether to show the top highlight line */
  highlight?: boolean;
  /** Inner padding size */
  padding?: "none" | "sm" | "md" | "lg";
  /**
   * Optional press handler. When provided, the card becomes pressable
   * with a spring-based squish/bounce animation.
   */
  onPress?: () => void;
  /**
   * Spring animation config for the press feel.
   * Default: { damping: 18, stiffness: 250, mass: 0.6 }
   */
  springConfig?: SpringAnimConfig;
  /**
   * Scale factor when pressed. Default: 0.97
   */
  pressScale?: number;
}

const intensityMap = {
  subtle: {
    bg: "bg-white/5 dark:bg-white/5",
    border: "border-white/10 dark:border-white/10",
  },
  medium: {
    bg: "bg-white/[0.08] dark:bg-white/[0.08]",
    border: "border-white/20 dark:border-white/20",
  },
  high: {
    bg: "bg-white/[0.12] dark:bg-white/[0.12]",
    border: "border-white/25 dark:border-white/25",
  },
};

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

const DEFAULT_SPRING = {
  damping: 18,
  stiffness: 250,
  mass: 0.6,
};

const PRESSED_SPRING = {
  damping: 20,
  stiffness: 350,
  mass: 0.5,
};

/**
 * Build the base card styles shared between pressable and non-pressable variants.
 */
function useCardStyles({
  intensity,
  glowColor,
  highlight,
  padding,
  className,
  style,
}: Pick<GlassCardProps, "intensity" | "glowColor" | "highlight" | "padding" | "className" | "style">): {
  twClasses: string;
  containerStyle: StyleProp<ViewStyle>;
} {
  const styles = intensityMap[intensity || "medium"];

  const twClasses = cn(
    "rounded-2xl",
    styles.bg,
    styles.border,
    "border",
    paddingMap[padding || "md"],
    className,
  );

  const containerStyle: StyleProp<ViewStyle> = [
    {
      shadowColor: glowColor || "#000",
      shadowOffset: { width: 0, height: highlight !== false ? 4 : 2 },
      shadowOpacity: glowColor ? 0.25 : 0.08,
      shadowRadius: glowColor ? 12 : 6,
      elevation: glowColor ? 8 : 3,
      ...(highlight !== false && {
        borderTopColor: "rgba(255,255,255,0.3)",
        borderLeftColor: "rgba(255,255,255,0.1)",
        borderRightColor: "rgba(255,255,255,0.05)",
        borderBottomColor: "rgba(255,255,255,0.02)",
      }),
    },
    style,
  ];

  return { twClasses, containerStyle };
}

export function GlassCard({
  children,
  className,
  intensity = "medium",
  glowColor,
  highlight = true,
  padding = "md",
  onPress,
  springConfig,
  pressScale = 0.97,
  style,
  ...props
}: GlassCardProps) {
  const colors = useColors();
  const { twClasses, containerStyle } = useCardStyles({
    intensity,
    glowColor,
    highlight,
    padding,
    className,
    style,
  });

  // Spring animation shared values
  const scale = useSharedValue(1);
  const shadowScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shadowAnimStyle = useAnimatedStyle(() => ({
    shadowOpacity:
      glowColor
        ? 0.25 * shadowScale.value
        : 0.08 * shadowScale.value,
    elevation: (glowColor ? 8 : 3) * shadowScale.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(pressScale, {
      ...PRESSED_SPRING,
      ...springConfig,
    });
    shadowScale.value = withSpring(0.6, {
      damping: 15,
      stiffness: 200,
      mass: 0.4,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      ...DEFAULT_SPRING,
      ...springConfig,
    });
    shadowScale.value = withSpring(1, {
      damping: 12,
      stiffness: 150,
      mass: 0.7,
    });
  };

  // Shared highlight element
  const highlightElement = highlight && (
    <View
      className="absolute top-0 left-3 right-3 h-[1px] rounded-full"
      style={{
        backgroundColor: glowColor
          ? `${glowColor}40`
          : "rgba(255,255,255,0.35)",
      }}
      pointerEvents="none"
    />
  );

  // When onPress is provided, wrap in Pressable with spring animation
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...(props as any)}
      >
        <Animated.View
          className={twClasses}
          style={[containerStyle, shadowAnimStyle, animatedStyle]}
        >
          {highlightElement}
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  // Non-pressable: render as a plain View
  return (
    <View className={twClasses} style={containerStyle} {...props}>
      {highlightElement}
      {children}
    </View>
  );
}
