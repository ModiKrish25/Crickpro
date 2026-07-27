/**
 * useStaggerAnimation — Reanimated hook for staggered entrance animations.
 *
 * On Web: immediately shows at full opacity (Reanimated spring is unreliable on web).
 * On Native: uses Reanimated spring with staggered delay.
 *
 * Features:
 * - Spring-based opacity + translateY entrance on native
 * - Instant reveal on web (no animation delay blocking content)
 * - Configurable delay per index
 * - Auto-mounts on first render
 */
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type WithSpringConfig,
} from "react-native-reanimated";

export interface StaggerOptions {
  /** Index in the stagger sequence (0-based) */
  index?: number;
  /** Delay per item in ms (total delay = index * staggerInterval) */
  staggerInterval?: number;
  /** Initial offset distance in px (slide up from below) */
  translateY?: number;
  /** Initial scale (0.95 = subtle zoom in) */
  initialScale?: number;
  /** Initial opacity (0 = fade in) */
  initialOpacity?: number;
  /** Spring configuration for the entrance */
  springConfig?: WithSpringConfig;
  /** Whether the animation is enabled */
  enabled?: boolean;
}

const DEFAULT_SPRING: WithSpringConfig = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

/**
 * Returns animated styles with staggered entrance animation.
 *
 * @example
 * const { animatedStyle } = useStaggerAnimation({ index: 1 });
 * return <Animated.View style={animatedStyle} />;
 */
export function useStaggerAnimation(options: StaggerOptions = {}) {
  const {
    index = 0,
    staggerInterval = 80,
    translateY = 24,
    initialOpacity = 0,
    springConfig = DEFAULT_SPRING,
    enabled = true,
  } = options;

  // On Web: always start at final values — Reanimated springs are unreliable on web
  // and leave content invisible at opacity:0
  const isWeb = Platform.OS === "web";
  const startOpacity = isWeb ? 1 : initialOpacity;
  const startY = isWeb ? 0 : translateY;

  const opacity = useSharedValue(startOpacity);
  const offsetY = useSharedValue(startY);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Web: no animation needed — already at final values
    if (isWeb || !enabled) {
      opacity.value = 1;
      offsetY.value = 0;
      return;
    }

    const delay = index * staggerInterval;

    const timer = setTimeout(() => {
      if (!mountedRef.current) return;
      (opacity as any).value = withSpring(1 as any, { damping: 18, stiffness: 200, mass: 0.8 } as any);
      (offsetY as any).value = withSpring(0 as any, { damping: 20, stiffness: 180, mass: 0.8 } as any);
    }, delay);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, [index, staggerInterval, enabled, isWeb]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: offsetY.value },
    ],
  }));

  return { animatedStyle };
}
