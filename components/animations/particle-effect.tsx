import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

export interface ParticleEffectProps {
  color: string;
  delay: number;
}

/**
 * Particle Effect Component
 * Individual particle that animates upward and fades out
 */
export function ParticleEffect({ color, delay }: ParticleEffectProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    // Staggered animation based on delay
    const timer = setTimeout(() => {
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 300 })
      );

      translateY.value = withTiming(-120, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}
